export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export interface Attachment {
  content: string; // Base64 string
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isStreaming?: boolean;
  timestamp: number;
  attachment?: Attachment;
  reasoningDetails?: any; // To store reasoning data from OpenRouter if needed
  executionTime?: number; // Time taken to generate response in milliseconds
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export type SendMessageFunction = (text: string, attachment?: Attachment) => Promise<void>;

export type ChatMode = 'general' | 'python' | 'linux';

export type Tone = 'professional' | 'casual' | 'enthusiastic' | 'concise';
export type AccentColor = 'stone' | 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo';

export interface UserSettings {
  theme: 'light' | 'dark';
  accentColor: AccentColor;
  userName: string;
  tone: Tone;
}