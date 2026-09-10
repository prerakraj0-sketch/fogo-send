import React, { useState } from 'react';
import {
  Copy,
  Check,
  Send,
  ExternalLink,
  Clock,
  Wand2,
  Sparkles,
  Scissors,
  Heart,
  Flame,
  Target,
  Briefcase,
  Smile,
  Globe,
  Edit3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Share2,
  RefreshCw,
  Zap,
  Download,
} from 'lucide-react';
import {
  ChannelType,
  MessageOutput,
  AlternativeVariant,
  RecipientInfo,
} from '../types';
import { CHANNEL_META, LANGUAGES } from '../data/templates';

interface MessageResultProps {
  channel: ChannelType;
  recipient: RecipientInfo;
  senderName: string;
  message: MessageOutput;
  onUpdateMessage: (updated: Partial<MessageOutput>) => void;
  onRefine: (action: string, customInstruction?: string, targetLanguage?: string) => Promise<void>;
  isRefining: boolean;
  onInitiateDispatch: () => void;
  onInitiateSchedule: () => void;
  onInitiateAutoSend: () => void;
  onCopySuccess: () => void;
}

export function MessageResult({
  channel,
  recipient,
  senderName,
  message,
  onUpdateMessage,
  onRefine,
  isRefining,
  onInitiateDispatch,
  onInitiateSchedule,
  onInitiateAutoSend,
  onCopySuccess,
}: MessageResultProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'variants'>('preview');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [showTranslatePicker, setShowTranslatePicker] = useState(false);

  const channelMeta = CHANNEL_META[channel];

  const handleCopy = () => {
    const textToCopy = message.subject
      ? `Subject: ${message.subject}\n\n${message.body}`
      : message.body;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onCopySuccess();
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadHtml = () => {
    const title = message.subject || `${channelMeta.label} Message`;
    const bodyContent = message.body.replace(/\n/g, '<br/>');
    const recipientDisplayName = recipient?.name?.trim() || 'Recipient';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 36px 16px;
      color: #0f172a;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: #ffffff;
      padding: 24px 28px;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header .meta {
      margin-top: 6px;
      font-size: 13px;
      opacity: 0.92;
    }
    .body-content {
      padding: 32px 28px;
      font-size: 15px;
      line-height: 1.68;
      color: #334155;
    }
    .footer {
      padding: 16px 28px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${title}</h1>
      <div class="meta">To: ${recipientDisplayName} • Channel: ${channelMeta.label}</div>
    </div>
    <div class="body-content">
      ${bodyContent}
    </div>
    <div class="footer">
      <span>Sent via AI Message Sender</span>
      <span>${new Date().toLocaleDateString()}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (recipientDisplayName || 'message').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${cleanName}_${channel}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate direct app link
  const getDirectDispatchLink = () => {
    if (channel === 'email') {
      const subjectParam = encodeURIComponent(message.subject || '');
      const bodyParam = encodeURIComponent(message.body);
      const toParam = encodeURIComponent(recipient.contact || '');
      return `mailto:${toParam}?subject=${subjectParam}&body=${bodyParam}`;
    }
    if (channel === 'whatsapp') {
      const cleanPhone = recipient.contact.replace(/[^\d+]/g, '');
      const bodyParam = encodeURIComponent(message.body);
      return cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${bodyParam}`
        : `https://wa.me/?text=${bodyParam}`;
    }
    if (channel === 'sms') {
      const cleanPhone = recipient.contact.replace(/[^\d+]/g, '');
      const bodyParam = encodeURIComponent(message.body);
      return cleanPhone ? `sms:${cleanPhone}?body=${bodyParam}` : `sms:?body=${bodyParam}`;
    }
    return null;
  };

  const directLink = getDirectDispatchLink();

  const handleSelectVariant = (variant: AlternativeVariant) => {
    onUpdateMessage({
      body: variant.body,
      subject: variant.subject || message.subject,
    });
    setActiveTab('preview');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Message Generated &amp; Ready
              </h3>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {channelMeta.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              For {recipient.name || 'Recipient'} ({recipient.relationship}) • {message.readingTime}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isEditing
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
              title="Download formatted message as a standalone HTML file"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export HTML</span>
            </button>

            {directLink && (
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in {channelMeta.label}</span>
              </a>
            )}

            <button
              type="button"
              onClick={onInitiateAutoSend}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-700"
              title="Trigger countdown and automatically dispatch"
            >
              <Zap className="h-3.5 w-3.5 fill-white" />
              <span>Auto-Send</span>
            </button>

            <button
              type="button"
              onClick={onInitiateDispatch}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Dispatch &amp; Track</span>
            </button>

            <button
              type="button"
              onClick={onInitiateSchedule}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>Schedule</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Mockup Preview vs Alternative Variants */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-2 border-b border-zinc-200 pb-2 text-xs font-semibold dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-1 transition-colors ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Channel Mockup Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('variants')}
              className={`flex items-center space-x-1.5 pb-1 transition-colors ${
                activeTab === 'variants'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Alternative Variations ({message.alternativeVariants?.length || 0})</span>
            </button>
          </div>

          <div className="hidden text-xs text-zinc-400 sm:block">
            {isEditing ? 'Editing live' : 'Click "Edit Text" to customize directly'}
          </div>
        </div>

        {/* TAB 1: Real-time Channel Mockup */}
        {activeTab === 'preview' && (
          <div className="mt-4">
            {/* EMAIL MOCKUP */}
            {channel === 'email' && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 shadow-inner overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] text-zinc-500">New Message • Draft</span>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400">Standard SMTP / Webmail</span>
                </div>

                <div className="space-y-2 border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-zinc-400">To:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {recipient.name || 'Recipient'}{' '}
                      {recipient.contact ? `<${recipient.contact}>` : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-zinc-400">From:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{senderName} (You)</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-zinc-400">Subject:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={message.subject || ''}
                        onChange={(e) => onUpdateMessage({ subject: e.target.value })}
                        className="flex-1 rounded border border-blue-400 bg-white px-2 py-1 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    ) : (
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {message.subject || '(No subject)'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 min-h-[160px] dark:bg-zinc-900/90">
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={message.body}
                      onChange={(e) => onUpdateMessage({ body: e.target.value })}
                      className="w-full rounded-lg border border-blue-400 bg-white p-3 font-sans text-sm text-zinc-900 leading-relaxed focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  ) : (
                    <div className="whitespace-pre-line font-sans text-sm text-zinc-800 leading-relaxed dark:text-zinc-200">
                      {message.body}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHATSAPP MOCKUP */}
            {channel === 'whatsapp' && (
              <div className="mx-auto max-w-lg rounded-2xl border border-zinc-300 bg-[#EFEAE2] p-0 shadow-md overflow-hidden dark:border-zinc-750 dark:bg-zinc-950">
                {/* WA Header */}
                <div className="flex items-center space-x-3 bg-[#075E54] px-4 py-3 text-white">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {recipient.name ? recipient.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{recipient.name || 'WhatsApp Contact'}</div>
                    <div className="text-[10px] text-emerald-100">
                      {recipient.contact || 'online'}
                    </div>
                  </div>
                </div>

                {/* WA Chat Body */}
                <div className="p-4 min-h-[180px] flex flex-col justify-end">
                  <div className="self-end max-w-[85%] rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-3 text-sm text-zinc-900 shadow-sm dark:bg-[#005C4B] dark:text-zinc-100">
                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={message.body}
                        onChange={(e) => onUpdateMessage({ body: e.target.value })}
                        className="w-full rounded border border-emerald-500 bg-transparent p-1 text-sm focus:outline-none"
                      />
                    ) : (
                      <div className="whitespace-pre-line leading-relaxed text-sm">
                        {message.body}
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-end space-x-1 text-[10px] text-zinc-500 dark:text-emerald-200">
                      <span>Just now</span>
                      <span className="text-blue-500 dark:text-blue-300 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SMS MOCKUP */}
            {channel === 'sms' && (
              <div className="mx-auto max-w-md rounded-3xl border-4 border-zinc-800 bg-zinc-50 p-4 shadow-lg dark:bg-zinc-950">
                <div className="mb-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {recipient.name ? recipient.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {recipient.name || 'Recipient'}
                  </div>
                  <div className="text-[10px] text-zinc-400">{recipient.contact || 'Text Message'}</div>
                </div>

                <div className="space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 p-3 text-sm text-white shadow-sm">
                    {isEditing ? (
                      <textarea
                        rows={5}
                        value={message.body}
                        onChange={(e) => onUpdateMessage({ body: e.target.value })}
                        className="w-full rounded border border-white/50 bg-transparent p-1 text-sm text-white focus:outline-none"
                      />
                    ) : (
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {message.body}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-zinc-400 pr-1">Delivered</div>
                </div>
              </div>
            )}

            {/* SLACK MOCKUP */}
            {channel === 'slack' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center space-x-2 border-b border-zinc-100 pb-2.5 text-xs text-zinc-500 dark:border-zinc-800">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200"># general</span>
                  <span>•</span>
                  <span>Direct message to {recipient.name || '@colleague'}</span>
                </div>

                <div className="mt-3 flex space-x-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 font-bold text-white text-xs">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {senderName}
                      </span>
                      <span className="text-[10px] text-zinc-400">Today at 10:42 AM</span>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={message.body}
                        onChange={(e) => onUpdateMessage({ body: e.target.value })}
                        className="w-full rounded-lg border border-amber-400 bg-zinc-50 p-2.5 text-xs font-mono focus:outline-none dark:bg-zinc-800"
                      />
                    ) : (
                      <div className="whitespace-pre-line text-xs text-zinc-800 leading-relaxed dark:text-zinc-200">
                        {message.body}
                      </div>
                    )}

                    <div className="mt-2 flex items-center space-x-2 text-zinc-400">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                        👍 1
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                        💬 Reply in thread
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LINKEDIN MOCKUP */}
            {channel === 'linkedin' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 text-xs dark:border-zinc-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {recipient.name ? recipient.name.charAt(0) : 'L'}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {recipient.name || 'LinkedIn Connection'}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        1st degree connection • InMail message
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    InMail
                  </span>
                </div>

                <div className="py-3">
                  {message.subject && (
                    <div className="mb-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Subject: {message.subject}
                    </div>
                  )}

                  {isEditing ? (
                    <textarea
                      rows={6}
                      value={message.body}
                      onChange={(e) => onUpdateMessage({ body: e.target.value })}
                      className="w-full rounded-lg border border-sky-400 p-2.5 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  ) : (
                    <div className="whitespace-pre-line text-xs text-zinc-800 leading-relaxed dark:text-zinc-200">
                      {message.body}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Alternative Variations */}
        {activeTab === 'variants' && (
          <div className="mt-4 space-y-3">
            {message.alternativeVariants && message.alternativeVariants.length > 0 ? (
              message.alternativeVariants.map((variant, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition-all hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {variant.title}
                      </span>
                      <span className="ml-2 text-[11px] text-zinc-500">{variant.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      className="inline-flex items-center space-x-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      <span>Use this variant</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  {variant.subject && (
                    <div className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Subject: {variant.subject}
                    </div>
                  )}
                  <p className="mt-2 whitespace-pre-line text-xs text-zinc-700 leading-relaxed dark:text-zinc-300">
                    {variant.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No alternative variants generated.</p>
            )}
          </div>
        )}

        {/* Strategic Analysis & Insights Pill Bar */}
        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-zinc-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800">
          <div className="rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">Tone Analysis:</span>
            <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{message.toneAnalysis}</p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">Primary CTA:</span>
            <p className="mt-0.5 font-medium text-blue-600 dark:text-blue-400">{message.callToAction}</p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-2.5 text-xs sm:col-span-2 lg:col-span-1 dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">Key Takeaways:</span>
            <ul className="mt-0.5 list-disc list-inside text-zinc-700 dark:text-zinc-300 space-y-0.5">
              {message.keyPoints?.map((pt, i) => (
                <li key={i} className="line-clamp-1">{pt}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI One-Click Refinement Toolbar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            AI Magic Refine Studio
          </h4>
          {isRefining && (
            <span className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Refining with Gemini...
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Transform your draft with one-click adjustments or give custom AI guidance.
        </p>

        {/* Quick action chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('shorter')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            <Scissors className="h-3 w-3 text-zinc-500" />
            <span>Make Shorter</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('polite')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Heart className="h-3 w-3 text-emerald-600" />
            <span>More Polite &amp; Warm</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('urgent')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Flame className="h-3 w-3 text-amber-600" />
            <span>Add Urgency</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('clear_cta')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Target className="h-3 w-3 text-indigo-600" />
            <span>Sharper Call to Action</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('formal')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Briefcase className="h-3 w-3 text-zinc-600" />
            <span>Executive / Formal</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('casual')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Smile className="h-3 w-3 text-sky-600" />
            <span>Casual &amp; Relaxed</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('grammar_fix')}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span>Polish &amp; Proofread</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTranslatePicker(!showTranslatePicker)}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Globe className="h-3 w-3 text-zinc-600" />
            <span>Translate...</span>
          </button>
        </div>

        {/* Translation Row */}
        {showTranslatePicker && (
          <div className="mt-3 flex items-center space-x-2 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Translate entire message to:
            </span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isRefining}
              onClick={() => onRefine('translate', undefined, selectedLanguage)}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Apply Translation
            </button>
          </div>
        )}

        {/* Custom refinement input */}
        <div className="mt-3 flex items-center space-x-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customInstruction.trim() && !isRefining) {
                onRefine('custom', customInstruction.trim());
                setCustomInstruction('');
              }
            }}
            placeholder="Or type a custom request, e.g. 'Add a bullet point reminding them to bring the quarterly report'..."
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            disabled={isRefining || !customInstruction.trim()}
            onClick={() => {
              if (customInstruction.trim()) {
                onRefine('custom', customInstruction.trim());
                setCustomInstruction('');
              }
            }}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Refine
          </button>
        </div>
      </div>
    </div>
  );
}
