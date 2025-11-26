export enum View {
  SPLASH = 'SPLASH',
  AUTH = 'AUTH',
  HOME = 'HOME',
  FEELINGS = 'FEELINGS',
  CREATE = 'CREATE',
  BUDDY = 'BUDDY'
}

export interface User {
  phone: string;
  name: string;
  city: string;
}

export interface FeelingLog {
  id: string;
  type: string;
  intensity: number; // 1-5
  note: string;
  timestamp: number;
  color: string;
}

export interface FeelingType {
  label: string;
  emoji: string;
  color: string;
}

export enum BuddyMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
