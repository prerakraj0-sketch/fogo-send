import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: !!process.env.GEMINI_API_KEY });
});

// Endpoint: Generate tailored message
app.post("/api/generate-message", async (req, res) => {
  try {
    const {
      recipient,
      channel,
      intent,
      tone,
      length,
      language = "English",
      senderName = "Me",
      additionalContext = "",
    } = req.body;

    if (!intent || !intent.trim()) {
      return res.status(400).json({ error: "Message intent/prompt is required." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // High quality fallback draft when API key is pending
      const recipientName = recipient?.name?.trim() || "Recipient";
      const isEmail = channel === "email";
      const subject = isEmail ? `Regarding: ${intent.slice(0, 40)}` : undefined;
      const greeting = isEmail ? `Dear ${recipientName},` : `Hi ${recipientName},`;
      const signoff = isEmail ? `Best regards,\n${senderName}` : `Thanks, ${senderName}`;
      
      const body = `${greeting}\n\nI am writing to reach out regarding ${intent.trim()}.${additionalContext ? `\n\nContext: ${additionalContext}` : ""}\n\nPlease let me know your thoughts or when you might have a few moments to connect.\n\n${signoff}`;

      return res.json({
        id: `msg_${Date.now()}`,
        subject,
        body,
        callToAction: "Connect or provide feedback",
        toneAnalysis: `${tone || 'balanced'} tone crafted for ${channel}`,
        readingTime: "~20 sec",
        keyPoints: [intent.slice(0, 50), "Clear call-to-action requested"],
        alternativeVariants: [
          {
            title: "Ultra Concise",
            description: "Straight to the point without extra pleasantries",
            subject: isEmail ? `Quick note: ${intent.slice(0, 30)}` : undefined,
            body: `Hi ${recipientName} - quick note regarding ${intent.trim()}. Let me know your thoughts when you have a chance! - ${senderName}`
          },
          {
            title: "More Formal",
            description: "Polished and diplomatic framing",
            subject: isEmail ? `Inquiry regarding: ${intent.slice(0, 35)}` : undefined,
            body: `Dear ${recipientName},\n\nI hope this message finds you well. I would appreciate the opportunity to discuss ${intent.trim()}.\n\nKind regards,\n${senderName}`
          }
        ]
      });
    }

    const systemInstruction = `You are an elite communication strategist and AI executive message writer.
Your mission is to draft human-sounding, high-impact, persuasive messages tailored exactly for the target recipient, channel, tone, and length.
- Channel specifics:
  * email: Include a compelling, clear subject line (under 60 chars) and structured paragraphs.
  * whatsapp: Engaging, easy-to-read, conversational, natural formatting, optional light emoji if tone allows.
  * sms: Short, impactful, under 160 characters if length is 'short', no unnecessary fluff.
  * slack: Modern workplace style, clear bullet points if multiple items, approachable yet effective.
  * linkedin: Professional, value-driven, respectful of time, personalized.
- Language: Output all message fields in the requested language: "${language}".
- Respect tone: ${tone} (e.g., professional, warm_friendly, direct_concise, persuasive, apologetic, urgent, casual).
- Length requirement: ${length} (short = 1-3 sentences; standard = 1-2 focused paragraphs; detailed = full formal message).
- Sender name: "${senderName}".
- Recipient: "${recipient?.name || 'Contact'}" (${recipient?.relationship || 'Professional contact'}).
`;

    const userPrompt = `
Compose a message with the following details:
- Channel: ${channel}
- Recipient Name: ${recipient?.name || 'Contact'}
- Recipient Relationship: ${recipient?.relationship || 'General'}
- Intent / Core Message: ${intent}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}
- Tone: ${tone}
- Desired Length: ${length}
- Target Language: ${language}

Provide a comprehensive response with a polished main message, subject line (if email or professional inquiry), identified call-to-action, tone analysis, estimated reading time, 2-3 key takeaway bullet points, and 2 distinct alternative variations (e.g. one more concise, one with different framing).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "Subject line for email, or short title if applicable. Empty string if not needed.",
            },
            body: {
              type: Type.STRING,
              description: "The complete, ready-to-send formatted message body.",
            },
            callToAction: {
              type: Type.STRING,
              description: "The primary call to action extracted from the message.",
            },
            toneAnalysis: {
              type: Type.STRING,
              description: "Short 1-sentence assessment of the voice and sentiment.",
            },
            readingTime: {
              type: Type.STRING,
              description: "Estimated reading time (e.g., '15 sec read').",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 4 bullet points highlighting key points.",
            },
            alternativeVariants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Name of the variant, e.g., 'Concise Punch' or 'Extra Polite'" },
                  description: { type: Type.STRING, description: "Brief reason or style description" },
                  subject: { type: Type.STRING, description: "Optional alternate subject" },
                  body: { type: Type.STRING, description: "Complete variant message body" },
                },
                required: ["title", "description", "body"],
              },
              description: "2 alternative variations for the user to choose from.",
            },
          },
          required: ["body", "callToAction", "toneAnalysis", "readingTime", "keyPoints", "alternativeVariants"],
        },
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");

    res.json({
      id: `msg_${Date.now()}`,
      subject: parsedData.subject || (channel === "email" ? "Quick message" : undefined),
      body: parsedData.body,
      callToAction: parsedData.callToAction,
      toneAnalysis: parsedData.toneAnalysis,
      readingTime: parsedData.readingTime,
      keyPoints: parsedData.keyPoints || [],
      alternativeVariants: parsedData.alternativeVariants || [],
    });
  } catch (error: any) {
    console.error("Error generating message:", error);
    res.status(500).json({ error: error.message || "Failed to generate message." });
  }
});

// Endpoint: Refine an existing message (Make concise, more polite, translate, urgency, CTA boost)
app.post("/api/refine-message", async (req, res) => {
  try {
    const {
      currentBody,
      currentSubject,
      action,
      channel,
      recipientName,
      customInstruction,
      targetLanguage,
    } = req.body;

    if (!currentBody) {
      return res.status(400).json({ error: "Current message body is required." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      let modifiedBody = currentBody;
      if (action === "shorter") {
        modifiedBody = currentBody.split("\n\n").slice(0, 2).join("\n\n");
      } else if (action === "polite") {
        modifiedBody = `I hope you are having a pleasant week.\n\n${currentBody}\n\nThank you kindly for your consideration.`;
      } else if (action === "urgent") {
        modifiedBody = `[Time-Sensitive]\n\n${currentBody}\n\nI would greatly appreciate your prompt response at your earliest convenience today.`;
      }
      return res.json({
        body: modifiedBody,
        subject: currentSubject,
        note: `Applied ${action} refinement (offline mode).`,
      });
    }

    const instructionMap: Record<string, string> = {
      shorter: "Trim all wordiness and make this message 40% shorter, retaining maximum clarity and punch.",
      polite: "Increase warmth, courtesy, and diplomatic politeness while remaining genuine and confident.",
      urgent: "Inject clear professional urgency and a time-sensitive prompt without sounding rude.",
      clear_cta: "Sharpen the call-to-action so the recipient immediately knows exactly what step to take next.",
      formal: "Elevate the register to professional executive standard, perfect for senior stakeholders or clients.",
      casual: "Make it more relaxed, conversational, and natural like a peer-to-peer note.",
      grammar_fix: "Correct any typos, punctuation, grammar, and improve phrasing fluidity.",
      translate: `Translate this entire message accurately and naturally into ${targetLanguage || 'Spanish'}, preserving the tone.`,
      custom: customInstruction || "Refine and enhance this message.",
    };

    const actionGuidance = instructionMap[action] || instructionMap.custom;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
You are an expert editor. Refine this ${channel} message intended for ${recipientName || 'a colleague'}.

INSTRUCTION: ${actionGuidance}
${customInstruction && action !== 'custom' ? `ADDITIONAL NOTE: ${customInstruction}` : ''}

CURRENT SUBJECT:
${currentSubject || 'N/A'}

CURRENT BODY:
${currentBody}
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "Updated subject line if applicable" },
            body: { type: Type.STRING, description: "Refined and improved message body" },
            changeSummary: { type: Type.STRING, description: "One sentence explaining what was improved" },
          },
          required: ["body", "changeSummary"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");

    res.json({
      body: parsed.body,
      subject: parsed.subject || currentSubject,
      changeSummary: parsed.changeSummary,
    });
  } catch (error: any) {
    console.error("Error refining message:", error);
    res.status(500).json({ error: error.message || "Failed to refine message." });
  }
});

// Endpoint: AI Quick Ideas Generator (Prompt Inspiration)
app.post("/api/quick-ideas", async (req, res) => {
  try {
    const { channel = "email", category = "work" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        ideas: [
          { title: "Follow up on proposal", intent: "Check in on the status of our project proposal and see if any questions arose." },
          { title: "Meeting reschedule", intent: "Apologize for a scheduling conflict and suggest two alternative slots tomorrow." },
          { title: "Request deadline extension", intent: "Request a 2-day buffer on the final review to ensure thorough quality testing." },
          { title: "Appreciation note", intent: "Thank the team member for stepping up during the product launch." },
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate 4 realistic, high-utility message intents for ${channel} in the context of ${category}. Each should have a punchy title and a 1-sentence prompt idea.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              intent: { type: Type.STRING },
            },
            required: ["title", "intent"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    res.json({ ideas: parsed });
  } catch (error: any) {
    console.error("Error fetching ideas:", error);
    res.json({
      ideas: [
        { title: "Project Status Update", intent: "Send a quick executive summary of milestones completed this week." },
        { title: "Client Check-in", intent: "Check in after onboarding to ensure everything is running smoothly." }
      ]
    });
  }
});

// Endpoint: Generate Automated Multi-Step Drip / Sequence
app.post("/api/generate-sequence", async (req, res) => {
  try {
    const {
      recipient,
      channel = "email",
      intent,
      tone = "professional",
      senderName = "Me",
      language = "English"
    } = req.body;

    if (!intent || !intent.trim()) {
      return res.status(400).json({ error: "Intent is required." });
    }

    const ai = getGeminiClient();
    const recipientName = recipient?.name?.trim() || "Recipient";
    const isEmail = channel === "email";

    if (!ai) {
      return res.json({
        steps: [
          {
            stepNumber: 1,
            delayLabel: "Send Immediately (Step 1)",
            delayHours: 0,
            triggerCondition: "Immediate auto-dispatch",
            subject: isEmail ? `Regarding: ${intent.slice(0, 35)}` : undefined,
            body: `Hi ${recipientName},\n\nI hope you're having a productive week. Reaching out regarding ${intent.trim()}.\n\nWould love to hear your thoughts or see when you might have 10 minutes to discuss.\n\nBest regards,\n${senderName}`,
          },
          {
            stepNumber: 2,
            delayLabel: "After 24 Hours (Step 2)",
            delayHours: 24,
            triggerCondition: "Auto-send if no reply within 24h",
            subject: isEmail ? `Quick follow-up on: ${intent.slice(0, 25)}` : undefined,
            body: `Hi ${recipientName},\n\nFollowing up quickly to see if you had a chance to look over my previous note about ${intent.trim()}. Let me know if another time works better for you!\n\nBest,\n${senderName}`,
          },
          {
            stepNumber: 3,
            delayLabel: "After 3 Days (Step 3)",
            delayHours: 72,
            triggerCondition: "Final auto-check before closing",
            subject: isEmail ? `Checking in one last time: ${intent.slice(0, 25)}` : undefined,
            body: `Hi ${recipientName},\n\nFinal check-in on this before I close the loop. If your priorities have shifted, no worries at all! Just wanted to make sure you had everything you needed.\n\nWarm regards,\n${senderName}`,
          },
        ],
      });
    }

    const prompt = `You are an automated message sequence strategist. Draft a cohesive 3-step automated follow-up sequence for ${channel} in language ${language}.
Intent: "${intent}".
Recipient: ${recipientName} (${recipient?.relationship || 'Contact'}).
Sender: ${senderName}.
Tone: ${tone}.

Step 1: Initial outreach (immediate).
Step 2: Gentle value-add follow up (auto-sent after 24 hours if no reply).
Step 3: Polite closing/breakup message (auto-sent after 72 hours).

Return an array of 3 steps.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              delayLabel: { type: Type.STRING, description: "e.g. 'Send Immediately', 'After 24 Hours', 'After 3 Days'" },
              delayHours: { type: Type.INTEGER, description: "Hours to wait: 0, 24, or 72" },
              triggerCondition: { type: Type.STRING, description: "Trigger explanation e.g. 'Auto-send if no reply within 24h'" },
              subject: { type: Type.STRING, description: "Subject line (if email), else empty" },
              body: { type: Type.STRING, description: "Ready to send message body" },
            },
            required: ["stepNumber", "delayLabel", "delayHours", "triggerCondition", "body"],
          },
        },
      },
    });

    const steps = JSON.parse(response.text?.trim() || "[]");
    res.json({ steps });
  } catch (error: any) {
    console.error("Sequence generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate sequence" });
  }
});

// Endpoint: Batch Personalize and Auto-Generate for Multiple Contacts
app.post("/api/batch-generate", async (req, res) => {
  try {
    const {
      recipients,
      channel = "email",
      intent,
      tone = "professional",
      senderName = "Me",
      language = "English"
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Recipients array is required." });
    }

    const ai = getGeminiClient();
    const isEmail = channel === "email";

    if (!ai) {
      const results = recipients.map((r: any) => ({
        id: r.id,
        name: r.name,
        subject: isEmail ? `Regarding: ${intent.slice(0, 35)}` : undefined,
        body: `Dear ${r.name || 'Friend'},\n\nI am reaching out regarding ${intent}.${r.customNote ? ` Specifically noting: ${r.customNote}.` : ''}\n\nLooking forward to connecting.\n\nBest regards,\n${senderName}`,
      }));
      return res.json({ results });
    }

    const prompt = `Generate customized, personalized ${channel} messages for each recipient in this batch.
Common intent: "${intent}".
Tone: ${tone}.
Sender: ${senderName}.
Target Language: ${language}.

Recipients:
${JSON.stringify(recipients.map((r: any) => ({ id: r.id, name: r.name, relationship: r.relationship, customNote: r.customNote })))}

Return a list matching each recipient id with their tailored subject (if email) and tailored body.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["id", "body"],
          },
        },
      },
    });

    const results = JSON.parse(response.text?.trim() || "[]");
    res.json({ results });
  } catch (error: any) {
    console.error("Batch generate error:", error);
    res.status(500).json({ error: error.message || "Failed to batch generate" });
  }
});

// Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
