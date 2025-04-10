import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SendIcon from '@mui/icons-material/Send';
import LinkIcon from '@mui/icons-material/Link';
import InfoIcon from '@mui/icons-material/Info';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BookIcon from '@mui/icons-material/Book';

import apiService, { SearchResult } from '../services/apiService';
import { getImageBase64, processOutputText, downloadAnswerAsPdf, isMobileDevice } from '../utils/helpers';

interface ExplainTabProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const ExplainTab: React.FC<ExplainTabProps> = ({ showNotification }) => {
  // State for the topic input
  const [topic, setTopic] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [explanation, setExplanation] = useState('');
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [optimizedQuery, setOptimizedQuery] = useState<string | null>(null);
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear image upload
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle keyboard shortcut (Ctrl+Enter)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      if (topic.trim()) handleSubmit();
    }
  };
  
  // Handle clipboard copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Explanation copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        showNotification('Failed to copy to clipboard', 'error');
      });
  };
  
  // Handle downloading as PDF
  const handleDownloadPdf = () => {
    try {
      downloadAnswerAsPdf('explain', explanation);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      showNotification('Failed to download PDF', 'error');
    }
  };
  
  // Handle topic submission
  const handleSubmit = async () => {
    if (!topic.trim()) {
      showNotification('Please enter a topic to explain', 'warning');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Analyzing your topic...');
    
    // Reset optimization notice
    setOptimizedQuery(null);
    setOriginalQuery(null);
    
    try {
      // Get image as base64 if available
      let imageBase64: string | null = null;
      if (imageFile) {
        setLoadingMessage(imageFile ? 'Analyzing image and topic...' : 'Researching topic...');
        imageBase64 = await getImageBase64(imageFile);
      }
      
      // Perform web search
      const webSearchData = await apiService.performWebSearch(topic, imageBase64 || undefined);
      const webSearchResults = webSearchData.results;
      
      // Save optimization info if available
      if (webSearchData.isOptimized && webSearchData.optimizedQuery) {
        setOptimizedQuery(webSearchData.optimizedQuery);
        setOriginalQuery(webSearchData.originalQuery || topic);
      }
      
      setLoadingMessage('Generating detailed explanation...');
      
      // Get explanation from API
      const response = await apiService.getExplanation({
        topic: topic,
        image: imageBase64 || undefined,
        webSearchResults,
        optimizedQuery: webSearchData.optimizedQuery
      });
      
      // Set the explanation
      setExplanation(response.explanation);
      
      // Update sources
      setSources(response.sources || []);
      
      // Reset inputs (but keep the topic text for reference)
      clearImage();
      
    } catch (error) {
      console.error('Error:', error);
      
      // Show error in explanation area
      setExplanation('Sorry, an error occurred while generating the explanation. Please try again.');
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Paper 
        elevation={1} 
        sx={{ p: 3, mb: 3 }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Get a Detailed Explanation
        </Typography>
        
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What topic would you like explained in detail?"
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<FileUploadIcon />}
            disabled={isLoading}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
            />
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Press Ctrl + Enter to submit
          </Typography>
        </Box>
        
        {imagePreview && (
          <Box sx={{ mb: 2 }}>
            <Box 
              component="img" 
              src={imagePreview} 
              alt="Preview" 
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 200, 
                objectFit: 'contain',
                borderRadius: 1
              }} 
            />
            <Button 
              size="small" 
              onClick={clearImage} 
              sx={{ mt: 1 }}
            >
              Clear Image
            </Button>
          </Box>
        )}
        
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={isLoading || !topic.trim()}
        >
          Get Explanation
        </Button>
      </Paper>
      
      {/* Results Container */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, minHeight: 200 }}>
        {/* Loading Indicator */}
        {isLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={3}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {loadingMessage}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Optimization Notice */}
            {optimizedQuery && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  bgcolor: 'action.hover', 
                  borderRadius: 1, 
                  p: 1, 
                  mb: 2 
                }}
              >
                <InfoIcon color="primary" sx={{ mr: 1, mt: 0.5 }} fontSize="small" />
                <Typography variant="body2">
                  Query optimized: "<strong>{originalQuery}</strong>" → "<strong>{optimizedQuery}</strong>"
                </Typography>
              </Box>
            )}
            
            {/* Explanation Content */}
            {explanation && (
              <Box>
                <Box 
                  sx={{ 
                    mb: 2,
                    pb: 2,
                    borderBottom: explanation ? 1 : 0,
                    borderColor: 'divider'
                  }}
                >
                  <Box 
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'grey.50',
                      borderLeft: 4,
                      borderColor: 'primary.main',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: processOutputText(explanation) }} />
                    
                    {/* Feedback buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                      {!isMobileDevice() && (
                        <>
                          <IconButton size="small" title="Helpful">
                            <ThumbUpAltIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Not Helpful">
                            <ThumbDownAltIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small" 
                        title="Copy explanation"
                        onClick={() => handleCopy(explanation)}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {/* Download button - only show if we have an explanation and not on mobile */}
                  {explanation && !isMobileDevice() && (
                    <Box sx={{ textAlign: 'right', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleDownloadPdf}
                      >
                        Download as PDF
                      </Button>
                    </Box>
                  )}
                </Box>
                
                {/* Sources */}
                {sources.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinkIcon sx={{ mr: 1 }} fontSize="small" /> Sources
                    </Typography>
                    <List dense>
                      {sources.map((source, index) => (
                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <LinkIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                underline="hover"
                              >
                                {source.title}
                              </Link>
                            } 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Empty state */}
            {!explanation && !isLoading && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 6,
                color: 'text.secondary'
              }}>
                <BookIcon sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
                <Typography variant="body1">
                  Ask for a detailed explanation of any topic
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, maxWidth: 500, textAlign: 'center' }}>
                  StudyBuddy will provide clear, comprehensive explanations with step-by-step breakdowns,
                  formulas, and diagrams when applicable.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ExplainTab;