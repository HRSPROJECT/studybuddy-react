import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputSection from './InputSection';
import * as mobileDeviceUtils from '../utils/isMobileDevice'; // Import for mocking

// Mock the isMobileDevice utility
jest.mock('../utils/isMobileDevice', () => ({
  isMobileDevice: jest.fn(),
}));

const mockIsMobileDevice = mobileDeviceUtils.isMobileDevice as jest.Mock;

describe('InputSection Component', () => {
  const mockOnChange = jest.fn();
  const mockOnImageUpload = jest.fn();
  const mockOnClearImage = jest.fn();
  const mockOnKeyDown = jest.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onImageUpload: mockOnImageUpload,
    onClearImage: mockOnClearImage,
    imagePreview: null,
    isLoading: false,
    onKeyDown: mockOnKeyDown,
    placeholder: "Ask a question or describe an image...",
    showKeyboardShortcutHint: true,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockIsMobileDevice.mockReturnValue(false); // Default to not mobile
  });

  describe('Initial Rendering', () => {
    it('renders the text input field with the correct placeholder', () => {
      render(<InputSection {...defaultProps} />);
      expect(screen.getByPlaceholderText(defaultProps.placeholder)).toBeInTheDocument();
    });

    it('renders the "Upload Image" button', () => {
      render(<InputSection {...defaultProps} />);
      expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
    });

    it('does not show an image preview initially', () => {
      render(<InputSection {...defaultProps} />);
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });

    it('does not show "Clear Image" button initially', () => {
      render(<InputSection {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /clear image/i })).not.toBeInTheDocument();
    });
    
    it('shows the keyboard shortcut hint by default on desktop', () => {
      render(<InputSection {...defaultProps} />);
      expect(screen.getByText(/ctrl\+enter to submit/i)).toBeInTheDocument();
    });

    it('hides the keyboard shortcut hint if showKeyboardShortcutHint is false', () => {
      render(<InputSection {...defaultProps} showKeyboardShortcutHint={false} />);
      expect(screen.queryByText(/ctrl\+enter to submit/i)).not.toBeInTheDocument();
    });

    it('hides the keyboard shortcut hint if on mobile', () => {
      mockIsMobileDevice.mockReturnValue(true);
      render(<InputSection {...defaultProps} />);
      expect(screen.queryByText(/ctrl\+enter to submit/i)).not.toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('calls onChange prop handler when text is typed', () => {
      render(<InputSection {...defaultProps} />);
      const inputField = screen.getByPlaceholderText(defaultProps.placeholder);
      fireEvent.change(inputField, { target: { value: 'test query' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('displays the correct value in the input field', () => {
      render(<InputSection {...defaultProps} value="current value" />);
      const inputField = screen.getByPlaceholderText(defaultProps.placeholder) as HTMLTextAreaElement;
      expect(inputField.value).toBe('current value');
    });
  });

  describe('Image Handling', () => {
    it('calls onImageUpload with the file object when an image is selected', () => {
      render(<InputSection {...defaultProps} />);
      const uploadButton = screen.getByRole('button', { name: /upload image/i });
      const fileInput = uploadButton.nextSibling as HTMLInputElement; // Input is hidden sibling

      // Mock file selection
      const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
      // Instead of clicking the button which then clicks the input, directly interact with the input
      // This is because programmatically clicking the hidden input via its parent button can be tricky in RTL
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockOnImageUpload).toHaveBeenCalledWith(file);
    });

    it('displays the image preview when imagePreview prop is provided', () => {
      render(<InputSection {...defaultProps} imagePreview="test-image-url.jpg" />);
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'test-image-url.jpg');
    });

    it('shows "Clear Image" button when imagePreview is present', () => {
      render(<InputSection {...defaultProps} imagePreview="test-image-url.jpg" />);
      expect(screen.getByRole('button', { name: /clear image/i })).toBeInTheDocument();
    });
    
    it('calls onClearImage when "Clear Image" button is clicked', () => {
      render(<InputSection {...defaultProps} imagePreview="test-image-url.jpg" />);
      const clearButton = screen.getByRole('button', { name: /clear image/i });
      fireEvent.click(clearButton);
      expect(mockOnClearImage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('disables text input and buttons when isLoading is true', () => {
      render(<InputSection {...defaultProps} isLoading={true} />);
      expect(screen.getByPlaceholderText(defaultProps.placeholder)).toBeDisabled();
      expect(screen.getByRole('button', { name: /upload image/i })).toBeDisabled();
    });

    it('disables "Clear Image" button when isLoading is true and image is present', () => {
      render(<InputSection {...defaultProps} isLoading={true} imagePreview="test.jpg" />);
      expect(screen.getByRole('button', { name: /clear image/i })).toBeDisabled();
    });
  });

  describe('Keyboard Shortcut', () => {
    it('calls onKeyDown prop handler when a key is pressed', () => {
      render(<InputSection {...defaultProps} />);
      const inputField = screen.getByPlaceholderText(defaultProps.placeholder);
      fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });
      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Placeholder Prop', () => {
    it('uses the provided placeholder if different from default', () => {
      const customPlaceholder = "Describe your image here...";
      render(<InputSection {...defaultProps} placeholder={customPlaceholder} />);
      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });
  });
});
