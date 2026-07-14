export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isSelf?: boolean;
  gifUrl?: string;
  gifAspect?: number;
  isSticker?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  replyTo?: {
    id: string;
    text: string;
    sender: string;
    gifUrl?: string;
    isSticker?: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  };
}
