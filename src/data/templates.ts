import { ChannelType, QuickPromptTemplate, ToneType } from '../types';

export const QUICK_TEMPLATES: QuickPromptTemplate[] = [
  {
    id: 'follow-up-meeting',
    title: 'Meeting Follow-up & Next Steps',
    category: 'work',
    channel: 'email',
    intent: 'Thank them for attending today’s strategy session, recap our two agreed action items, and confirm our next check-in on Thursday.',
    suggestedTone: 'professional',
  },
  {
    id: 'deadline-extension',
    title: 'Project Deadline Extension Request',
    category: 'work',
    channel: 'email',
    intent: 'Politely request a 48-hour extension on the design deliverable to incorporate recent stakeholder feedback and guarantee top quality.',
    suggestedTone: 'warm_friendly',
  },
  {
    id: 'invoice-reminder',
    title: 'Gentle Invoice Reminder',
    category: 'sales',
    channel: 'email',
    intent: 'Send a polite, non-confrontational reminder that invoice #1042 was due 3 days ago, and ask if they need any billing clarifications.',
    suggestedTone: 'direct_concise',
  },
  {
    id: 'whatsapp-quick-sync',
    title: 'Quick WhatsApp Sync Ping',
    category: 'work',
    channel: 'whatsapp',
    intent: 'Ask if they are free for a 5-minute quick audio call regarding the client update before 4 PM.',
    suggestedTone: 'casual',
  },
  {
    id: 'polite-decline',
    title: 'Politely Decline Invitation',
    category: 'networking',
    channel: 'email',
    intent: 'Warmly decline the panel speaking invitation due to existing project commitments, express gratitude, and propose keeping in touch for future events.',
    suggestedTone: 'apologetic',
  },
  {
    id: 'slack-announcement',
    title: 'Slack Feature Milestone Update',
    category: 'work',
    channel: 'slack',
    intent: 'Share that the v2.4 sprint is deployed to staging, thank engineering for the late push, and list 3 QA testing priorities.',
    suggestedTone: 'warm_friendly',
  },
  {
    id: 'linkedin-intro',
    title: 'LinkedIn Warm Connection Note',
    category: 'networking',
    channel: 'linkedin',
    intent: 'Compliment their recent article on AI design systems, mention our common interest in developer tooling, and ask to connect.',
    suggestedTone: 'persuasive',
  },
  {
    id: 'sms-appointment-confirm',
    title: 'SMS Appointment Confirmation',
    category: 'support',
    channel: 'sms',
    intent: 'Confirm tomorrow’s consultation at 10:30 AM and ask them to reply YES to confirm or CALL to reschedule.',
    suggestedTone: 'direct_concise',
  },
];

export const CHANNEL_META: Record<ChannelType, { label: string; iconName: string; color: string; bgLight: string; borderColor: string; defaultPlaceholder: string }> = {
  email: {
    label: 'Email',
    iconName: 'Mail',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    defaultPlaceholder: 'e.g., alex@acme.com',
  },
  whatsapp: {
    label: 'WhatsApp',
    iconName: 'MessageSquare',
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    defaultPlaceholder: 'e.g., +1 (555) 234-5678',
  },
  sms: {
    label: 'SMS Text',
    iconName: 'Smartphone',
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    defaultPlaceholder: 'e.g., +1 (555) 987-6543',
  },
  slack: {
    label: 'Slack / Teams',
    iconName: 'Hash',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    defaultPlaceholder: 'e.g., @sarah or #team-sync',
  },
  linkedin: {
    label: 'LinkedIn',
    iconName: 'Linkedin',
    color: 'text-sky-700',
    bgLight: 'bg-sky-50 dark:bg-sky-950/30',
    borderColor: 'border-sky-200 dark:border-sky-800',
    defaultPlaceholder: 'e.g., linkedin.com/in/alex-smith',
  },
};

export const TONE_OPTIONS: { id: ToneType; label: string; desc: string }[] = [
  { id: 'professional', label: 'Professional', desc: 'Refined, authoritative & executive' },
  { id: 'warm_friendly', label: 'Warm & Friendly', desc: 'Approachable, cheerful & thoughtful' },
  { id: 'direct_concise', label: 'Direct & Concise', desc: 'Zero fluff, fast to read' },
  { id: 'persuasive', label: 'Persuasive', desc: 'Compelling benefits & clear incentives' },
  { id: 'apologetic', label: 'Diplomatic & Sincere', desc: 'Thoughtful ownership & remedy' },
  { id: 'urgent', label: 'Time-Sensitive', desc: 'Clear priority & immediate request' },
  { id: 'casual', label: 'Casual & Relaxed', desc: 'Peer-to-peer everyday conversational' },
];

export const RELATIONSHIP_TAGS = [
  'Colleague',
  'Manager',
  'Client',
  'Customer',
  'Friend',
  'Recruiter',
  'Investor',
  'Partner',
  'Vendor',
];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Japanese',
  'Hindi',
  'Chinese (Simplified)',
  'Arabic',
  'Dutch',
  'Korean',
];
