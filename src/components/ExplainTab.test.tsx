import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ExplainTab from './ExplainTab';
import { SearchResult } from '../types/chatTypes'; // Assuming SearchResult is in chatTypes now
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
      onKeyDown={props.onKeyDown}
    />
    <button onClick={() => props.onImageUpload(new File(['dummy-explain'], 'dummy-explain.png', { type: 'image/png' }))}>MockUploadExplain</button>
    <button onClick={props.onClearImage}>MockClearImageExplain</button>
    {props.imagePreview && <img src={props.imagePreview} alt="preview-explain" />}
  </div>
));

jest.mock('./ResultsDisplay', () => (props: any) => (
  <div data-testid="results-display-explain">
    {props.content && <div>{props.content}</div>}
    {props.sources.map((src: SearchResult) => <div key={src.url}>{src.title}</div>)}
    <button onClick={() => props.onCopy('test copy text from explain')}>MockCopyExplain</button>
    <button onClick={props.onDownloadPdf}>MockDownloadPdfExplain</button>
    {/* Mock general feedback buttons if needed, though interaction is less direct */}
  </div>
));

// Mock apiService
jest.mock('../services/apiService');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock helpers
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  isMobileDevice: jest.fn(() => false),
  getImageBase64: jest.fn((file) => Promise.resolve(file ? 'mock-base64-data-explain' : null)),
  downloadAnswerAsPdf: jest.fn(),
}));

const mockShowNotification = jest.fn();

describe('ExplainTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.performWebSearch.mockResolvedValue({
      results: [],
      originalQuery: 'original topic',
      optimizedQuery: 'optimized topic',
      isOptimized: true,
    });
    mockedApiService.getExplanation.mockResolvedValue({
      explanation: 'AI explanation content',
      sources: [],
    });
  });

  const renderExplainTab = () => render(<ExplainTab showNotification={mockShowNotification} />);

  test('Initial State: renders InputSection and ResultsDisplay with initial props', () => {
    renderExplainTab();
    expect(screen.getByTestId('input-section')).toBeInTheDocument();
    expect(screen.getByTestId('results-display-explain')).toBeInTheDocument();
    const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?') as HTMLInputElement;
    expect(inputElement.value).toBe('');
    // Check that ResultsDisplay doesn't show explanation content initially
    expect(screen.queryByText('AI explanation content')).not.toBeInTheDocument();
  });

  test('Input Handling: updates topic state on InputSection onChange', () => {
    renderExplainTab();
    const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
    fireEvent.change(inputElement, { target: { value: 'new topic' } });
    expect((screen.getByPlaceholderText('What topic or image would you like explained?') as HTMLInputElement).value).toBe('new topic');
  });

  test('Input Handling: image selection and clearing updates state', async () => {
    renderExplainTab();
    const uploadButton = screen.getByText('MockUploadExplain');
    
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    await waitFor(() => expect(screen.getByAltText('preview-explain')).toBeInTheDocument());

    const clearButton = screen.getByText('MockClearImageExplain');
    fireEvent.click(clearButton);
    expect(screen.queryByAltText('preview-explain')).not.toBeInTheDocument();
  });

  describe('Form Submission (handleSubmit)', () => {
    test('successful submission updates explanation and sources', async () => {
      const mockSources: SearchResult[] = [{ title: 'Source 1', url: 'url1', snippet: 'snip1' }];
      mockedApiService.getExplanation.mockResolvedValueOnce({
        explanation: 'Detailed AI explanation',
        sources: mockSources,
      });

      renderExplainTab();
      const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
      
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'Test topic' } });
      });
      await act(async () => {
        fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
      });

      await waitFor(() => {
        expect(mockedApiService.performWebSearch).toHaveBeenCalledWith('Test topic', undefined);
      });
      await waitFor(() => {
        expect(mockedApiService.getExplanation).toHaveBeenCalled();
      });

      // Check ResultsDisplay for new content
      expect(screen.getByText('Detailed AI explanation')).toBeInTheDocument();
      expect(screen.getByText('Source 1')).toBeInTheDocument(); // Check if source is rendered
    });

    test('API error during submission calls showNotification', async () => {
      mockedApiService.getExplanation.mockRejectedValueOnce(new Error('Explanation generation failed'));
      renderExplainTab();
      const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
      
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'Error topic' } });
      });
      await act(async () => {
        fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
      });

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith('Explanation generation failed', 'error');
      });
      expect(screen.queryByText('AI explanation content')).not.toBeInTheDocument(); // No explanation should be set
    });

    test('submission with image calls services with image data', async () => {
        renderExplainTab();
        const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
        const uploadButton = screen.getByText('MockUploadExplain');

        await act(async () => {
            fireEvent.change(inputElement, { target: { value: 'Topic with image' } });
            fireEvent.click(uploadButton); // Simulates adding an image
        });
        
        await waitFor(() => expect(screen.getByAltText('preview-explain')).toBeInTheDocument()); // Wait for image to be "processed"

        await act(async () => {
            fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
        });

        await waitFor(() => {
            expect(mockedApiService.performWebSearch).toHaveBeenCalledWith('Topic with image', 'mock-base64-data-explain');
        });
        await waitFor(() => {
            expect(mockedApiService.getExplanation).toHaveBeenCalledWith(expect.objectContaining({
                topic: 'Topic with image',
                image: 'mock-base64-data-explain'
            }));
        });
    });
  });

  describe('Callbacks from ResultsDisplay', () => {
    test('handleCopyToClipboardInternal is called by ResultsDisplay mock', async () => {
        // First, submit something to have content in ResultsDisplay
        mockedApiService.getExplanation.mockResolvedValueOnce({ explanation: "Some text to copy", sources: [] });
        renderExplainTab();
        const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
        await act(async () => {
            fireEvent.change(inputElement, { target: { value: "topic for copy" } });
            fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
        });
        await waitFor(() => expect(screen.getByText("Some text to copy")).toBeInTheDocument());

        fireEvent.click(screen.getByText('MockCopyExplain'));
        expect(mockShowNotification).toHaveBeenCalledWith('Explanation copied to clipboard!', 'success');
      });
  
      test('handleDownloadPdfInternal is called by ResultsDisplay mock', async () => {
        mockedApiService.getExplanation.mockResolvedValueOnce({ explanation: "Some text for PDF", sources: [] });
        renderExplainTab();
        const inputElement = screen.getByPlaceholderText('What topic or image would you like explained?');
        await act(async () => {
            fireEvent.change(inputElement, { target: { value: "topic for pdf" } });
            fireEvent.keyDown(inputElement, { key: 'Enter', ctrlKey: true });
        });
        await waitFor(() => expect(screen.getByText("Some text for PDF")).toBeInTheDocument());

        fireEvent.click(screen.getByText('MockDownloadPdfExplain'));
        expect(helpers.downloadAnswerAsPdf).toHaveBeenCalled();
        expect(mockShowNotification).toHaveBeenCalledWith('PDF downloaded successfully!', 'success');
      });
  });
});
