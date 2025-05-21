export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  imagePreview?: string | null; // For user messages with image uploads
  imageUrl?: string | null; // For AI messages that might include an image URL in the response
  timestamp: string;
  showFeedback?: boolean; // To control visibility of feedback buttons for specific AI messages
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}
