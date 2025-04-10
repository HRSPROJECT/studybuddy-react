import axios from 'axios';

// Base URL for the Cloudflare Worker
const API_BASE_URL = 'https://royal-disk-4b70.hrsprojects2024.workers.dev';

// Types for API requests and responses
export interface WebSearchRequest {
  query: string;
  image?: string;
  useOptimizedSearch?: boolean;
}

export interface WebSearchResponse {
  results: SearchResult[];
  originalQuery?: string;
  optimizedQuery?: string;
  isOptimized?: boolean;
  message?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface AskRequest {
  prompt: string;
  image?: string;
  webSearchResults?: SearchResult[];
  conversationContext?: ConversationMessage[];
  optimizedQuery?: string;
}

export interface AskResponse {
  response: string;
  sources: SearchResult[];
}

export interface ExplainRequest {
  topic: string;
  image?: string;
  webSearchResults?: SearchResult[];
  optimizedQuery?: string;
}

export interface ExplainResponse {
  explanation: string;
  sources: SearchResult[];
}

export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
  image?: {
    data: string;
  };
}

// API service
const apiService = {
  // Perform web search with optional image and query optimization
  performWebSearch: async (query: string, image?: string): Promise<WebSearchResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/websearch`, {
        query,
        image,
        useOptimizedSearch: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Web search error:', error);
      return { results: [], message: "Failed to perform web search" };
    }
  },
  
  // Ask a question with optional image, search results, and conversation context
  askQuestion: async (request: AskRequest): Promise<AskResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/gemini`, {
        prompt: request.prompt,
        image: request.image,
        webSearchResults: request.webSearchResults,
        conversationContext: request.conversationContext,
        optimizedQuery: request.optimizedQuery
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Ask question error:', error);
      throw new Error('Failed to get answer');
    }
  },
  
  // Get detailed explanation with optional image and search results
  getExplanation: async (request: ExplainRequest): Promise<ExplainResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/explain`, {
        topic: request.topic,
        image: request.image,
        webSearchResults: request.webSearchResults,
        optimizedQuery: request.optimizedQuery
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get explanation error:', error);
      throw new Error('Failed to get explanation');
    }
  }
};

export default apiService;