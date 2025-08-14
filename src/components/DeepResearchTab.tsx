import React, { useState, KeyboardEvent } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InputSection from './InputSection';
import apiService from '../services/apiService';
import ResearchProcessDisplay, { ResearchStep } from './ResearchProcessDisplay';
import { isMobileDevice } from '../utils/helpers';

interface DeepResearchTabProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const DeepResearchTab: React.FC<DeepResearchTabProps> = ({ showNotification }) => {
  const [problem, setProblem] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const isMobile = isMobileDevice();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (problem.trim() && !isLoading) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (!problem.trim()) {
      showNotification('Please enter a problem to research.', 'warning');
      return;
    }
    setIsLoading(true);
    setResearchSteps([]);

    const handleStepUpdate = (step: ResearchStep) => {
      setResearchSteps((prevSteps) => {
        const existingStepIndex = prevSteps.findIndex((s) => s.id === step.id);
        if (existingStepIndex !== -1) {
          // Update existing step
          const newSteps = [...prevSteps];
          newSteps[existingStepIndex] = step;
          return newSteps;
        } else {
          // Add new step
          return [...prevSteps, step];
        }
      });
    };

    try {
      await apiService.performDeepResearch(problem, handleStepUpdate);
    } catch (error: any) {
      console.error('Deep research error:', error);
      showNotification(error.message || 'An error occurred during the research process.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: 'calc(100vh - 100px)' }, maxHeight: 'calc(100vh - 100px)' }}>
      <Paper elevation={2} sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Deep Research
        </Typography>
        <InputSection
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          onImageUpload={() => showNotification('Image upload is not supported for Deep Research yet.', 'info')}
          onClearImage={() => {}}
          imagePreview={null}
          isLoading={isLoading}
          onKeyDown={handleKeyDown}
          placeholder="Enter a complex problem or question..."
          showKeyboardShortcutHint={!isMobile}
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSubmit}
          disabled={isLoading || !problem.trim()}
          sx={{ mt: 2, py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.875rem', md: '1rem' }, borderRadius: '8px' }}
        >
          Start Research
        </Button>
      </Paper>
      <Paper elevation={1} sx={{ p: { xs: 1.5, md: 2 }, flexGrow: 1, overflowY: 'auto', borderRadius: 2, minHeight: { xs: 300, md: 'auto'} }}>
        <ResearchProcessDisplay steps={researchSteps} isLoading={isLoading} />
      </Paper>
    </Box>
  );
};

export default DeepResearchTab;
