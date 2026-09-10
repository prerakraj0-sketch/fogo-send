import React, { useState } from 'react';
import { Clock, Calendar, X, Check, ArrowRight } from 'lucide-react';
import { ChannelType, MessageOutput, RecipientInfo, SentMessageRecord } from '../types';
import { CHANNEL_META } from '../data/templates';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelType;
  recipient: RecipientInfo;
  message: MessageOutput;
  onRecordScheduled: (record: SentMessageRecord) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  channel,
  recipient,
  message,
  onRecordScheduled,
}: ScheduleModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<'15m' | '1h' | 'tomorrow9am' | 'custom'>('15m');
  const [customDateTime, setCustomDateTime] = useState('');

  if (!isOpen) return null;

  const handleSchedule = () => {
    let scheduledDate = new Date();

    if (selectedPreset === '15m') {
      scheduledDate = new Date(Date.now() + 15 * 60 * 1000);
    } else if (selectedPreset === '1h') {
      scheduledDate = new Date(Date.now() + 60 * 60 * 1000);
    } else if (selectedPreset === 'tomorrow9am') {
      scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(9, 0, 0, 0);
    } else if (selectedPreset === 'custom' && customDateTime) {
      scheduledDate = new Date(customDateTime);
    }

    const scheduledIso = scheduledDate.toISOString();
    const scheduledFormatted = scheduledDate.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const receiptId = `SCHED-${channel.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    onRecordScheduled({
      id: `sched_${Date.now()}`,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledIso,
      status: 'scheduled',
      channel,
      recipientName: recipient.name || 'Recipient',
      recipientContact: recipient.contact || '',
      subject: message.subject,
      body: message.body,
      receiptId,
      events: [
        {
          timestamp: new Date().toLocaleTimeString(),
          status: 'scheduled',
          note: `Queued for automated dispatch at ${scheduledFormatted}`,
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Schedule Message Dispatch
              </h3>
              <p className="text-xs text-zinc-500">Pick optimal delivery window</p>
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

        <div className="my-5 space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            TiSend will hold and automatically trigger transmission for{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {recipient.name || 'your recipient'}
            </span>{' '}
            at the specified time.
          </p>

          {/* Presets */}
          <div className="space-y-2">
            {[
              { id: '15m', title: 'In 15 minutes', subtitle: 'Quick buffer' },
              { id: '1h', title: 'In 1 hour', subtitle: 'Standard follow-up' },
              { id: 'tomorrow9am', title: 'Tomorrow at 9:00 AM', subtitle: 'Start of workday' },
              { id: 'custom', title: 'Custom Date & Time', subtitle: 'Select exact slot' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPreset(opt.id as any)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  selectedPreset === opt.id
                    ? 'border-amber-500 bg-amber-50/60 dark:border-amber-500/80 dark:bg-amber-950/40'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {opt.title}
                  </div>
                  <div className="text-[11px] text-zinc-500">{opt.subtitle}</div>
                </div>
                {selectedPreset === opt.id && (
                  <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                )}
              </button>
            ))}
          </div>

          {/* Custom picker input */}
          {selectedPreset === 'custom' && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Choose dispatch date and time:
              </label>
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <span>Confirm &amp; Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
