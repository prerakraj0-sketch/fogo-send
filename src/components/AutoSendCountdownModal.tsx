import { useEffect, useState } from 'react';
import { Zap, Send, X, Pause, Play, CheckCircle2 } from 'lucide-react';
import { ChannelType, MessageOutput, RecipientInfo } from '../types';
import { CHANNEL_META } from '../data/templates';
import { playCountdownTick, playDispatchChime } from '../utils/audio';

interface AutoSendCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdownSeconds: number; // e.g. 5
  channel: ChannelType;
  recipient: RecipientInfo;
  message: MessageOutput;
  soundEnabled: boolean;
  onConfirmSend: () => void;
}

export function AutoSendCountdownModal({
  isOpen,
  onClose,
  countdownSeconds,
  channel,
  recipient,
  message,
  soundEnabled,
  onConfirmSend,
}: AutoSendCountdownModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(countdownSeconds);
      setIsPaused(false);
      return;
    }

    setSecondsLeft(countdownSeconds);
    setIsPaused(false);

    // If zero seconds, immediate dispatch
    if (countdownSeconds <= 0) {
      if (soundEnabled) playDispatchChime();
      onConfirmSend();
      onClose();
      return;
    }
  }, [isOpen, countdownSeconds]);

  useEffect(() => {
    if (!isOpen || isPaused || secondsLeft <= 0) return;

    if (soundEnabled && secondsLeft > 0) {
      playCountdownTick();
    }

    const timer = setTimeout(() => {
      if (secondsLeft === 1) {
        if (soundEnabled) playDispatchChime();
        onConfirmSend();
        onClose();
      } else {
        setSecondsLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, isPaused, secondsLeft, soundEnabled, onConfirmSend, onClose]);

  if (!isOpen) return null;

  const channelMeta = CHANNEL_META[channel];
  const progressPercent = Math.max(0, Math.min(100, ((countdownSeconds - secondsLeft) / countdownSeconds) * 100));

  const handleSendNow = () => {
    if (soundEnabled) playDispatchChime();
    onConfirmSend();
    onClose();
  };

  const handleAbort = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl dark:border-blue-900/50 dark:bg-zinc-900">
        {/* Progress Header Bar */}
        <div className="h-2 w-full bg-blue-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Zap className="h-4 w-4 animate-bounce" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Automatic Send in Progress
                </h3>
                <p className="text-xs text-zinc-500">Autonomous transmission armed</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAbort}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Cancel automatic send"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Countdown Display */}
          <div className="my-6 flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 py-5 text-center dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-500 bg-white shadow-inner dark:bg-zinc-900">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {secondsLeft}s
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Auto-dispatching to <span className="text-blue-600 dark:text-blue-400">{recipient.name || 'Recipient'}</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              via {channelMeta.label} ({recipient.contact || 'Direct Relay'})
            </p>
          </div>

          {/* Message snippet preview */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left dark:border-zinc-800 dark:bg-zinc-800/40">
            {message.subject && (
              <p className="text-xs font-semibold text-zinc-800 truncate dark:text-zinc-200">
                {message.subject}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-zinc-600 line-clamp-2 dark:text-zinc-400">
              {message.body}
            </p>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Resume Timer</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pause Timer</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAbort}
                className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Cancel Auto-Send
              </button>
              <button
                type="button"
                onClick={handleSendNow}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Right Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
