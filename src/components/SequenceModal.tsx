import React, { useState } from 'react';
import { Layers, Clock, X, Check, ArrowRight, Sparkles, Send, Calendar } from 'lucide-react';
import { ChannelType, RecipientInfo, SequenceStep, SentMessageRecord } from '../types';
import { CHANNEL_META } from '../data/templates';

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelType;
  recipient: RecipientInfo;
  senderName: string;
  intent: string;
  onScheduleSequence: (records: SentMessageRecord[]) => void;
}

export function SequenceModal({
  isOpen,
  onClose,
  channel,
  recipient,
  senderName,
  intent,
  onScheduleSequence,
}: SequenceModalProps) {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateSequence = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          channel,
          intent,
          senderName,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate automated sequence');
      const data = await res.json();
      setSteps(data.steps || []);
      setHasGenerated(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateSequence = () => {
    const records: SentMessageRecord[] = steps.map((step) => {
      const isImmediate = step.delayHours === 0;
      const scheduledDate = new Date(Date.now() + step.delayHours * 3600 * 1000);
      const receiptId = `AUTO-SEQ-${channel.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        id: `seq_${Date.now()}_step_${step.stepNumber}`,
        createdAt: new Date().toISOString(),
        scheduledFor: isImmediate ? undefined : scheduledDate.toISOString(),
        status: isImmediate ? 'delivered' : 'scheduled',
        channel,
        recipientName: recipient.name || 'Recipient',
        recipientContact: recipient.contact || '',
        subject: step.subject,
        body: step.body,
        receiptId,
        deliveryTimestamp: isImmediate ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        events: [
          {
            timestamp: new Date().toLocaleTimeString(),
            status: isImmediate ? 'delivered' : 'scheduled',
            note: isImmediate
              ? 'Step 1 auto-dispatched immediately'
              : `Step ${step.stepNumber} auto-queued: ${step.triggerCondition} (ETA: ${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })})`,
          },
        ],
      };
    });

    onScheduleSequence(records);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Automated Follow-Up Sequence (Smart Cadence)
              </h3>
              <p className="text-xs text-zinc-500">
                Let Gemini draft initial outreach + automated follow-up steps for {recipient.name || 'Recipient'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="my-5 space-y-4">
          {!hasGenerated ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
              <Sparkles className="mx-auto h-8 w-8 text-purple-600 dark:text-purple-400" />
              <h4 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Generate 3-Step Automated Outreach Sequence
              </h4>
              <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                Gemini will architect an initial message, a value-focused auto follow-up (24h), and a gentle closure check-in (72h) calibrated to your intent.
              </p>

              {errorMsg && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGenerateSequence}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Drafting Cadence Steps with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Draft Automated 3-Step Sequence</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Review Sequence Schedule:
                </span>
                <span className="text-[11px] text-zinc-500">
                  Channel: {CHANNEL_META[channel].label}
                </span>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-800/60"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-700/60">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {step.delayLabel}
                        </span>
                      </div>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {step.triggerCondition}
                      </span>
                    </div>

                    <div className="mt-2 text-xs">
                      {step.subject && (
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Subject: {step.subject}
                        </p>
                      )}
                      <p className="mt-1 whitespace-pre-line text-zinc-600 dark:text-zinc-300 leading-relaxed text-[11px]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>

          {hasGenerated && (
            <button
              type="button"
              onClick={handleActivateSequence}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <span>Activate &amp; Arm Automated Sequence</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
