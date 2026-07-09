export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isSelf?: boolean;
  gifUrl?: string;
  gifAspect?: number;
}
