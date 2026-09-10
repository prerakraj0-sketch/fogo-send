import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Hash,
  Linkedin,
  Sparkles,
  ArrowRight,
  User,
  Lightbulb,
  Check,
  ChevronDown,
  Globe,
  Sliders,
  RotateCcw,
  Zap,
  Layers,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ChannelType,
  ToneType,
  LengthType,
  MessageGenerationRequest,
  AutoSendConfig,
} from '../types';
import {
  CHANNEL_META,
  TONE_OPTIONS,
  RELATIONSHIP_TAGS,
  LANGUAGES,
  QUICK_TEMPLATES,
} from '../data/templates';

interface MessageComposerProps {
  onGenerate: (req: MessageGenerationRequest, isAutoSend?: boolean) => Promise<void>;
  isLoading: boolean;
  initialValues?: Partial<MessageGenerationRequest>;
  autoSendConfig: AutoSendConfig;
  onUpdateAutoSendConfig: (config: Partial<AutoSendConfig>) => void;
  onOpenSequenceModal: (data: { channel: ChannelType; recipient: any; intent: string; senderName: string }) => void;
  onOpenBatchCampaign: () => void;
}

export function MessageComposer({
  onGenerate,
  isLoading,
  initialValues,
  autoSendConfig,
  onUpdateAutoSendConfig,
  onOpenSequenceModal,
  onOpenBatchCampaign,
}: MessageComposerProps) {
  const [channel, setChannel] = useState<ChannelType>(initialValues?.channel || 'email');
  const [recipientName, setRecipientName] = useState(initialValues?.recipient?.name || '');
  const [recipientContact, setRecipientContact] = useState(initialValues?.recipient?.contact || '');
  const [relationship, setRelationship] = useState(initialValues?.recipient?.relationship || 'Colleague');
  const [senderName, setSenderName] = useState(initialValues?.senderName || 'Me');
  const [intent, setIntent] = useState(initialValues?.intent || '');
  const [additionalContext, setAdditionalContext] = useState(initialValues?.additionalContext || '');
  const [tone, setTone] = useState<ToneType>(initialValues?.tone || 'professional');
  const [length, setLength] = useState<LengthType>(initialValues?.length || 'standard');
  const [language, setLanguage] = useState(initialValues?.language || 'English');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const activeChannelMeta = CHANNEL_META[channel];

  const handleApplyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setChannel(template.channel);
    setIntent(template.intent);
    setTone(template.suggestedTone);
  };

  const handleReset = () => {
    setIntent('');
    setRecipientName('');
    setRecipientContact('');
    setAdditionalContext('');
    setTone('professional');
    setLength('standard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    await onGenerate({
      recipient: {
        name: recipientName.trim() || (channel === 'email' ? 'Recipient' : 'Contact'),
        contact: recipientContact.trim(),
        relationship,
      },
      channel,
      intent: intent.trim(),
      tone,
      length,
      language,
      senderName: senderName.trim() || 'Me',
      additionalContext: additionalContext.trim(),
    }, autoSendConfig.enabled);
  };

  const filteredTemplates = QUICK_TEMPLATES.filter((t) => t.channel === channel);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Craft New Message
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select the destination channel and describe what you need to communicate.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset inputs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Channel Selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            1. Destination Channel
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(CHANNEL_META) as ChannelType[]).map((cKey) => {
              const meta = CHANNEL_META[cKey];
              const isSelected = channel === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setChannel(cKey)}
                  className={`relative flex items-center justify-center space-x-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? `border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200`
                      : `border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:bg-zinc-800`
                  }`}
                >
                  {cKey === 'email' && <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {cKey === 'whatsapp' && <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  {cKey === 'sms' && <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                  {cKey === 'slack' && <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                  {cKey === 'linkedin' && <Linkedin className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
                  <span>{meta.label}</span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Recipient Information */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            2. Recipient Details
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Recipient Name / Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Contact Address / Number <span className="text-zinc-400">(Optional for direct send)</span>
              </label>
              <input
                type="text"
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
                placeholder={activeChannelMeta.defaultPlaceholder}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Relationship Context
              </label>
              <div className="relative">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {RELATIONSHIP_TAGS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Message Intent & Rough Draft */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              3. What do you want to say?
            </label>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Lightbulb className="mr-1 h-3.5 w-3.5" />
              {showTemplates ? 'Hide Inspiration Prompts' : 'Need ideas? View Prompts'}
            </button>
          </div>

          {/* Quick templates chips */}
          {showTemplates && (
            <div className="mb-3 flex flex-wrap gap-1.5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-[11px] font-semibold text-zinc-500 self-center mr-1 dark:text-zinc-400">
                Quick Prompts:
              </span>
              {(filteredTemplates.length > 0 ? filteredTemplates : QUICK_TEMPLATES.slice(0, 4)).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-200"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              rows={4}
              required
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Ask for a 2-day deadline extension on the marketing presentation because we need client data feedback. Propose delivering Friday morning."
              className="w-full rounded-xl border border-zinc-200 bg-white p-3.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
              <span>Enter raw notes, bullet points, or instructions</span>
              <span>{intent.length} characters</span>
            </div>
          </div>
        </div>

        {/* 4. Tone & Style Control */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            4. Tone &amp; Voice
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {TONE_OPTIONS.map((t) => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  title={t.desc}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Length & Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          {/* Length choices */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Length:</span>
            <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
              {(['short', 'standard', 'detailed'] as LengthType[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                    length === l
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {l === 'short' ? 'Concise (1-2 lines)' : l === 'standard' ? 'Standard' : 'Detailed'}
                </button>
              ))}
            </div>
          </div>

          {/* Language choice */}
          <div className="flex items-center space-x-2">
            <Globe className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Sliders className="mr-1 h-3.5 w-3.5" />
            {showAdvanced ? 'Fewer options' : 'Sender name & context'}
          </button>
        </div>

        {/* Advanced settings row */}
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Your Name / Sign-off Signature
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Alex Rivera, Senior Consultant"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Additional Nuance / Sensitive Constraints
              </label>
              <input
                type="text"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g. Avoid sounding defensive, mention budget is approved"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}

        {/* AUTOMATIC SEND CONFIGURATION CARD */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Automatic Send
                  </span>
                  <span className="rounded-md bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                    Autonomous
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Automatically dispatches right after Gemini crafts your message.
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <button
              type="button"
              onClick={() => onUpdateAutoSendConfig({ enabled: !autoSendConfig.enabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSendConfig.enabled ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  autoSendConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sub-options if Auto-Send is active */}
          {autoSendConfig.enabled && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 pt-2.5 dark:border-amber-900/40">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Review buffer countdown:
                </span>
                <div className="flex space-x-1">
                  {[
                    { sec: 0, label: '0s (Instant)' },
                    { sec: 3, label: '3s' },
                    { sec: 5, label: '5s' },
                    { sec: 10, label: '10s' },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => onUpdateAutoSendConfig({ countdownSeconds: item.sec })}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                        autoSendConfig.countdownSeconds === item.sec
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound alert toggle */}
              <button
                type="button"
                onClick={() => onUpdateAutoSendConfig({ soundEnabled: !autoSendConfig.soundEnabled })}
                className="inline-flex items-center space-x-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                title={autoSendConfig.soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
              >
                {autoSendConfig.soundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Chime On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Quick Automations Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400">Automation modes:</span>
          <button
            type="button"
            onClick={() =>
              onOpenSequenceModal({
                channel,
                recipient: {
                  name: recipientName.trim() || 'Recipient',
                  contact: recipientContact.trim(),
                  relationship,
                },
                intent: intent.trim() || 'Outreach & collaborative follow up',
                senderName: senderName.trim() || 'Me',
              })
            }
            className="inline-flex items-center space-x-1 rounded-lg border border-purple-200 bg-purple-50/60 px-2.5 py-1 font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>3-Step Auto-Sequence</span>
          </button>

          <button
            type="button"
            onClick={onOpenBatchCampaign}
            className="inline-flex items-center space-x-1 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Batch Multi-Send Campaign</span>
          </button>
        </div>

        {/* Submit Action */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isLoading || !intent.trim()}
            className={`flex w-full items-center justify-center space-x-2 rounded-xl py-3.5 px-6 text-sm font-semibold text-white shadow-md transition-all ${
              isLoading || !intent.trim()
                ? 'cursor-not-allowed bg-blue-400 opacity-60'
                : autoSendConfig.enabled
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-blue-600 hover:opacity-95 shadow-amber-500/20 active:scale-[0.99]'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>
                  {autoSendConfig.enabled
                    ? 'Generating and preparing automated dispatch...'
                    : 'Generating intelligent message with Gemini...'}
                </span>
              </>
            ) : (
              <>
                {autoSendConfig.enabled ? (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>
                      Generate &amp; Auto-Send (
                      {autoSendConfig.countdownSeconds === 0
                        ? 'Instant'
                        : `${autoSendConfig.countdownSeconds}s Countdown`}
                      )
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate {activeChannelMeta.label} Message</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
