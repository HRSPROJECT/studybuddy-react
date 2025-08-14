import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsDisplay from './ResultsDisplay';
import { Message, SearchResult } from '../types/chatTypes'; // Assuming types are here
import * as textProcessingUtils from '../utils/helpers'; // For mocking processOutputText

// Mock the processOutputText utility from the helpers module
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'), // Keep original implementations for other helpers
  processOutputText: jest.fn((text) => <>{text}</>), // Mock just processOutputText
}));

const mockProcessOutputText = textProcessingUtils.processOutputText as jest.Mock;

describe('ResultsDisplay Component', () => {
  const mockOnCopy = jest.fn();
  const mockOnDownloadPdf = jest.fn();
  const mockOnMessageFeedback = jest.fn();

  const defaultProps = {
    isLoading: false,
    loadingMessage: 'Loading, please wait...',
    optimizedQuery: null,
    originalQuery: null,
    content: null,
    messages: [],
    sources: [],
    onCopy: mockOnCopy,
    onDownloadPdf: mockOnDownloadPdf,
    showPdfDownloadButton: true,
    isMobile: false,
    showFeedbackButtons: true,
    onMessageFeedback: mockOnMessageFeedback,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering & Empty State', () => {
    it('renders correctly with default/empty props', () => {
      render(<ResultsDisplay {...defaultProps} />);
      expect(screen.getByText('Your results will appear here.')).toBeInTheDocument();
    });

    it('displays the default empty state message and icon when no content or messages', () => {
      render(<ResultsDisplay {...defaultProps} />);
      expect(screen.getByText('Your results will appear here.')).toBeInTheDocument();
      expect(screen.getByText('Ask a question or request an explanation to get started.')).toBeInTheDocument();
      // Check for an icon, e.g., by test-id if it has one, or a class
      expect(screen.getByTestId('ChatBubbleOutlineOutlinedIcon')).toBeInTheDocument(); // MUI icons often have this testId
    });
  });

  describe('Loading State', () => {
    it('displays CircularProgress and loadingMessage when isLoading is true and no prior content', () => {
      render(<ResultsDisplay {...defaultProps} isLoading={true} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(defaultProps.loadingMessage)).toBeInTheDocument();
    });

    it('hides other content (empty state) when isLoading is true and no prior content', () => {
      render(<ResultsDisplay {...defaultProps} isLoading={true} />);
      expect(screen.queryByText('Your results will appear here.')).not.toBeInTheDocument();
    });
    
    it('does not show main loader if isLoading is true but there is prior content (messages)', () => {
      const messages: Message[] = [{ id: '1', type: 'user', text: 'hello', timestamp: 'now' }];
      render(<ResultsDisplay {...defaultProps} isLoading={true} messages={messages} />);
      // The main loader for empty state should not be there, but inline loader (handled by parent tab) is not part of this component's test
      expect(screen.queryByText(defaultProps.loadingMessage)).not.toBeInTheDocument(); 
      expect(screen.getByText('hello')).toBeInTheDocument(); // Prior content still visible
    });
  });

  describe('Content Display', () => {
    it('renders string content processed by processOutputText', () => {
      const testContent = "This is test content.";
      render(<ResultsDisplay {...defaultProps} content={testContent} />);
      expect(screen.getByText(testContent)).toBeInTheDocument();
      expect(mockProcessOutputText).toHaveBeenCalledWith(testContent);
    });

    it('renders ReactNode content directly', () => {
      const testContent = <div data-testid="react-node-content">Hello React Node</div>;
      render(<ResultsDisplay {...defaultProps} content={testContent} />);
      expect(screen.getByTestId('react-node-content')).toBeInTheDocument();
      expect(screen.getByText('Hello React Node')).toBeInTheDocument();
    });

    // Message specific tests
    const userMessage: Message = { id: 'm1', type: 'user', text: 'User query', timestamp: 't1' };
    const aiMessage: Message = { id: 'm2', type: 'ai', text: 'AI response', timestamp: 't2', showFeedback: true };
    const systemMessage: Message = { id: 'm3', type: 'system', text: 'System info', timestamp: 't3' };
    const messages: Message[] = [userMessage, aiMessage, systemMessage];

    it('renders each message in the messages array', () => {
      render(<ResultsDisplay {...defaultProps} messages={messages} />);
      expect(screen.getByText(userMessage.text)).toBeInTheDocument();
      expect(screen.getByText(aiMessage.text)).toBeInTheDocument();
      expect(screen.getByText(systemMessage.text)).toBeInTheDocument();
    });

    it('styles messages differently (simplified check for background or border)', () => {
      // This is a simplified check. Actual styling depends on theme and specific CSS.
      // We check if the parent Paper of the message text has classes that might indicate different styling.
      // Or, more reliably, check for distinct elements like Avatars with different icons/colors.
      render(<ResultsDisplay {...defaultProps} messages={messages} />);
      
      // User message: Check for PersonIcon and primary color association (approximate)
      const userMsgContainer = screen.getByText(userMessage.text).closest('div');
      const userAvatar = userMsgContainer?.parentElement?.querySelector('svg[data-testid="PersonIcon"]');
      expect(userAvatar).toBeInTheDocument();

      // AI message: Check for AutoAwesomeIcon and secondary color association (approximate)
      const aiMsgContainer = screen.getByText(aiMessage.text).closest('div');
      const aiAvatar = aiMsgContainer?.parentElement?.querySelector('svg[data-testid="AutoAwesomeIcon"]');
      expect(aiAvatar).toBeInTheDocument();

      // System message: Check for InfoOutlinedIcon and warning color association (approximate)
      const systemMsgContainer = screen.getByText(systemMessage.text).closest('div');
      const systemAvatar = systemMsgContainer?.parentElement?.querySelector('svg[data-testid="InfoOutlinedIcon"]');
      expect(systemAvatar).toBeInTheDocument();
    });

    it('displays images attached to messages', () => {
      const messagesWithImage: Message[] = [
        { id: 'm1', type: 'user', text: 'Look at this', imagePreview: 'user-image.jpg', timestamp: 't1' },
        { id: 'm2', type: 'ai', text: 'I see this', imageUrl: 'ai-image.png', timestamp: 't2' },
      ];
      render(<ResultsDisplay {...defaultProps} messages={messagesWithImage} />);
      expect(screen.getByAltText('Uploaded preview')).toHaveAttribute('src', 'user-image.jpg');
      expect(screen.getByAltText('AI response image')).toHaveAttribute('src', 'ai-image.png');
    });

    it('shows feedback buttons for AI messages and not for user/system messages', () => {
      render(<ResultsDisplay {...defaultProps} messages={messages} />);
      const aiMessageContainer = screen.getByText(aiMessage.text).closest('div');
      expect(within(aiMessageContainer!).getByRole('button', { name: /good response/i })).toBeInTheDocument();
      expect(within(aiMessageContainer!).getByRole('button', { name: /bad response/i })).toBeInTheDocument();

      const userMessageContainer = screen.getByText(userMessage.text).closest('div');
      expect(within(userMessageContainer!).queryByRole('button', { name: /good response/i })).not.toBeInTheDocument();
      
      const systemMessageContainer = screen.getByText(systemMessage.text).closest('div');
      expect(within(systemMessageContainer!).queryByRole('button', { name: /good response/i })).not.toBeInTheDocument();
    });

    it('does not show AI feedback buttons if showFeedbackButtons is false', () => {
      render(<ResultsDisplay {...defaultProps} messages={[aiMessage]} showFeedbackButtons={false} />);
      const aiMessageContainer = screen.getByText(aiMessage.text).closest('div');
      expect(within(aiMessageContainer!).queryByRole('button', { name: /good response/i })).not.toBeInTheDocument();
    });

    it('calls onMessageFeedback when AI message feedback button is clicked', () => {
        render(<ResultsDisplay {...defaultProps} messages={[aiMessage]} />);
        const aiMessageContainer = screen.getByText(aiMessage.text).closest('div');
        fireEvent.click(within(aiMessageContainer!).getByRole('button', { name: /good response/i }));
        expect(mockOnMessageFeedback).toHaveBeenCalledWith(aiMessage.id, 'good');
        fireEvent.click(within(aiMessageContainer!).getByRole('button', { name: /bad response/i }));
        expect(mockOnMessageFeedback).toHaveBeenCalledWith(aiMessage.id, 'bad');
      });
  });

  describe('Optimization Notice', () => {
    it('displays optimization notice when queries are provided', () => {
      render(<ResultsDisplay {...defaultProps} originalQuery="original" optimizedQuery="optimized" />);
      expect(screen.getByText('Showing results for your optimized query:')).toBeInTheDocument();
      expect(screen.getByText('optimized')).toBeInTheDocument();
      expect(screen.getByText('Original query: original')).toBeInTheDocument();
    });

    it('does not display notice if queries are missing', () => {
      render(<ResultsDisplay {...defaultProps} />);
      expect(screen.queryByText('Showing results for your optimized query:')).not.toBeInTheDocument();
    });
  });

  describe('Sources Display', () => {
    const sourcesData: SearchResult[] = [
      { title: 'Source 1', url: 'http://source1.com', snippet: 'Snippet 1' },
      { title: 'Source 2', url: 'http://source2.com', snippet: 'Snippet 2' },
    ];

    it('renders sources with titles and links', () => {
      render(<ResultsDisplay {...defaultProps} sources={sourcesData} content="Some content to make actions visible" />);
      expect(screen.getByText('References:')).toBeInTheDocument();
      expect(screen.getByText('Source 1')).toBeInTheDocument();
      expect(screen.getByText('Source 1').closest('a')).toHaveAttribute('href', 'http://source1.com');
      expect(screen.getByText('Snippet 1')).toBeInTheDocument();
      expect(screen.getByText('Source 2')).toBeInTheDocument();
    });

    it('does not display sources section if sources prop is empty', () => {
      render(<ResultsDisplay {...defaultProps} sources={[]} />);
      expect(screen.queryByText('References:')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    const contentForActions = "AI response text for actions.";
    // For messages, lastAiMessageText is derived. For content, it's the content itself.
    const messagesForActions: Message[] = [{ id: 'ai1', type: 'ai', text: contentForActions, timestamp: 't1' }];

    it('Copy Button: calls onCopy with AI message text', () => {
      render(<ResultsDisplay {...defaultProps} messages={messagesForActions} />);
      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
      expect(mockOnCopy).toHaveBeenCalledWith(contentForActions);
    });
    
    it('Copy Button: calls onCopy with content prop text', () => {
        render(<ResultsDisplay {...defaultProps} content={contentForActions} />);
        fireEvent.click(screen.getByRole('button', { name: /copy/i }));
        expect(mockOnCopy).toHaveBeenCalledWith(contentForActions);
      });

    it('Download PDF Button: renders when conditions are met', () => {
      render(<ResultsDisplay {...defaultProps} content={contentForActions} isMobile={false} showPdfDownloadButton={true} />);
      expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    });

    it('Download PDF Button: hides if showPdfDownloadButton is false', () => {
      render(<ResultsDisplay {...defaultProps} content={contentForActions} showPdfDownloadButton={false} />);
      expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument();
    });

    it('Download PDF Button: hides if no content', () => {
      render(<ResultsDisplay {...defaultProps} content={null} messages={[]} />);
      expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument();
    });

    it('Download PDF Button: hides if isMobile is true', () => {
      render(<ResultsDisplay {...defaultProps} content={contentForActions} isMobile={true} />);
      expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument();
    });

    it('Download PDF Button: calls onDownloadPdf when clicked', () => {
      render(<ResultsDisplay {...defaultProps} content={contentForActions} isMobile={false} />);
      fireEvent.click(screen.getByRole('button', { name: /pdf/i }));
      expect(mockOnDownloadPdf).toHaveBeenCalledTimes(1);
    });
    
    it('General Feedback Buttons: renders for explanation content when enabled', () => {
        render(<ResultsDisplay {...defaultProps} content="Explanation text" showFeedbackButtons={true} />);
        expect(screen.getByRole('button', { name: /good explanation/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /bad explanation/i })).toBeInTheDocument();
    });

    it('General Feedback Buttons: hides if showFeedbackButtons is false for explanation content', () => {
        render(<ResultsDisplay {...defaultProps} content="Explanation text" showFeedbackButtons={false} />);
        expect(screen.queryByRole('button', { name: /good explanation/i })).not.toBeInTheDocument();
    });
    
    it('General Feedback Buttons: does not render if there are messages (per-message feedback takes precedence)', () => {
        render(<ResultsDisplay {...defaultProps} messages={messagesForActions} content="Explanation text" showFeedbackButtons={true} />);
        expect(screen.queryByRole('button', { name: /good explanation/i })).not.toBeInTheDocument();
    });
  });
});

// Helper to query within a specific element, useful for messages
const within = (element: HTMLElement) => ({
    getByText: (text: string) => screen.getByText(text, { selector: `${element.tagName} *` }), // search only descendants
    queryByText: (text: string) => screen.queryByText(text, { selector: `${element.tagName} *` }),
    getByRole: (role: string, options?: any) => screen.getByRole(role, { ...options, container: element }),
    queryByRole: (role: string, options?: any) => screen.queryByRole(role, { ...options, container: element }),
  });
