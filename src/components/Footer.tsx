import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const Footer: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 2, 
        mt: 4, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper'
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' },
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SchoolIcon fontSize="small" /> StudyBuddy - Powered by AI &copy; 2024
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
            By using our services you agree to our terms and conditions. AI-generated content may contain inaccuracies.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;