import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, CheckCircle2, AlertCircle, Play, Pause, Square, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { BatchRecipientItem, ChannelType, SentMessageRecord } from '../types';
import { CHANNEL_META } from '../data/templates';
import { playDispatchChime } from '../utils/audio';

interface BatchCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelType;
  senderName: string;
  defaultIntent: string;
  onCampaignCompleted: (sentRecords: SentMessageRecord[]) => void;
}

const SAMPLE_RECIPIENTS: BatchRecipientItem[] = [
  {
    id: 'batch_1',
    name: 'David Chen',
    contact: 'david.chen@innovate.org',
    relationship: 'Investor',
    customNote: 'Mention Q3 140% growth metrics',
    status: 'idle',
  },
  {
    id: 'batch_2',
    name: 'Sophia Williams',
    contact: '+1 (555) 234-5678',
    relationship: 'Design Partner',
    customNote: 'Mention Figma design token synchronization',
    status: 'idle',
  },
  {
    id: 'batch_3',
    name: 'Liam Gallagher',
    contact: 'liam.g@cloudsystems.io',
    relationship: 'Enterprise Client',
    customNote: 'Mention SOC-2 Type II audit completion',
    status: 'idle',
  },
];

export function BatchCampaignModal({
  isOpen,
  onClose,
  channel,
  senderName,
  defaultIntent,
  onCampaignCompleted,
}: BatchCampaignModalProps) {
  const [recipients, setRecipients] = useState<BatchRecipientItem[]>(SAMPLE_RECIPIENTS);
  const [intent, setIntent] = useState(defaultIntent || 'Share our product release notes and invite for a 15-minute roadmap sync');
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newNote, setNewNote] = useState('');

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  if (!isOpen) return null;

  const handleAddRecipient = () => {
    if (!newName.trim()) return;
    const item: BatchRecipientItem = {
      id: `batch_${Date.now()}`,
      name: newName.trim(),
      contact: newContact.trim(),
      relationship: 'Contact',
      customNote: newNote.trim(),
      status: 'idle',
    };
    setRecipients([...recipients, item]);
    setNewName('');
    setNewContact('');
    setNewNote('');
  };

  const handleRemoveRecipient = (id: string) => {
    if (isRunning) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleStartCampaign = async () => {
    if (recipients.length === 0 || !intent.trim()) return;
    setIsRunning(true);
    setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting Automated Campaign for ${recipients.length} recipients...`]);

    // Step 1: Pre-generate or personalize messages
    try {
      const res = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          channel,
          intent,
          senderName,
        }),
      });

      let generatedMap: Record<string, { subject?: string; body: string }> = {};
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          data.results.forEach((r: any) => {
            generatedMap[r.id] = { subject: r.subject, body: r.body };
          });
        }
      }

      // Step 2: Sequentially process each recipient with throttle delay
      const createdRecords: SentMessageRecord[] = [];

      for (let i = 0; i < recipients.length; i++) {
        if (!isRunningRef.current) {
          setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Campaign paused by operator.`]);
          break;
        }

        setCurrentIdx(i);
        const recipient = recipients[i];

        // Update status to sending
        setRecipients((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: 'sending' } : r))
        );

        setLogMessages((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Auto-dispatching personalized message to ${recipient.name} (${recipient.contact || channel})...`,
        ]);

        // Simulate transmission time
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

        if (!isRunningRef.current) break;

        const receiptId = `AUTO-BAT-${Math.floor(100000 + Math.random() * 900000)}`;
        const content = generatedMap[recipient.id] || {
          subject: channel === 'email' ? `Update: ${intent.slice(0, 30)}` : undefined,
          body: `Hi ${recipient.name},\n\nReaching out regarding ${intent}.\n\nBest,\n${senderName}`,
        };

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const record: SentMessageRecord = {
          id: `batch_rec_${Date.now()}_${i}`,
          createdAt: new Date().toISOString(),
          status: 'delivered',
          channel,
          recipientName: recipient.name,
          recipientContact: recipient.contact,
          subject: content.subject,
          body: content.body,
          receiptId,
          deliveryTimestamp: nowStr,
          events: [
            {
              timestamp: nowStr,
              status: 'delivered',
              note: `Auto-dispatched via Batch Campaign Engine to ${recipient.contact || recipient.name}`,
            },
          ],
        };

        createdRecords.push(record);
        playDispatchChime();

        setRecipients((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: 'delivered',
                  generatedSubject: content.subject,
                  generatedBody: content.body,
                  receiptId,
                }
              : r
          )
        );

        setLogMessages((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Delivered to ${recipient.name} (Receipt #${receiptId})`,
        ]);
      }

      setIsRunning(false);
      setCurrentIdx(-1);
      setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Automated Campaign Completed! All messages logged to Outbox.`]);
      onCampaignCompleted(createdRecords);
    } catch (err: any) {
      console.error('Campaign error:', err);
      setIsRunning(false);
      setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error during campaign: ${err.message}`]);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const deliveredCount = recipients.filter((r) => r.status === 'delivered').length;
  const progressPercent = (deliveredCount / recipients.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Batch Automatic Send Campaign
              </h3>
              <p className="text-xs text-zinc-500">
                Auto-personalize and dispatch to multiple recipients with throttled rate-limiting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Campaign Settings */}
        <div className="my-5 space-y-4">
          {/* Intent / Prompt */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Core Campaign Intent (Personalized per recipient)
            </label>
            <textarea
              rows={2}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Throttle Settings */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Auto-Send Delay Throttle:
              </span>
              <p className="text-[11px] text-zinc-500">
                Interval between each automatic transmission
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {[2, 3, 5].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDelaySeconds(sec)}
                  disabled={isRunning}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    delaySeconds === sec
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Recipient List */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Recipient Queue ({recipients.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Channel: {CHANNEL_META[channel].label}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-800/30">
              {recipients.map((r, idx) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                    currentIdx === idx
                      ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40'
                      : r.status === 'delivered'
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                      : 'border-zinc-100 bg-zinc-50/60 dark:border-zinc-700/60 dark:bg-zinc-800/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {r.name}
                      </span>
                      {r.contact && (
                        <span className="text-[11px] text-zinc-400 truncate">
                          ({r.contact})
                        </span>
                      )}
                    </div>
                    {r.customNote && (
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
                        Note: {r.customNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {r.status === 'delivered' ? (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Sent</span>
                      </span>
                    ) : r.status === 'sending' ? (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-blue-600 animate-pulse">
                        <Send className="h-3.5 w-3.5" />
                        <span>Auto-sending...</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">Queued</span>
                    )}

                    {!isRunning && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(r.id)}
                        className="rounded p-1 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add recipient row */}
            {!isRunning && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contact Name"
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="Email or Phone"
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Custom angle/note"
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Progress and Execution Log */}
          {(isRunning || logMessages.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Campaign Progress ({deliveredCount}/{recipients.length})
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Console log */}
              <div className="h-24 overflow-y-auto rounded-lg bg-zinc-950 p-2 font-mono text-[11px] text-zinc-300">
                {logMessages.map((msg, i) => (
                  <div key={i} className="leading-relaxed">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 disabled:opacity-40"
          >
            Close
          </button>

          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Abort Campaign</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartCampaign}
              disabled={recipients.length === 0}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start Automated Campaign ({recipients.length} recipients)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
