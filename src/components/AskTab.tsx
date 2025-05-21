import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  Box, 
  Typography, 
  Button, // TextField removed
  Paper, 
  CircularProgress, 
  TextField, // Keep TextField for Follow-up section
  // IconButton, List, ListItem, ListItemIcon, ListItemText, Link removed as ResultsDisplay will handle this
} from '@mui/material';
// FileUploadIcon, LinkIcon, InfoIcon, ThumbUpAltIcon, ThumbDownAltIcon, FileCopyIcon, PictureAsPdfIcon removed
// They will be used by InputSection or ResultsDisplay internally

import SendIcon from '@mui/icons-material/Send'; // Keep for the main submit button and follow-up
import apiService, { SearchResult, ConversationMessage } from '../services/apiService';
// processOutputText will be used by ResultsDisplay, getImageBase64 and downloadAnswerAsPdf might be adapted or kept
import { getImageBase64, downloadAnswerAsPdf, isMobileDevice } from '../utils/helpers'; 
import InputSection from './InputSection'; // Import InputSection
import ResultsDisplay from './ResultsDisplay'; // Import ResultsDisplay
import { Message as ChatMessage } from '../types/chatTypes'; // Import unified Message type

interface AskTabProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

// Local Message interface is removed, ChatMessage from chatTypes will be used.

const AskTab: React.FC<AskTabProps> = ({ showNotification }) => {
  const [question, setQuestion] = useState<string>(''); // For InputSection
  const [followUpQuestion, setFollowUpQuestion] = useState<string>(''); // For the follow-up TextField
  const [imageFile, setImageFile] = useState<File | null>(null); // Managed via InputSection
  const [imagePreview, setImagePreview] = useState<string | null>(null); // For InputSection's preview
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Use ChatMessage type
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [lastResponse, setLastResponse] = useState<string>(''); // Still useful for overall last AI text for some functions
  const [optimizedQuery, setOptimizedQuery] = useState<string | null>(null);
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState<boolean>(false);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Ref for scrolling to last message
  const followUpInputRef = useRef<HTMLInputElement>(null); // Ref for focusing follow-up input
  
  const [conversationContext, setConversationContext] = useState<ConversationMessage[]>([]);
  const isMobile = isMobileDevice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Scroll when messages change

  useEffect(() => {
    if (showFollowUp && !isLoading && followUpInputRef.current) {
      // Add a small delay to ensure the input is rendered and visible before focusing
      setTimeout(() => {
        followUpInputRef.current?.focus();
      }, 100);
    }
  }, [showFollowUp, isLoading]);


  // Updated handleImageUpload for InputSection: InputSection calls this with the File object
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
  
  // handleKeyDown for InputSection's text field and the separate follow-up TextField
  const handleKeyDownInternal = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault(); 
      if (showFollowUp) {
        if (followUpQuestion.trim() && !isLoading) handleFollowUpSubmit();
      } else {
        if ((question.trim() || imageFile) && !isLoading) handleSubmit();
      }
    }
  };
  
  // handleCopyToClipboard is passed to ResultsDisplay
  const handleCopyToClipboardInternal = (textToCopy: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showNotification('Copied to clipboard!', 'success'))
        .catch(err => {
          console.error('Failed to copy:', err);
          showNotification('Failed to copy to clipboard.', 'error');
        });
    } else {
      showNotification('No content to copy.', 'info');
    }
  };
  
  // handleDownloadPdfInternal is passed to ResultsDisplay
  const handleDownloadPdfInternal = () => {
    const aiMessagesContent = messages
        .filter(msg => msg.type === 'ai')
        .map(msg => msg.text) 
        .join("\n\n---\n\n");

    if (!aiMessagesContent) {
      showNotification('No AI response content to download.', 'warning');
      return;
    }
    try {
      downloadAnswerAsPdf('ask', aiMessagesContent, sources, originalQuery || question, optimizedQuery);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification('Failed to download PDF.', 'error');
    }
  };
  
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const handleSubmit = async () => {
    if (!question.trim() && !imageFile) { 
      showNotification('Please enter a question or upload an image.', 'warning');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Analyzing your question...');
    setOptimizedQuery(null);
    setOriginalQuery(null);
    
    try {
      const userMessageId = generateId();
      const userMessage: ChatMessage = {
        id: userMessageId,
        type: 'user',
        text: question, 
        imagePreview: imagePreview, 
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      
      let imageBase64: string | null = null;
      if (imageFile && imagePreview) { 
        setLoadingMessage('Analyzing image and question...');
        imageBase64 = imagePreview.split(',')[1]; 
      } else if (imageFile) { 
        setLoadingMessage('Processing image...');
        imageBase64 = await getImageBase64(imageFile); 
      }
      
      const webSearchData = await apiService.performWebSearch(question, imageBase64 || undefined);
      const webSearchResults = webSearchData.results;
      
      if (webSearchData.message && webSearchResults.length === 0) {
        setMessages((prev) => [...prev, {
          id: generateId(), type: 'system', text: 'Search results couldn\'t be retrieved. The answer may be less accurate.', timestamp: new Date().toISOString()
        }]);
      }
      
      if (webSearchData.isOptimized && webSearchData.optimizedQuery) {
        setOptimizedQuery(webSearchData.optimizedQuery);
        setOriginalQuery(webSearchData.originalQuery || question);
      }
      
      setLoadingMessage('Generating answer...');
      
      const userContextMessage: ConversationMessage = { role: 'user', content: question };
      if (imageBase64) userContextMessage.image = { data: imageBase64 };
      const newContext = [...conversationContext, userContextMessage];
      setConversationContext(newContext);
      
      const response = await apiService.askQuestion({
        prompt: question,
        image: imageBase64 || undefined, 
        webSearchResults,
        conversationContext: newContext,
        optimizedQuery: webSearchData.optimizedQuery
      });
      
      const modelResponse: ConversationMessage = { role: 'model', content: response.response };
      const updatedContext = [...newContext, modelResponse];
      setConversationContext(updatedContext);
      
      setMessages((prev) => [...prev, {
        id: generateId(), type: 'ai', text: response.response, timestamp: new Date().toISOString(), showFeedback: true 
      }]);
      
      setLastResponse(response.response); 
      setSources(response.sources || []);
      setQuestion(''); 
      clearImageInternal(); 
      setShowFollowUp(true);
      
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during submission. Please try again.";
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim()) {
      showNotification('Please enter your follow-up question.', 'warning');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Processing follow-up question...');
    try {
      const userMessageId = generateId();
      setMessages((prev) => [...prev, {
        id: userMessageId, type: 'user', text: followUpQuestion, timestamp: new Date().toISOString()
      }]);
      
      const userFollowUp: ConversationMessage = { role: 'user', content: followUpQuestion };
      const newContext = [...conversationContext, userFollowUp];
      setConversationContext(newContext);
      
      const webSearchData = await apiService.performWebSearch(followUpQuestion);
      const webSearchResults = webSearchData.results;
      
      const response = await apiService.askQuestion({
        prompt: followUpQuestion,
        webSearchResults,
        conversationContext: newContext
      });
      
      const modelResponse: ConversationMessage = { role: 'model', content: response.response };
      const updatedContext = [...newContext, modelResponse];
      setConversationContext(updatedContext);
      
      setMessages((prev) => [...prev, {
        id: generateId(), type: 'ai', text: response.response, timestamp: new Date().toISOString(), showFeedback: true
      }]);
      
      setLastResponse(response.response); 
      setSources(response.sources || []); 
      setFollowUpQuestion(''); 
      
    } catch (error: any) {
      console.error('Error in handleFollowUpSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred with the follow-up. Please try again.";
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleMessageFeedbackInternal = (messageId: string, feedback: 'good' | 'bad') => {
    console.log(`Feedback for message ${messageId}: ${feedback}. This needs backend integration.`);
    showNotification(`Feedback (${feedback}) recorded for message ${messageId}. (Display only)`, 'info');
    setMessages(prevMessages => prevMessages.map(msg =>
      msg.id === messageId ? { ...msg, showFeedback: false } : msg
    ));
  };

  return (
    <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: 'calc(100vh - 100px)' }, maxHeight: 'calc(100vh - 100px)' }}>
      
      <Paper 
        elevation={2} 
        sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 2 }} 
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Ask a Question
        </Typography>
        
        <InputSection
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onImageUpload={handleImageUploadInternal}
          onClearImage={clearImageInternal}
          imagePreview={imagePreview}
          isLoading={isLoading}
          onKeyDown={handleKeyDownInternal} 
          placeholder="Type your question or describe an image..."
          showKeyboardShortcutHint={!isMobile}
        />
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          endIcon={isLoading && messages.length === 0 ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} 
          onClick={handleSubmit}
          disabled={isLoading || (!question.trim() && !imageFile)}
          sx={{ mt: 2, py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.875rem', md: '1rem' }, borderRadius: '8px' }}
        >
          Get Answer
        </Button>
      </Paper>
      
      <Paper elevation={1} sx={{ p: { xs: 1.5, md: 2 }, flexGrow: 1, overflowY: 'auto', borderRadius: 2, minHeight: { xs: 300, md: 'auto'} }}>
        <ResultsDisplay
          isLoading={isLoading && messages.length === 0} 
          loadingMessage={loadingMessage}
          optimizedQuery={optimizedQuery}
          originalQuery={originalQuery}
          messages={messages}
          sources={sources}
          onCopy={handleCopyToClipboardInternal}
          onDownloadPdf={handleDownloadPdfInternal}
          isMobile={isMobile}
          showPdfDownloadButton={messages.some(m => m.type === 'ai') && !isMobile} 
          showFeedbackButtons={true} 
          onMessageFeedback={handleMessageFeedbackInternal}
          scrollTargetRef={messagesEndRef} // Pass the ref here
        />
        {isLoading && messages.length > 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={2}>
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {loadingMessage || "Generating response..."}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Follow-up section - Appears below results when active */}
      {showFollowUp && !isLoading && (
        <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mt: 2, borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Ask a follow-up question..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            onKeyDown={handleKeyDownInternal} // Ensure correct handler is used
            size="small"
            disabled={isLoading} // Disable if parent is loading, though this section hides on parent isLoading
            sx={{ mb: 2, borderRadius: '6px', '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
          />
          
          <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: 'center', gap: {xs: 1, sm: 2} }}>
            <Button
              variant="contained"
              color="primary"
              endIcon={isLoading ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
              onClick={handleFollowUpSubmit}
              disabled={isLoading || !followUpQuestion.trim()}
              fullWidth={isMobile} // Make button full width on mobile
              sx={{ py: {xs: 0.8, sm:1}, fontSize: {xs: '0.8rem', sm: '0.875rem'}, borderRadius: '6px' }}
            >
              Ask Follow-up
            </Button>
            
            {/* Only show keyboard shortcuts on desktop */}
            {!isMobile && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Press Ctrl + Enter to submit
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AskTab;