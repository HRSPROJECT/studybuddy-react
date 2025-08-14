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
        useOptimizedSearch: true // Assuming this is a feature flag for the backend
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io' // Adjust if worker origin policy changes
        }
      });
      
      // The backend might return a message even on success (e.g., partial results)
      // Or, if the backend itself signals an error in the response body for non-2xx status.
      if (response.data && response.data.message && response.status !== 200) {
         // This case might be redundant if Axios throws for non-2xx.
         // However, if the backend returns 200 OK but with an error message in the body.
        console.error('Web search failed with message:', response.data.message);
        throw new Error(`Web search failed: ${response.data.message}`);
      }
      return response.data;

    } catch (error: any) {
      console.error('Web search error:', error);
      let errorMessage = "Failed to perform web search. Please check your connection or try again later.";
      if (axios.isAxiosError(error) && error.response) {
        // Backend responded with an error status
        errorMessage = `Web search failed: ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Web search service is currently unavailable. Please try again later.";
      }
      // For other errors, the generic message is used.
      throw new Error(errorMessage);
    }
  },
  
  // Ask a question with optional image, search results, and conversation context
  askQuestion: async (request: AskRequest): Promise<AskResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/gemini`, {
        ...request // Spread the request object
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Ask question error:', error);
      let errorMessage = "Failed to get an answer from the AI. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `AI service error: ${error.response.data?.error || error.response.data?.message || error.message}`;
        if (error.response.status === 429) { // Too Many Requests
            errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (error.response.status === 500) {
            errorMessage = "The AI service encountered an internal error. Please try again later.";
        }
        // Check for specific Gemini error structures if backend proxies them
        if (error.response.data?.promptFeedback?.blockReason) {
            errorMessage = `Your request was blocked due to: ${error.response.data.promptFeedback.blockReason}. Please rephrase your query.`;
        }
      } else if (error.request) {
        errorMessage = "AI service is currently unavailable. Please try again later.";
      }
      throw new Error(errorMessage);
    }
  },
  
  // Get detailed explanation with optional image and search results
  getExplanation: async (request: ExplainRequest): Promise<ExplainResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/explain`, {
        ...request // Spread the request object
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://hrsproject.github.io'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get explanation error:', error);
      let errorMessage = "Failed to get an explanation from the AI. Please try again.";
       if (axios.isAxiosError(error) && error.response) {
        errorMessage = `AI service error: ${error.response.data?.error || error.response.data?.message || error.message}`;
         if (error.response.status === 429) {
            errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (error.response.status === 500) {
            errorMessage = "The AI service encountered an internal error. Please try again later.";
        }
        if (error.response.data?.promptFeedback?.blockReason) {
            errorMessage = `Your request was blocked due to: ${error.response.data.promptFeedback.blockReason}. Please rephrase your query.`;
        }
      } else if (error.request) {
        errorMessage = "AI service is currently unavailable. Please try again later.";
      }
      throw new Error(errorMessage);
    }
  },

  // Perform deep research on a problem
  performDeepResearch: async (
    problem: string,
    onStepUpdate: (step: any) => void
  ): Promise<void> => {
    // This is a mock implementation to simulate a streaming response.
    console.log(`Starting deep research for: "${problem}"`);

    const steps = [
      { id: '1', question: 'First, what is the core concept of this problem?', answer: null, status: 'thinking' },
      { id: '2', question: 'What are the benefits of this approach?', answer: null, status: 'pending' },
      { id: '3', question: 'How can this be implemented?', answer: null, status: 'pending' },
    ];

    const answers = [
      'The core concept is to break down a large problem into smaller, manageable sub-problems.',
      'Benefits include improved accuracy, better handling of complexity, and transparency in the reasoning process.',
      'Implementation can be done using a recursive or iterative process, often involving multiple calls to a language model with specific prompts for each sub-problem.',
    ];

    for (let i = 0; i < steps.length; i++) {
      // Announce the step we are thinking about
      onStepUpdate({ ...steps[i], status: 'thinking' });

      // Simulate network delay and thinking time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Provide the answer
      const completedStep = { ...steps[i], answer: answers[i], status: 'complete' };
      onStepUpdate(completedStep);

      // Update the step in our local array for consistency
      steps[i] = completedStep;
    }
  }
};

export default apiService;