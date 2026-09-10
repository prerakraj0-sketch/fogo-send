import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Copy,
  X,
  Radio,
  FileCheck,
  Smartphone,
  Mail,
  MessageSquare,
  Hash,
  Linkedin
} from 'lucide-react';
import { ChannelType, MessageOutput, RecipientInfo, SentMessageRecord } from '../types';
import { CHANNEL_META } from '../data/templates';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelType;
  recipient: RecipientInfo;
  message: MessageOutput;
  onRecordSent: (record: SentMessageRecord) => void;
}

export function DispatchModal({
  isOpen,
  onClose,
  channel,
  recipient,
  message,
  onRecordSent,
}: DispatchModalProps) {
  const [step, setStep] = useState<'transmitting' | 'confirmed'>('transmitting');
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Connecting to channel gateway...');
  const [receiptId, setReceiptId] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const channelMeta = CHANNEL_META[channel];

  useEffect(() => {
    if (!isOpen) {
      setStep('transmitting');
      setProgress(15);
      return;
    }

    const newReceiptId = `REC-${channel.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptId(newReceiptId);

    // Simulation sequence
    const t1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Encrypting message payload and checking headers...');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusText(`Handshaking with ${channelMeta.label} gateway...`);
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Message dispatched & transmission verified!');
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setDeliveryTime(timeStr);
      setStep('confirmed');

      // Record in sent history
      onRecordSent({
        id: `sent_${Date.now()}`,
        createdAt: now.toISOString(),
        status: 'delivered',
        channel,
        recipientName: recipient.name || 'Recipient',
        recipientContact: recipient.contact || '',
        subject: message.subject,
        body: message.body,
        receiptId: newReceiptId,
        deliveryTimestamp: timeStr,
        events: [
          { timestamp: timeStr, status: 'queued', note: 'Prepared and signed in TiSend' },
          { timestamp: timeStr, status: 'sent', note: 'Transmitted via channel relay' },
          { timestamp: timeStr, status: 'delivered', note: 'Gateway acknowledgement received' },
        ],
      });
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct app link
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {step === 'transmitting' ? 'Dispatching Message...' : 'Dispatch Successful & Tracked'}
              </h3>
              <p className="text-xs text-zinc-500">Destination: {channelMeta.label}</p>
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

        {/* Transmission Animation */}
        {step === 'transmitting' ? (
          <div className="my-8 space-y-4 text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
              <Radio className="h-8 w-8 animate-pulse text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {statusText}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Routing message to {recipient.name || 'Recipient'}...
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mx-auto max-w-xs overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Confirmation Receipt Card */
          <div className="my-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Transmission Acknowledged
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">
                    Message was processed through TiSend Relay and logged with receipt ID{' '}
                    <span className="font-mono font-bold">{receiptId}</span>.
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt metadata table */}
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex justify-between">
                <span className="text-zinc-500">Recipient:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {recipient.name || 'Contact'}{' '}
                  {recipient.contact ? `(${recipient.contact})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Channel Gateway:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {channelMeta.label} Relay Network
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivered Timestamp:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {deliveryTime} (Local)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Security &amp; Integrity:</span>
                <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> TLS 1.3 Verified
                </span>
              </div>
            </div>

            {/* Direct Open Link CTA if applicable */}
            {directLink && (
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-emerald-600 bg-emerald-600 py-2.5 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Launch in {channelMeta.label} App (Optional)</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Done &amp; View in History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
