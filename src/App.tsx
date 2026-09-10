/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageComposer } from './components/MessageComposer';
import { MessageResult } from './components/MessageResult';
import { DispatchModal } from './components/DispatchModal';
import { ScheduleModal } from './components/ScheduleModal';
import { SentHistory } from './components/SentHistory';
import { AutoSendCountdownModal } from './components/AutoSendCountdownModal';
import { SequenceModal } from './components/SequenceModal';
import { BatchCampaignModal } from './components/BatchCampaignModal';
import {
  ChannelType,
  MessageGenerationRequest,
  MessageOutput,
  SentMessageRecord,
  AutoSendConfig,
} from './types';
import { AlertCircle, CheckCircle2, Sparkles, Send, ShieldCheck, Zap } from 'lucide-react';
import { playDispatchChime } from './utils/audio';

const INITIAL_RECORDS: SentMessageRecord[] = [
  {
    id: 'rec_init_1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'delivered',
    channel: 'email',
    recipientName: 'Elena Rostova',
    recipientContact: 'elena.rostova@techcorp.io',
    subject: 'Follow-up: Architecture Planning & Next Milestones',
    body: 'Dear Elena,\n\nThank you for walking us through the architecture roadmap earlier today. We are fully aligned on the target timeline.\n\nCould you kindly share the updated API schema document when available so our team can prepare the client stubs by Thursday?\n\nBest regards,\nAlex Rivera',
    receiptId: 'REC-EMA-819204',
    deliveryTimestamp: '02:15 PM',
    events: [
      { timestamp: '02:14 PM', status: 'sent', note: 'Relayed via SMTP protocol' },
      { timestamp: '02:15 PM', status: 'delivered', note: 'Recipient mailserver acknowledged receipt' },
    ],
  },
  {
    id: 'rec_init_2',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'delivered',
    channel: 'whatsapp',
    recipientName: 'Marcus Vance',
    recipientContact: '+1 (555) 432-8765',
    body: 'Hey Marcus! Quick ping regarding the staging deployment. All automated unit tests passed green. Let me know when you have 5 mins for a quick voice check before we push live!',
    receiptId: 'REC-WHA-592183',
    deliveryTimestamp: '03:40 PM',
    events: [
      { timestamp: '03:40 PM', status: 'delivered', note: 'Double checkmarks verified' },
    ],
  },
  {
    id: 'rec_init_3',
    createdAt: new Date().toISOString(),
    scheduledFor: new Date(Date.now() + 3600000 * 14).toISOString(),
    status: 'scheduled',
    channel: 'slack',
    recipientName: 'Sarah Jenkins',
    recipientContact: '@sarah.design',
    body: 'Good morning Sarah! When you get settled today, could you take a glance at the revised onboarding flow prototype? We added the refined microcopy we discussed yesterday. Thanks!',
    receiptId: 'SCHED-SLA-392019',
    events: [
      { timestamp: '10:00 AM', status: 'scheduled', note: 'Queued for morning delivery' },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active message draft & output
  const [currentRequest, setCurrentRequest] = useState<MessageGenerationRequest>({
    recipient: { name: 'Jordan Miller', contact: 'jordan.m@enterprise.com', relationship: 'Client' },
    channel: 'email',
    intent: 'Follow up after our demo meeting, confirm we are preparing the custom pricing tier, and propose a 15-minute sync on Thursday at 2 PM.',
    tone: 'professional',
    length: 'standard',
    language: 'English',
    senderName: 'Alex Rivera',
    additionalContext: 'Emphasize that the security whitepaper is attached.',
  });

  const [currentMessage, setCurrentMessage] = useState<MessageOutput | null>({
    id: 'msg_seed_1',
    subject: 'Follow-up: Custom Pricing Tier & Thursday Sync',
    body: 'Dear Jordan,\n\nThank you for your time during our demo meeting earlier this week. It was a pleasure discussing how our platform can streamline your team\'s workflow.\n\nAs promised, our team is currently structuring the custom pricing tier to match your exact seat allocation and compliance requirements. For your convenience, I have also attached our updated enterprise security whitepaper.\n\nCould we schedule a quick 15-minute sync this Thursday at 2:00 PM EST to review the proposal together? Please let me know if this slot works or if you prefer an alternate time.\n\nBest regards,\nAlex Rivera',
    callToAction: 'Confirm Thursday 2:00 PM EST 15-minute sync',
    toneAnalysis: 'Executive, courteous, and structured with zero ambiguity.',
    readingTime: '~20 sec read',
    keyPoints: [
      'Acknowledges positive demo meeting',
      'Confirms custom pricing tier in progress',
      'Highlights attached enterprise security whitepaper',
      'Proposes specific sync time: Thursday 2:00 PM EST'
    ],
    alternativeVariants: [
      {
        title: 'Ultra Concise',
        description: 'Direct and quick for busy decision-makers',
        subject: 'Quick sync: Custom Pricing & Security Whitepaper',
        body: 'Hi Jordan,\n\nGreat connecting during our demo earlier. We are putting the finishing touches on your custom pricing tier now.\n\nAre you available for a quick 15-minute call this Thursday at 2:00 PM EST to walk through the numbers?\n\nBest,\nAlex Rivera'
      },
      {
        title: 'Value-First Angle',
        description: 'Focuses on business impact and security reassurance',
        subject: 'Next Steps: Enterprise Deployment Proposal for Jordan',
        body: 'Dear Jordan,\n\nFollowing our discussion regarding workflow acceleration, we have tailored a proposal designed specifically around your team\'s throughput goals.\n\nOur custom tier details and enterprise compliance guarantees are ready for review. Would Thursday at 2:00 PM EST suit you for a brief walkthrough?\n\nSincerely,\nAlex Rivera'
      }
    ]
  });

  // Outbox / Sent history
  const [records, setRecords] = useState<SentMessageRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tisend_records');
      return saved ? JSON.parse(saved) : INITIAL_RECORDS;
    } catch {
      return INITIAL_RECORDS;
    }
  });

  // Auto-Send Configuration
  const [autoSendConfig, setAutoSendConfig] = useState<AutoSendConfig>(() => {
    try {
      const saved = localStorage.getItem('tisend_autosend');
      return saved
        ? JSON.parse(saved)
        : { enabled: true, countdownSeconds: 5, autoTriggerSequence: false, soundEnabled: true };
    } catch {
      return { enabled: true, countdownSeconds: 5, autoTriggerSequence: false, soundEnabled: true };
    }
  });

  const [autoProcessQueue, setAutoProcessQueue] = useState(true);

  // Modals state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [sequenceData, setSequenceData] = useState<{
    channel: ChannelType;
    recipient: any;
    intent: string;
    senderName: string;
  } | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    try {
      localStorage.setItem('tisend_records', JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem('tisend_autosend', JSON.stringify(autoSendConfig));
    } catch (e) {
      console.error('Failed to save autosend config', e);
    }
  }, [autoSendConfig]);

  // Autonomous Background Daemon: checks queue every 1 second and auto-dispatches overdue messages
  useEffect(() => {
    if (!autoProcessQueue) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setRecords((prev) => {
        let hasChanges = false;
        const updated = prev.map((item) => {
          if (item.status === 'scheduled' && item.scheduledFor) {
            const targetTime = new Date(item.scheduledFor).getTime();
            if (targetTime <= now) {
              hasChanges = true;
              const deliveryTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (autoSendConfig.soundEnabled) playDispatchChime();
              return {
                ...item,
                status: 'delivered' as const,
                deliveryTimestamp,
                events: [
                  ...item.events,
                  {
                    timestamp: deliveryTimestamp,
                    status: 'delivered' as const,
                    note: 'Autonomously dispatched by background daemon (scheduled timestamp elapsed)',
                  },
                ],
              };
            }
          }
          return item;
        });

        if (hasChanges) {
          showToast('⚡ Autonomous daemon dispatched a scheduled message!');
          return updated;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoProcessQueue, autoSendConfig.soundEnabled]);

  const handleUpdateAutoSendConfig = (updates: Partial<AutoSendConfig>) => {
    setAutoSendConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleFastForwardScheduled = (hours: number) => {
    const shiftMs = hours * 3600 * 1000;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.status === 'scheduled' && r.scheduledFor) {
          const newDate = new Date(new Date(r.scheduledFor).getTime() - shiftMs);
          return {
            ...r,
            scheduledFor: newDate.toISOString(),
            events: [
              ...r.events,
              {
                timestamp: new Date().toLocaleTimeString(),
                status: 'scheduled',
                note: `Simulated fast-forward by ${hours} hour(s) for automated dispatch verification`,
              },
            ],
          };
        }
        return r;
      })
    );
    showToast(`Fast-forwarded scheduled outbox by +${hours} hour(s)!`);
  };

  const handleConfirmAutoSend = () => {
    if (!currentMessage) return;
    const receiptId = `AUTO-DISP-${currentRequest.channel.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: SentMessageRecord = {
      id: `rec_auto_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'delivered',
      channel: currentRequest.channel,
      recipientName: currentRequest.recipient.name,
      recipientContact: currentRequest.recipient.contact,
      subject: currentMessage.subject,
      body: currentMessage.body,
      receiptId,
      deliveryTimestamp: nowStr,
      events: [
        {
          timestamp: nowStr,
          status: 'delivered',
          note: `Automatically dispatched via TiSend Auto-Sender Engine to ${currentRequest.recipient.contact || currentRequest.recipient.name}`,
        },
      ],
    };

    setRecords((prev) => [record, ...prev]);
    showToast(`✓ Auto-dispatched to ${currentRequest.recipient.name} (Receipt #${receiptId})`);
  };

  // Handle AI generation with Auto-Send support
  const handleGenerate = async (req: MessageGenerationRequest, isAutoSend?: boolean) => {
    setIsGenerating(true);
    setErrorMsg(null);
    setCurrentRequest(req);

    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed (${res.status})`);
      }

      const data: MessageOutput = await res.json();
      setCurrentMessage(data);

      const willAutoSend = isAutoSend !== undefined ? isAutoSend : autoSendConfig.enabled;
      if (willAutoSend) {
        setShowCountdownModal(true);
      } else {
        showToast('Message tailored and generated successfully!');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || 'Failed to generate message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle AI Refinements
  const handleRefine = async (action: string, customInstruction?: string, targetLanguage?: string) => {
    if (!currentMessage) return;
    setIsRefining(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBody: currentMessage.body,
          currentSubject: currentMessage.subject,
          action,
          channel: currentRequest.channel,
          recipientName: currentRequest.recipient.name,
          customInstruction,
          targetLanguage,
        }),
      });

      if (!res.ok) {
        throw new Error('Refinement failed.');
      }

      const data = await res.json();
      setCurrentMessage((prev) =>
        prev
          ? {
              ...prev,
              body: data.body,
              subject: data.subject || prev.subject,
              toneAnalysis: data.changeSummary || prev.toneAnalysis,
            }
          : null
      );
      showToast(data.changeSummary || 'Refinement applied!');
    } catch (err: any) {
      console.error('Refine error:', err);
      setErrorMsg('Failed to refine message.');
    } finally {
      setIsRefining(false);
    }
  };

  // Record a sent message
  const handleRecordSent = (record: SentMessageRecord) => {
    setRecords((prev) => [record, ...prev]);
    showToast('Message dispatched & recorded in history!');
  };

  // Record a scheduled message
  const handleRecordScheduled = (record: SentMessageRecord) => {
    setRecords((prev) => [record, ...prev]);
    showToast('Message queued for scheduled dispatch!');
  };

  // Load record back into composer
  const handleLoadIntoComposer = (record: SentMessageRecord) => {
    setCurrentRequest((prev) => ({
      ...prev,
      channel: record.channel,
      recipient: {
        name: record.recipientName,
        contact: record.recipientContact,
        relationship: 'Previous Contact',
      },
      intent: `Follow-up to: ${record.subject || record.body.slice(0, 60)}`,
    }));

    setCurrentMessage({
      id: `msg_${Date.now()}`,
      subject: record.subject,
      body: record.body,
      callToAction: 'Follow-up or review',
      toneAnalysis: 'Retrieved from message history',
      readingTime: '~20 sec read',
      keyPoints: ['Reloaded from saved message archive'],
      alternativeVariants: [],
    });

    setActiveTab('compose');
    showToast('Message reloaded into editor!');
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted.');
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all message logs?')) {
      setRecords([]);
      showToast('All message history cleared.');
    }
  };

  // Dispatch a scheduled message now
  const handleDispatchScheduledNow = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...r,
            status: 'delivered' as const,
            deliveryTimestamp: nowStr,
            events: [
              ...r.events,
              { timestamp: nowStr, status: 'delivered' as const, note: 'Manually expedited & delivered' },
            ],
          };
        }
        return r;
      })
    );
    showToast('Scheduled message dispatched immediately!');
  };

  const scheduledCount = records.filter((r) => r.status === 'scheduled').length;
  const sentCount = records.filter((r) => r.status === 'delivered' || r.status === 'sent').length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-blue-100 selection:text-blue-900 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-blue-900 dark:selection:text-blue-100">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 flex items-center space-x-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sentCount={sentCount}
        scheduledCount={scheduledCount}
        autoSendConfig={autoSendConfig}
        onToggleAutoSend={() =>
          handleUpdateAutoSendConfig({ enabled: !autoSendConfig.enabled })
        }
      />

      {/* Hero Subbar */}
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                AI Powered Message Dispatching
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Craft human-level emails, WhatsApp notes, SMS pings, Slack updates, &amp; LinkedIn InMails with Gemini AI.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {autoSendConfig.enabled
                  ? `Autonomous Dispatch: Armed (${autoSendConfig.countdownSeconds === 0 ? 'Instant' : `${autoSendConfig.countdownSeconds}s buffer`})`
                  : 'Autonomous Dispatch: Paused'}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>TLS dispatch tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-700 underline hover:text-red-900 dark:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'compose' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Composer Form (5 cols) */}
            <div className="lg:col-span-5">
              <MessageComposer
                onGenerate={handleGenerate}
                isLoading={isGenerating}
                initialValues={currentRequest}
                autoSendConfig={autoSendConfig}
                onUpdateAutoSendConfig={handleUpdateAutoSendConfig}
                onOpenSequenceModal={(data) => {
                  setSequenceData(data);
                  setShowSequenceModal(true);
                }}
                onOpenBatchCampaign={() => setShowBatchModal(true)}
              />
            </div>

            {/* Right Column: Interactive Mockup & Refinement (7 cols) */}
            <div className="lg:col-span-7">
              {currentMessage ? (
                <MessageResult
                  channel={currentRequest.channel}
                  recipient={currentRequest.recipient}
                  senderName={currentRequest.senderName || 'Me'}
                  message={currentMessage}
                  onUpdateMessage={(updated) =>
                    setCurrentMessage((prev) => (prev ? { ...prev, ...updated } : null))
                  }
                  onRefine={handleRefine}
                  isRefining={isRefining}
                  onInitiateDispatch={() => setShowDispatchModal(true)}
                  onInitiateSchedule={() => setShowScheduleModal(true)}
                  onInitiateAutoSend={() => setShowCountdownModal(true)}
                  onCopySuccess={() => showToast('Message copied to clipboard!')}
                />
              ) : (
                <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <Send className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                  <h3 className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    No Message Generated Yet
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-zinc-500">
                    Fill in your recipient details and what you wish to say in the composer on the left, then click Generate.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <SentHistory
            records={records}
            onLoadIntoComposer={handleLoadIntoComposer}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAll}
            onDispatchScheduledNow={handleDispatchScheduledNow}
            autoProcessQueue={autoProcessQueue}
            onToggleAutoProcess={() => setAutoProcessQueue(!autoProcessQueue)}
            onFastForwardScheduled={handleFastForwardScheduled}
          />
        )}
      </main>

      {/* Modals */}
      {currentMessage && (
        <>
          <DispatchModal
            isOpen={showDispatchModal}
            onClose={() => setShowDispatchModal(false)}
            channel={currentRequest.channel}
            recipient={currentRequest.recipient}
            message={currentMessage}
            onRecordSent={handleRecordSent}
          />

          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            channel={currentRequest.channel}
            recipient={currentRequest.recipient}
            message={currentMessage}
            onRecordScheduled={handleRecordScheduled}
          />

          {/* Autonomous Countdown Auto-Send Modal */}
          <AutoSendCountdownModal
            isOpen={showCountdownModal}
            onClose={() => setShowCountdownModal(false)}
            countdownSeconds={autoSendConfig.countdownSeconds}
            channel={currentRequest.channel}
            recipient={currentRequest.recipient}
            message={currentMessage}
            soundEnabled={autoSendConfig.soundEnabled}
            onConfirmSend={handleConfirmAutoSend}
          />
        </>
      )}

      {/* Multi-Step Follow-Up Sequence Modal */}
      {sequenceData && (
        <SequenceModal
          isOpen={showSequenceModal}
          onClose={() => setShowSequenceModal(false)}
          channel={sequenceData.channel}
          recipient={sequenceData.recipient}
          senderName={sequenceData.senderName}
          intent={sequenceData.intent}
          onScheduleSequence={(newRecords) => {
            setRecords((prev) => [...newRecords, ...prev]);
            showToast(`Arming ${newRecords.length}-step automated sequence!`);
            setActiveTab('history');
          }}
        />
      )}

      {/* Multi-Contact Batch Automated Campaign Modal */}
      <BatchCampaignModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        channel={currentRequest.channel}
        senderName={currentRequest.senderName || 'Me'}
        defaultIntent={currentRequest.intent}
        onCampaignCompleted={(newRecords) => {
          setRecords((prev) => [...newRecords, ...prev]);
          showToast(`Automated batch campaign finished! ${newRecords.length} messages sent.`);
          setActiveTab('history');
        }}
      />
    </div>
  );
}
