export type ChannelType = 'email' | 'whatsapp' | 'sms' | 'slack' | 'linkedin';

export type ToneType = 
  | 'professional'
  | 'warm_friendly'
  | 'direct_concise'
  | 'persuasive'
  | 'apologetic'
  | 'urgent'
  | 'casual';

export type LengthType = 'short' | 'standard' | 'detailed';

export interface RecipientInfo {
  name: string;
  contact: string; // email, phone number, or handle
  relationship: string;
}

export interface MessageGenerationRequest {
  recipient: RecipientInfo;
  channel: ChannelType;
  intent: string;
  tone: ToneType;
  length: LengthType;
  language: string;
  senderName?: string;
  additionalContext?: string;
}

export interface AlternativeVariant {
  title: string;
  description: string;
  body: string;
  subject?: string;
}

export interface MessageOutput {
  id: string;
  subject?: string;
  body: string;
  callToAction: string;
  toneAnalysis: string;
  readingTime: string;
  keyPoints: string[];
  alternativeVariants: AlternativeVariant[];
}

export type DeliveryStatus = 'draft' | 'scheduled' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read';

export interface SentMessageRecord {
  id: string;
  createdAt: string;
  scheduledFor?: string;
  status: DeliveryStatus;
  channel: ChannelType;
  recipientName: string;
  recipientContact: string;
  subject?: string;
  body: string;
  receiptId: string;
  deliveryTimestamp?: string;
  readTimestamp?: string;
  events: {
    timestamp: string;
    status: DeliveryStatus;
    note: string;
  }[];
}

export interface QuickPromptTemplate {
  id: string;
  title: string;
  category: 'work' | 'sales' | 'networking' | 'personal' | 'support';
  channel: ChannelType;
  intent: string;
  suggestedTone: ToneType;
}

export interface AutoSendConfig {
  enabled: boolean;
  countdownSeconds: number; // 0, 3, 5, 10
  soundEnabled: boolean;
  autoProcessQueue: boolean; // whether background scheduler auto-dispatches overdue/due messages
}

export interface SequenceStep {
  stepNumber: number;
  delayLabel: string;
  delayHours: number;
  subject?: string;
  body: string;
  triggerCondition: string;
}

export interface BatchRecipientItem {
  id: string;
  name: string;
  contact: string;
  relationship: string;
  customNote?: string;
  status: 'idle' | 'generating' | 'sending' | 'delivered' | 'failed';
  generatedBody?: string;
  generatedSubject?: string;
  receiptId?: string;
  error?: string;
}
