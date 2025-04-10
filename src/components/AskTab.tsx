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

import apiService, { SearchResult, ConversationMessage } from '../services/apiService';
import { getImageBase64, processOutputText, downloadAnswerAsPdf, isMobileDevice } from '../utils/helpers';

interface AskTabProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  image?: string;
}

const AskTab: React.FC<AskTabProps> = ({ showNotification }) => {
  // State for the question input
  const [question, setQuestion] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [lastResponse, setLastResponse] = useState('');
  const [optimizedQuery, setOptimizedQuery] = useState<string | null>(null);
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track conversation context for the Gemini API
  const [conversationContext, setConversationContext] = useState<ConversationMessage[]>([]);
  
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
      if (showFollowUp) {
        if (followUpQuestion.trim()) handleFollowUpSubmit();
      } else {
        if (question.trim()) handleSubmit();
      }
    }
  };
  
  // Handle clipboard copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Response copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        showNotification('Failed to copy to clipboard', 'error');
      });
  };
  
  // Handle downloading as PDF
  const handleDownloadPdf = () => {
    try {
      downloadAnswerAsPdf('ask', lastResponse);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      showNotification('Failed to download PDF', 'error');
    }
  };
  
  // Generate a unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle question submission
  const handleSubmit = async () => {
    if (!question.trim()) {
      showNotification('Please enter your question first', 'warning');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Analyzing your question...');
    
    // Reset optimization notice
    setOptimizedQuery(null);
    setOriginalQuery(null);
    
    try {
      // Add user message to chat
      const userMessageId = generateId();
      setMessages(prev => [...prev, {
        id: userMessageId,
        type: 'user',
        content: question,
        image: imagePreview || undefined
      }]);
      
      // Get image as base64 if available
      let imageBase64: string | null = null;
      if (imageFile) {
        setLoadingMessage(imageFile ? 'Analyzing image and question...' : 'Searching for information...');
        imageBase64 = await getImageBase64(imageFile);
      }
      
      // Perform web search
      const webSearchData = await apiService.performWebSearch(question, imageBase64 || undefined);
      const webSearchResults = webSearchData.results;
      
      // Show system message if search failed
      if (webSearchData.message && webSearchResults.length === 0) {
        setMessages(prev => [...prev, {
          id: generateId(),
          type: 'system',
          content: 'Search results couldn\'t be retrieved. The answer may be less accurate.'
        }]);
      }
      
      // Save optimization info if available
      if (webSearchData.isOptimized && webSearchData.optimizedQuery) {
        setOptimizedQuery(webSearchData.optimizedQuery);
        setOriginalQuery(webSearchData.originalQuery || question);
      }
      
      setLoadingMessage('Generating answer...');
      
      // Add to conversation context
      const userContextMessage: ConversationMessage = {
        role: 'user',
        content: question
      };
      
      if (imageBase64) {
        userContextMessage.image = {
          data: imageBase64
        };
      }
      
      const newContext = [...conversationContext, userContextMessage];
      setConversationContext(newContext);
      
      // Get answer from API
      const response = await apiService.askQuestion({
        prompt: question,
        image: imageBase64 || undefined,
        webSearchResults,
        conversationContext: newContext,
        optimizedQuery: webSearchData.optimizedQuery
      });
      
      // Add AI response to conversation context
      const modelResponse: ConversationMessage = {
        role: 'model',
        content: response.response
      };
      
      const updatedContext = [...newContext, modelResponse];
      setConversationContext(updatedContext);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        id: generateId(),
        type: 'ai',
        content: response.response
      }]);
      
      // Save response for download
      setLastResponse(response.response);
      
      // Update sources
      setSources(response.sources || []);
      
      // Reset inputs
      setQuestion('');
      clearImage();
      
      // Show follow-up section
      setShowFollowUp(true);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Show error message in chat
      setMessages(prev => [...prev, {
        id: generateId(),
        type: 'system',
        content: 'Sorry, an error occurred. Please try again.'
      }]);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle follow-up question submission
  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim()) {
      showNotification('Please enter your follow-up question', 'warning');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Processing follow-up question...');
    
    try {
      // Add user follow-up to chat
      const userMessageId = generateId();
      setMessages(prev => [...prev, {
        id: userMessageId,
        type: 'user',
        content: followUpQuestion
      }]);
      
      // Add to conversation context
      const userFollowUp: ConversationMessage = {
        role: 'user',
        content: followUpQuestion
      };
      
      const newContext = [...conversationContext, userFollowUp];
      setConversationContext(newContext);
      
      // Perform web search for the follow-up
      const webSearchData = await apiService.performWebSearch(followUpQuestion);
      const webSearchResults = webSearchData.results;
      
      // Get answer from API
      const response = await apiService.askQuestion({
        prompt: followUpQuestion,
        webSearchResults,
        conversationContext: newContext
      });
      
      // Add AI response to conversation context
      const modelResponse: ConversationMessage = {
        role: 'model',
        content: response.response
      };
      
      const updatedContext = [...newContext, modelResponse];
      setConversationContext(updatedContext);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        id: generateId(),
        type: 'ai',
        content: response.response
      }]);
      
      // Save response for download
      setLastResponse(response.response);
      
      // Update sources
      setSources(response.sources || []);
      
      // Reset follow-up input
      setFollowUpQuestion('');
      
    } catch (error) {
      console.error('Error:', error);
      
      // Show error message in chat
      setMessages(prev => [...prev, {
        id: generateId(),
        type: 'system',
        content: 'Sorry, an error occurred with your follow-up question. Please try again.'
      }]);
      
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
          Ask a Question
        </Typography>
        
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask? Be specific for better results."
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
          disabled={isLoading || !question.trim()}
        >
          Get Answer
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
            
            {/* Chat Messages */}
            <Box sx={{ mb: 2 }}>
              {messages.map((message) => (
                <Box 
                  key={message.id} 
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    maxWidth: message.type === 'user' ? '85%' : '100%',
                    ml: message.type === 'user' ? 'auto' : 0,
                    bgcolor: message.type === 'user'
                      ? 'primary.light'
                      : message.type === 'system'
                        ? 'warning.light'
                        : 'grey.100',
                    color: message.type === 'user' ? 'white' : 'text.primary',
                    borderRight: message.type === 'user' ? 4 : 0,
                    borderLeft: message.type === 'ai' ? 4 : message.type === 'system' ? 4 : 0,
                    borderColor: message.type === 'user'
                      ? 'primary.main'
                      : message.type === 'system'
                        ? 'warning.main'
                        : 'primary.main',
                    position: 'relative',
                    textAlign: message.type === 'user' ? 'right' : 'left',
                  }}
                >
                  {/* Message content */}
                  <div dangerouslySetInnerHTML={{ __html: processOutputText(message.content) }} />
                  
                  {/* Image if present */}
                  {message.image && (
                    <Box
                      component="img"
                      src={message.image}
                      alt="Attached"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 150,
                        objectFit: 'contain',
                        borderRadius: 1,
                        mt: 1
                      }}
                    />
                  )}
                  
                  {/* Feedback buttons for AI responses */}
                  {message.type === 'ai' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
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
                        title="Copy response"
                        onClick={() => handleCopy(message.content)}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
            
            {/* Download button - only show if we have responses and not on mobile */}
            {messages.length > 0 && lastResponse && !isMobileDevice() && (
              <Box sx={{ textAlign: 'right', mb: 2 }}>
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
            
            {/* Sources */}
            {sources.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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
          </>
        )}
      </Paper>
      
      {/* Follow-up section */}
      {showFollowUp && !isLoading && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Ask a follow-up question..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleFollowUpSubmit}
              disabled={!followUpQuestion.trim()}
            >
              Ask Follow-up
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Press Ctrl + Enter to submit
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AskTab;