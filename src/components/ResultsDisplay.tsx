import React from 'react';
import { Box, Typography, CircularProgress, Button, IconButton, Paper, Link, Avatar, Fade, useTheme } from '@mui/material';
import { 
  FileCopy as FileCopyIcon, 
  PictureAsPdf as PictureAsPdfIcon, 
  ThumbUpAlt as ThumbUpAltIcon, 
  ThumbDownAlt as ThumbDownAltIcon, 
  Person as PersonIcon, 
  AutoAwesome as AutoAwesomeIcon, 
  InfoOutlined as InfoOutlinedIcon,
  ChatBubbleOutlineOutlined as ChatBubbleOutlineOutlinedIcon, // For empty state
} from '@mui/icons-material';
import { SearchResult, Message } from '../types/chatTypes';
import { processOutputText } from '../utils/helpers';

interface ResultsDisplayProps {
  isLoading: boolean;
  loadingMessage?: string;
  optimizedQuery?: string;
  originalQuery?: string;
  content?: React.ReactNode; 
  messages?: Message[]; 
  sources?: SearchResult[];
  onCopy: (textToCopy: string) => void; 
  onDownloadPdf: () => void;
  showPdfDownloadButton?: boolean;
  isMobile: boolean;
  showFeedbackButtons?: boolean;
  onMessageFeedback?: (messageId: string, feedback: 'good' | 'bad') => void; 
  scrollTargetRef?: React.RefObject<HTMLDivElement>; // New prop for scroll target
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  isLoading,
  loadingMessage = "Loading...",
  optimizedQuery,
  originalQuery,
  content,
  messages,
  sources,
  onCopy,
  onDownloadPdf,
  showPdfDownloadButton = true,
  isMobile,
  showFeedbackButtons = true,
  onMessageFeedback,
  scrollTargetRef, // Destructure new prop
}) => {
  const theme = useTheme();
  const hasMessages = messages && messages.length > 0;
  const hasExplanationContent = !!content; 
  const hasAnyDisplayableContent = hasMessages || hasExplanationContent || (sources && sources.length > 0);
  
  const textForCopy = messages?.filter(m => m.type === 'ai').map(m => m.text).join('\n\n') || (typeof content === 'string' ? content : '');

  return (
    <Box sx={{ mt: 2, minHeight: '150px' /* Ensure some height for empty/loading states */ }}>
      {isLoading && !hasAnyDisplayableContent && ( 
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, height: '100%' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>{loadingMessage}</Typography>
        </Box>
      )}

      {!isLoading && optimizedQuery && originalQuery && (
        <Fade in={true} timeout={300}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, mb: 2, backgroundColor: 'info.light', borderRadius: '8px' }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Showing results for your optimized query: <strong>{optimizedQuery}</strong>
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Original query: {originalQuery}
            </Typography>
          </Paper>
        </Fade>
      )}
      
      <Fade in={!isLoading && hasAnyDisplayableContent} timeout={500}>
        <Box> 
          {!hasAnyDisplayableContent && !isLoading && (
             <Box sx={{ textAlign: 'center', color: 'text.secondary', my: 3, py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              <Typography variant="h6" component="p" sx={{ color: 'grey.600' }}>
                Your results will appear here.
              </Typography>
              <Typography variant="body2">
                Ask a question or request an explanation to get started.
              </Typography>
            </Box>
          )}

          {hasMessages && (
            <Box sx={{ mb: 2 }}>
              {messages!.map((msg) => (
                <Paper
                  key={msg.id}
                  elevation={msg.type === 'ai' ? 3 : 1} 
                  sx={{
                    p: isMobile ? 1.5 : 2, 
                    mb: 2,
                    backgroundColor: msg.type === 'user' 
                      ? theme.palette.grey[100] 
                      : (msg.type === 'system' ? theme.palette.warning.light : theme.palette.background.paper),
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    borderRadius: '8px',
                    borderLeft: msg.type === 'ai' 
                        ? `5px solid ${theme.palette.secondary.main}` 
                        : (msg.type === 'user' ? `5px solid ${theme.palette.primary.main}` : (msg.type === 'system' ? `5px solid ${theme.palette.warning.main}` : 'none')),
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: msg.type === 'user' 
                        ? 'primary.main' 
                        : (msg.type === 'ai' ? 'secondary.main' : 'warning.main'), 
                      width: 32, height: 32, mt: 0.5 
                    }}
                  >
                    {msg.type === 'user' ? <PersonIcon fontSize="small" /> : (msg.type === 'ai' ? <AutoAwesomeIcon fontSize="small" /> : <InfoOutlinedIcon fontSize="small" /> )}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {processOutputText(msg.text)}
                    </Typography>
                    {(msg.imagePreview || msg.imageUrl) && (
                      <Box sx={{ mt: 1.5, textAlign: msg.type === 'user' ? 'left' : 'left' }}>
                        <img
                          src={msg.imagePreview || msg.imageUrl}
                          alt={msg.type === 'user' ? "Uploaded preview" : "AI response image"}
                          style={{ maxWidth: '100%', maxHeight: '200px', border: `1px solid ${theme.palette.divider}`, borderRadius: '4px' }}
                        />
                      </Box>
                    )}
                    {msg.type === 'ai' && msg.showFeedback && showFeedbackButtons && onMessageFeedback && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => onMessageFeedback(msg.id, 'good')} 
                          aria-label="Good response"
                          sx={{ p: isMobile ? 0.8 : 0.5 }} 
                        >
                          <ThumbUpAltIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => onMessageFeedback(msg.id, 'bad')} 
                          aria-label="Bad response"
                          sx={{ p: isMobile ? 0.8 : 0.5 }} 
                        >
                          <ThumbDownAltIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {hasExplanationContent && (!messages || messages.length === 0) && ( 
             <Paper 
                elevation={3} 
                sx={{ 
                    p: isMobile? 1.5 : 2, 
                    mb: 2, 
                    backgroundColor: theme.palette.background.paper, 
                    borderRadius: '8px',
                    borderLeft: `5px solid ${theme.palette.secondary.main}` 
                }}
            >
              {typeof content === 'string' ? processOutputText(content) : content}
            </Paper>
          )}

          {sources && sources.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile? '1.1rem' : '1.25rem'}}>References:</Typography>
              <Box component="ul" sx={{ pl: 2, listStyleType: 'decimal' }}>
                {sources.map((source, index) => (
                  <Typography component="li" variant="body2" key={index} sx={{ mb: 1.5 }}>
                    <Link href={source.url} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', fontWeight: 'medium' }}>
                      {source.title}
                    </Link>
                    {source.snippet && (
                      <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {source.snippet}
                      </Typography>
                    )}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 3, pt:2, borderTop: `1px solid ${theme.palette.divider}`, flexWrap: 'wrap', gap: 1 }}>
            <Button
              startIcon={<FileCopyIcon />}
              onClick={() => onCopy(textForCopy)}
              disabled={!textForCopy}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{ px: isMobile ? 1.5 : 2, py: isMobile? 0.5 : 1, fontSize: isMobile ? '0.75rem' : '0.875rem', borderRadius: '6px' }}
            >
              Copy
            </Button>
            {showPdfDownloadButton && !isMobile && textForCopy && (
              <Button
                startIcon={<PictureAsPdfIcon />}
                onClick={onDownloadPdf}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{ px: isMobile ? 1.5 : 2, py: isMobile? 0.5 : 1, fontSize: isMobile ? '0.75rem' : '0.875rem', borderRadius: '6px' }}
              >
                PDF
              </Button>
            )}
            {hasExplanationContent && !hasMessages && showFeedbackButtons && (
               <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}> 
                  <IconButton 
                    size="small" 
                    onClick={() => console.log("General feedback: Good")} 
                    aria-label="Good explanation"
                    sx={{ p: isMobile ? 0.8 : 0.5, borderRadius: '6px' }}
                  >
                    <ThumbUpAltIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => console.log("General feedback: Bad")} 
                    aria-label="Bad explanation"
                    sx={{ p: isMobile ? 0.8 : 0.5, borderRadius: '6px' }}
                  >
                    <ThumbDownAltIcon fontSize="small" />
                  </IconButton>
                </Box>
            )}
          </Box>
          {/* Scroll target for AskTab's messages */}
          {scrollTargetRef && <div ref={scrollTargetRef} />}
        </Box>
      </Fade>
    </Box>
  );
};

export default ResultsDisplay;
