import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import AskTab from './AskTab';
import { Message as ChatMessage, SearchResult } from '../types/chatTypes';
import apiService from '../services/apiService';
import * as helpers from '../utils/helpers';

// Mock child components
jest.mock('./InputSection', () => (props: any) => (
  <div data-testid="input-section">
    <input
      type="text"
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={props.onKeyDown} // Make sure this is correctly passed and can be called
    />
    <button onClick={() => props.onImageUpload(new File(['dummy'], 'dummy.png', { type: 'image/png' }))}>MockUpload</button>
    <button onClick={props.onClearImage}>MockClearImage</button>
    {props.imagePreview && <img src={props.imagePreview} alt="preview" />}
  </div>
));

jest.mock('./ResultsDisplay', () => (props: any) => (
  <div data-testid="results-display">
    {props.messages.map((msg: ChatMessage) => <div key={msg.id}>{msg.text}</div>)}
    {props.sources.map((src: SearchResult) => <div key={src.url}>{src.title}</div>)}
    <button onClick={() => props.onCopy('test copy text')}>MockCopy</button>
    <button onClick={props.onDownloadPdf}>MockDownloadPdf</button>
    {props.messages.filter((m: ChatMessage) => m.type ==='ai' && m.showFeedback).map((msg: ChatMessage) => (
        <button key={`feedback-${msg.id}`} onClick={() => props.onMessageFeedback(msg.id, 'good')}>MockFeedback</button>
    ))}
  </div>
));

// Mock apiService
jest.mock('../services/apiService');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock helpers
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'), // Keep original for other functions if any
  isMobileDevice: jest.fn(() => false),
  getImageBase64: jest.fn((file) => Promise.resolve(file ? 'mock-base64-data' : null)),
  downloadAnswerAsPdf: jest.fn(),
  // processOutputText: jest.fn(text => text), // Not needed if ResultsDisplay is fully mocked
}));

const mockShowNotification = jest.fn();

describe('AskTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide default mock implementations for apiService methods
    mockedApiService.performWebSearch.mockResolvedValue({
      results: [],
      originalQuery: 'original',
      optimizedQuery: 'optimized',
      isOptimized: true,
    });
    mockedApiService.askQuestion.mockResolvedValue({
      response: 'AI response',
      sources: [],
    });
  });

  const renderAskTab = () => render(<AskTab showNotification={mockShowNotification} />);

  test('Initial State: renders InputSection and ResultsDisplay with initial props', () => {
    renderAskTab();
    expect(screen.getByTestId('input-section')).toBeInTheDocument();
    expect(screen.getByTestId('results-display')).toBeInTheDocument();
    // Check initial props passed to InputSection (e.g., empty question value)
    const inputElement = screen.getByPlaceholderText('Type your question or describe an image...') as HTMLInputElement;
    expect(inputElement.value).toBe('');
  });

  test('Input Handling: updates question state on InputSection onChange', () => {
    renderAskTab();
    const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
    fireEvent.change(inputElement, { target: { value: 'new question' } });
    // Verify that InputSection receives the new value
    expect((screen.getByPlaceholderText('Type your question or describe an image...') as HTMLInputElement).value).toBe('new question');
  });

  test('Input Handling: image selection and clearing updates state', async () => {
    renderAskTab();
    const uploadButton = screen.getByText('MockUpload');
    
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    // Check if imagePreview is passed to InputSection (mocked InputSection renders an img tag)
    await waitFor(() => expect(screen.getByAltText('preview')).toBeInTheDocument());

    const clearButton = screen.getByText('MockClearImage');
    fireEvent.click(clearButton);
    expect(screen.queryByAltText('preview')).not.toBeInTheDocument();
  });

  describe('Form Submission (handleSubmit)', () => {
    test('successful submission updates messages, sources, context, lastResponse, and shows follow-up', async () => {
      renderAskTab();
      const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
      
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'Test question?' } });
      });
      
      // Simulate Ctrl+Enter (or a conceptual submit button if InputSection had one)
      // We need to get the onKeyDown from the props of the mocked InputSection
      // This is a bit tricky as the mock is simple. A more elaborate mock might store props.
      // For now, let's assume submission is triggered by Enter if question is not empty.
      // Or, more directly, we can call the submit handler if it were exposed, but it's not.
      // Let's simulate the keydown on the input that InputSection would receive.
      
      await act(async () => {
         fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
      });

      await waitFor(() => {
        expect(mockedApiService.performWebSearch).toHaveBeenCalledWith('Test question?', undefined);
      });
      await waitFor(() => {
        expect(mockedApiService.askQuestion).toHaveBeenCalled();
      });

      // Check ResultsDisplay for new messages
      expect(screen.getByText('Test question?')).toBeInTheDocument();
      expect(screen.getByText('AI response')).toBeInTheDocument();
      
      // Check if follow-up section appears (conceptual, as it's part of AskTab's own render)
      expect(screen.getByPlaceholderText('Ask a follow-up question...')).toBeInTheDocument();
    });

    test('API error during submission calls showNotification', async () => {
      mockedApiService.performWebSearch.mockRejectedValueOnce(new Error('Web search failed miserably'));
      renderAskTab();
      const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
      
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'Error question?' } });
      });
      await act(async () => {
        fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
      });

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith('Web search failed miserably', 'error');
      });
      expect(screen.queryByText('AI response')).not.toBeInTheDocument(); // No AI response should be added
    });
  });

  describe('Follow-up Question (handleFollowUpSubmit)', () => {
    test('successful follow-up submission updates messages and context', async () => {
        renderAskTab();
        // Initial submission to show follow-up
        const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
        await act(async () => {
            fireEvent.change(inputElement, { target: { value: 'Initial question' } });
            fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
        });
        await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());

        // Now, type and submit follow-up
        const followUpInputElement = screen.getByPlaceholderText('Ask a follow-up question...');
        mockedApiService.askQuestion.mockResolvedValueOnce({ response: 'Follow-up AI response', sources: [] });

        await act(async () => {
            fireEvent.change(followUpInputElement, { target: { value: 'Follow-up question' } });
            fireEvent.keyDown(followUpInputElement, { key: 'Enter', ctrlKey: true });
        });
        
        await waitFor(() => {
            expect(mockedApiService.performWebSearch).toHaveBeenCalledWith('Follow-up question'); // No image for follow-up by default
        });
        await waitFor(() => {
            expect(mockedApiService.askQuestion).toHaveBeenCalledTimes(2); // Initial + Follow-up
        });
        expect(screen.getByText('Follow-up question')).toBeInTheDocument();
        expect(screen.getByText('Follow-up AI response')).toBeInTheDocument();
    });
  });

  describe('Callbacks from ResultsDisplay', () => {
    test('handleCopyToClipboardInternal is called by ResultsDisplay mock', () => {
      renderAskTab();
      // Ensure some content is present for copy button to be enabled in mock
      const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
      fireEvent.change(inputElement, { target: { value: 'text' } });
      // ... (rest of submit logic to make ResultsDisplay show content) ...
      // For simplicity, assume ResultsDisplay's mock copy button is always active
      fireEvent.click(screen.getByText('MockCopy'));
      // The actual handleCopyToClipboardInternal uses showNotification
      expect(mockShowNotification).toHaveBeenCalledWith('Copied to clipboard!', 'success');
    });

    test('handleDownloadPdfInternal is called by ResultsDisplay mock', async () => {
      renderAskTab();
      // Trigger a submission to get some AI response, so PDF button might be conceptually enabled
      const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'pdf content' } });
        fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
      });
      await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
      
      fireEvent.click(screen.getByText('MockDownloadPdf'));
      expect(helpers.downloadAnswerAsPdf).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('PDF downloaded successfully!', 'success');
    });
    
    test('handleMessageFeedbackInternal is called by ResultsDisplay mock', async () => {
        renderAskTab();
        // Submit to get an AI message
        const inputElement = screen.getByPlaceholderText('Type your question or describe an image...');
        await act(async () => {
          fireEvent.change(inputElement, { target: { value: 'feedback test' } });
          fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
        });
        await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
        
        // Click the mock feedback button
        fireEvent.click(screen.getByText('MockFeedback')); // Assumes only one AI message for simplicity
        expect(mockShowNotification).toHaveBeenCalledWith(expect.stringContaining('Feedback (good) recorded'), 'info');
      });
  });
});
