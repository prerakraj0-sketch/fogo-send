import { Send, Clock, History, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { AutoSendConfig } from '../types';

interface HeaderProps {
  activeTab: 'compose' | 'history';
  setActiveTab: (tab: 'compose' | 'history') => void;
  sentCount: number;
  scheduledCount: number;
  autoSendConfig: AutoSendConfig;
  onToggleAutoSend: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  sentCount,
  scheduledCount,
  autoSendConfig,
  onToggleAutoSend,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
            <Send className="h-5 w-5 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                TiSend
              </span>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                AI Message Studio
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Draft, tailor, refine, &amp; dispatch across all communication channels
            </p>
          </div>
        </div>

        {/* Navigation & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Auto-Send Toggle */}
          <button
            type="button"
            onClick={onToggleAutoSend}
            className={`flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              autoSendConfig.enabled
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            }`}
            title="Click to toggle automatic send mode"
          >
            <Zap
              className={`h-3.5 w-3.5 ${
                autoSendConfig.enabled ? 'text-amber-600 dark:text-amber-400 fill-amber-500' : 'text-zinc-400'
              }`}
            />
            <span>
              Auto-Send: {autoSendConfig.enabled ? `ON (${autoSendConfig.countdownSeconds === 0 ? 'Instant' : `${autoSendConfig.countdownSeconds}s`})` : 'OFF'}
            </span>
          </button>

          <div className="hidden items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:flex dark:bg-emerald-950/40 dark:text-emerald-300">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Gemini 3.8 Intelligence
          </div>

          <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'compose'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Composer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Outbox &amp; History</span>
              {sentCount > 0 && (
                <span className="ml-1 rounded-full bg-zinc-200 px-1.5 py-0.2 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {sentCount}
                </span>
              )}
              {scheduledCount > 0 && (
                <span className="flex items-center text-amber-600 dark:text-amber-400" title={`${scheduledCount} scheduled`}>
                  <Clock className="ml-1 h-3 w-3" />
                  <span className="text-[10px] font-bold">{scheduledCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
