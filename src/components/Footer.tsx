import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const Footer: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: { xs: 2, sm: 3 }, // Responsive vertical padding
        mt: { xs: 3, sm: 4 }, // Responsive top margin
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper'
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Stacks on extra-small, row on small and up
            justifyContent: 'space-between',
            alignItems: 'center', // Center items when stacked or in a row for better balance
            textAlign: { xs: 'center', sm: 'left' }, // Text aligns left on sm and up for the first child
            gap: { xs: 1.5, sm: 2 } // Responsive gap
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SchoolIcon fontSize="small" /> StudyBuddy - Powered by AI &copy; {new Date().getFullYear()}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: {xs: '90%', sm: 600}, textAlign: {xs: 'center', sm: 'right'} }}>
            By using our services you agree to our terms and conditions. AI-generated content may contain inaccuracies. Results are not a substitute for professional advice.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;