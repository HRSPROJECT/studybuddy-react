import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

export interface ResearchStep {
  id: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'thinking' | 'complete' | 'error';
}

interface ResearchProcessDisplayProps {
  steps: ResearchStep[];
  isLoading: boolean;
}

const ResearchProcessDisplay: React.FC<ResearchProcessDisplayProps> = ({ steps, isLoading }) => {
  if (isLoading && steps.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Starting deep research...</Typography>
      </Box>
    );
  }

  if (steps.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', color: 'text.secondary', my: 3, py: 3 }}>
        <Typography variant="h6" component="p">
          Your research results will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {steps.map((step, index) => (
        <Paper key={step.id} elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Step {index + 1}: {step.question}
          </Typography>
          {step.status === 'thinking' && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: 1 }} variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          )}
          {step.status === 'complete' && step.answer && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {step.answer}
            </Typography>
          )}
          {step.status === 'error' && (
            <Typography variant="body1" color="error">
              An error occurred while processing this step.
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ResearchProcessDisplay;
