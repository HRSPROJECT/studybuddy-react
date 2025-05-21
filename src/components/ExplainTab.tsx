import React, { useState, KeyboardEvent } from 'react'; // Removed useRef
import { 
  Box, 
  Typography, 
  Button, // TextField removed
  Paper, 
  CircularProgress, 
  // IconButton, List, ListItem, ListItemIcon, ListItemText, Link removed
} from '@mui/material';
// FileUploadIcon, LinkIcon, InfoIcon, ThumbUpAltIcon, ThumbDownAltIcon, FileCopyIcon, PictureAsPdfIcon, BookIcon removed
// Their functionalities will be part of InputSection or ResultsDisplay

import SendIcon from '@mui/icons-material/Send'; // Keep for main submit button
import apiService, { SearchResult } from '../services/apiService';
// processOutputText will be used by ResultsDisplay. getImageBase64, downloadAnswerAsPdf, isMobileDevice are kept.
import { getImageBase64, downloadAnswerAsPdf, isMobileDevice } from '../utils/helpers';
import InputSection from './InputSection'; // Import InputSection
import ResultsDisplay from './ResultsDisplay'; // Import ResultsDisplay

interface ExplainTabProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const ExplainTab: React.FC<ExplainTabProps> = ({ showNotification }) => {
  const [topic, setTopic] = useState<string>(''); // For InputSection
  const [imageFile, setImageFile] = useState<File | null>(null); // Managed via InputSection
  const [imagePreview, setImagePreview] = useState<string | null>(null); // For InputSection's preview
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [explanation, setExplanation] = useState<string>(''); // For ResultsDisplay content
  const [sources, setSources] = useState<SearchResult[]>([]); // For ResultsDisplay sources
  const [optimizedQuery, setOptimizedQuery] = useState<string | null>(null); // For ResultsDisplay
  const [originalQuery, setOriginalQuery] = useState<string | null>(null); // For ResultsDisplay
  
  // fileInputRef is now managed by InputSection
  const isMobile = isMobileDevice();

  // Adapted for InputSection: InputSection calls this with the File object
  const handleImageUploadInternal = (uploadedFile: File) => {
    if (!uploadedFile) return;
    setImageFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(uploadedFile);
  };
  
  const clearImageInternal = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  // Adapted for InputSection's onKeyDown prop
  const handleKeyDownInternal = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if ((topic.trim() || imageFile) && !isLoading) handleSubmit();
    }
  };
  
  // Passed to ResultsDisplay, which provides the text to copy (explanation)
  const handleCopyToClipboardInternal = (textToCopy: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showNotification('Explanation copied to clipboard!', 'success'))
        .catch(err => {
          console.error('Failed to copy explanation:', err);
          showNotification('Failed to copy explanation.', 'error');
        });
    } else {
      showNotification('No explanation to copy.', 'info');
    }
  };
  
  // Passed to ResultsDisplay
  const handleDownloadPdfInternal = () => {
    if (!explanation) {
      showNotification('No explanation to download.', 'warning');
      return;
    }
    try {
      // downloadAnswerAsPdf helper likely uses the explanation string.
      // It might be enhanced to accept sources, originalQuery, optimizedQuery for a richer PDF.
      downloadAnswerAsPdf('explain', explanation, sources, originalQuery || topic, optimizedQuery);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error("Error generating PDF for explanation:", error);
      showNotification('Failed to download PDF.', 'error');
    }
  };
  
  const handleSubmit = async () => {
    if (!topic.trim() && !imageFile) { // Check imageFile from InputSection
      showNotification('Please enter a topic or upload an image to explain.', 'warning');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Analyzing your topic...');
    setOptimizedQuery(null);
    setOriginalQuery(null);
    setExplanation(''); // Clear previous explanation
    setSources([]); // Clear previous sources
    
    try {
      let imageBase64: string | null = null;
      if (imageFile && imagePreview) {
        setLoadingMessage(imageFile ? 'Analyzing image and topic...' : 'Researching topic...');
        imageBase64 = imagePreview.split(',')[1]; // Use base64 data from preview
      } else if (imageFile) { // Fallback if preview isn't ready (should be rare)
         setLoadingMessage('Processing image...');
         imageBase64 = await getImageBase64(imageFile);
      }
      
      const webSearchData = await apiService.performWebSearch(topic, imageBase64 || undefined);
      const webSearchResults = webSearchData.results;
      
      if (webSearchData.isOptimized && webSearchData.optimizedQuery) {
        setOptimizedQuery(webSearchData.optimizedQuery);
        setOriginalQuery(webSearchData.originalQuery || topic);
      }
      
      setLoadingMessage('Generating detailed explanation...');
      
      const response = await apiService.getExplanation({
        topic: topic, // Use the current topic from state
        image: imageBase64 || undefined,
        webSearchResults,
        optimizedQuery: webSearchData.optimizedQuery
      });
      
      setExplanation(response.explanation);
      setSources(response.sources || []);
      clearImageInternal(); // Clear image after successful submission
      // Keep topic in the input for reference, or clear if desired: setTopic('');
      
    } catch (error: any) {
      console.error('Error in handleSubmit for ExplainTab:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while fetching the explanation. Please try again.";
      showNotification(errorMessage, 'error');
      setExplanation(''); // Clear any partial or old explanation
      setSources([]); // Clear sources on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: 'calc(100vh - 100px)' }, maxHeight: 'calc(100vh - 100px)' }}>
      <Paper 
        elevation={2} 
        sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 2 }}
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Get a Detailed Explanation
        </Typography>
        
        <InputSection
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onImageUpload={handleImageUploadInternal}
          onClearImage={clearImageInternal}
          imagePreview={imagePreview}
          isLoading={isLoading}
          onKeyDown={handleKeyDownInternal}
          placeholder="What topic or image would you like explained?"
          showKeyboardShortcutHint={!isMobile}
        />
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSubmit}
          disabled={isLoading || (!topic.trim() && !imageFile)}
          sx={{ mt: 2, py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.875rem', md: '1rem' }, borderRadius: '8px' }}
        >
          Get Explanation
        </Button>
      </Paper>
      
      <Paper elevation={1} sx={{ p: { xs: 1.5, md: 2 }, flexGrow: 1, overflowY: 'auto', borderRadius: 2, minHeight: { xs: 300, md: 'auto'} }}>
        <ResultsDisplay
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          optimizedQuery={optimizedQuery}
          originalQuery={originalQuery}
          content={explanation} // Pass explanation string as content
          sources={sources}
          onCopy={handleCopyToClipboardInternal} // ResultsDisplay will call this with 'explanation'
          onDownloadPdf={handleDownloadPdfInternal}
          isMobile={isMobile}
          showPdfDownloadButton={!!explanation && !isMobile}
          showFeedbackButtons={true} // Enable general feedback buttons for the explanation
          // onMessageFeedback is not applicable here as ExplainTab shows one block of content, not a chat.
        />
      </Paper>
    </Box>
  );
};

export default ExplainTab;