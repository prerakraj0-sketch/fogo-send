import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  Mail,
  MessageSquare,
  Smartphone,
  Hash,
  Linkedin,
  Search,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  ExternalLink,
  Send,
  AlertCircle,
  Zap,
  Play,
  Pause,
  FastForward,
  Bot
} from 'lucide-react';
import { SentMessageRecord, ChannelType } from '../types';
import { CHANNEL_META } from '../data/templates';

interface SentHistoryProps {
  records: SentMessageRecord[];
  onLoadIntoComposer: (record: SentMessageRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onDispatchScheduledNow: (id: string) => void;
  autoProcessQueue: boolean;
  onToggleAutoProcess: () => void;
  onFastForwardScheduled: (hours: number) => void;
}

export function SentHistory({
  records,
  onLoadIntoComposer,
  onDeleteRecord,
  onClearAll,
  onDispatchScheduledNow,
  autoProcessQueue,
  onToggleAutoProcess,
  onFastForwardScheduled,
}: SentHistoryProps) {
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'delivered' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetIso?: string) => {
    if (!targetIso) return 'Pending trigger';
    const target = new Date(targetIso).getTime();
    const diffSec = Math.floor((target - currentTime) / 1000);

    if (diffSec <= 0) return 'Auto-dispatching now...';
    if (diffSec < 60) return `in ${diffSec}s`;
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      return `in ${mins}m ${secs}s`;
    }
    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    return `in ${hours}h ${mins}m`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRecords = records.filter((r) => {
    if (filterChannel !== 'all' && r.channel !== filterChannel) return false;
    if (filterStatus === 'delivered' && r.status !== 'delivered' && r.status !== 'sent') return false;
    if (filterStatus === 'scheduled' && r.status !== 'scheduled') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRecipient = r.recipientName?.toLowerCase().includes(q);
      const matchSubject = r.subject?.toLowerCase().includes(q);
      const matchBody = r.body?.toLowerCase().includes(q);
      const matchReceipt = r.receiptId?.toLowerCase().includes(q);
      return matchRecipient || matchSubject || matchBody || matchReceipt;
    }
    return true;
  });

  const getChannelIcon = (c: ChannelType) => {
    switch (c) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'sms':
        return <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case 'slack':
        return <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Message Log &amp; Scheduled Outbox
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Track transmitted messages, delivery receipts, and pending automated dispatches.
            </p>
          </div>

          {records.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear history</span>
            </button>
          )}
        </div>

        {/* AUTOMATED DISPATCH DAEMON BANNER */}
        <div className="mt-4 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-purple-50/50 p-4 dark:border-indigo-900/50 dark:bg-zinc-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Autonomous Dispatch Engine Daemon
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      autoProcessQueue
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {autoProcessQueue ? '● Active Daemon (1s Interval)' : '○ Daemon Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {records.filter((r) => r.status === 'scheduled').length > 0
                    ? `${records.filter((r) => r.status === 'scheduled').length} message(s) queued to automatically dispatch when scheduled time arrives.`
                    : 'No pending automated messages. Send with "Auto-Send" or schedule a sequence to queue.'}
                </p>
              </div>
            </div>

            {/* Daemon controls */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onToggleAutoProcess}
                className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-all ${
                  autoProcessQueue
                    ? 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {autoProcessQueue ? (
                  <>
                    <Pause className="h-3.5 w-3.5 text-amber-600" />
                    <span>Pause Daemon</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume Daemon</span>
                  </>
                )}
              </button>

              {records.filter((r) => r.status === 'scheduled').length > 0 && (
                <button
                  type="button"
                  onClick={() => onFastForwardScheduled(1)}
                  className="inline-flex items-center space-x-1 rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-zinc-800 dark:text-indigo-300"
                  title="Accelerate scheduled queue by 1 hour to test auto-dispatch"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  <span>Fast-Forward (+1h)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800/60">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('delivered')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filterStatus === 'delivered'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              Delivered ({records.filter((r) => r.status === 'delivered' || r.status === 'sent').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('scheduled')}
              className={`flex items-center space-x-1 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filterStatus === 'scheduled'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              <Clock className="h-3 w-3 text-amber-500" />
              <span>Scheduled ({records.filter((r) => r.status === 'scheduled').length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipient, text, receipt..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Channel filter pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setFilterChannel('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              filterChannel === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            All Channels
          </button>
          {(['email', 'whatsapp', 'sms', 'slack', 'linkedin'] as ChannelType[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterChannel(c)}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                filterChannel === c
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {getChannelIcon(c)}
              <span>{CHANNEL_META[c].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Record Cards */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <History className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No messages found
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Messages generated and sent will be archived here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const isScheduled = record.status === 'scheduled';
            return (
              <div
                key={record.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex flex-col justify-between gap-2 border-b border-zinc-100 pb-3 sm:flex-row sm:items-center dark:border-zinc-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {getChannelIcon(record.channel)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {record.recipientName}
                        </span>
                        {record.recipientContact && (
                          <span className="text-[11px] text-zinc-400">
                            ({record.recipientContact})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {CHANNEL_META[record.channel].label} • Receipt #{record.receiptId}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center space-x-2">
                    {isScheduled ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800">
                          <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          <Zap className="mr-1 h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>Auto-Send {formatCountdown(record.scheduledFor)}</span>
                        </span>
                        <span className="hidden text-[11px] text-zinc-400 sm:inline">
                          ({record.scheduledFor ? new Date(record.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'})
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1.5 h-3 w-3" />
                        Delivered ({record.deliveryTimestamp || 'Verified'})
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      title="Delete record"
                      className="rounded-md p-1 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Automation trigger note if present */}
                {record.events && record.events[0]?.note && (
                  <div className="mt-2.5 inline-flex items-center space-x-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    <span>Trigger: {record.events[0].note}</span>
                  </div>
                )}

                {/* Content preview */}
                <div className="py-3">
                  {record.subject && (
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Subject: {record.subject}
                    </div>
                  )}
                  <p className="mt-1 whitespace-pre-line text-xs text-zinc-600 leading-relaxed dark:text-zinc-300 line-clamp-3">
                    {record.body}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                  <div className="text-[11px] text-zinc-400">
                    Logged {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(record.id, record.subject ? `Subject: ${record.subject}\n\n${record.body}` : record.body)}
                      className="inline-flex items-center space-x-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {copiedId === record.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => onDispatchScheduledNow(record.id)}
                        className="inline-flex items-center space-x-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Now</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onLoadIntoComposer(record)}
                      className="inline-flex items-center space-x-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Re-edit in Composer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
