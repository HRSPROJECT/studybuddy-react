import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, useMediaQuery, useTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BookIcon from '@mui/icons-material/Book';

interface HeaderProps {
  currentTab: string;
  handleTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentTab, handleTabChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', py: isMobile ? 1 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
          <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.8rem' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            StudyBuddy
          </Typography>
        </Box>
        
        <Tabs 
          value={currentTab}
          onChange={(_, value) => handleTabChange(value)}
          sx={{ 
            minHeight: '48px', 
            marginLeft: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 'auto',
            '& .MuiTab-root': {
              minHeight: '48px',
              textTransform: 'none',
            }
          }}
        >
          <Tab 
            value="ask" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QuestionAnswerIcon sx={{ mr: 1 }} />
                <span>Ask</span>
              </Box>
            } 
          />
          <Tab 
            value="explain" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BookIcon sx={{ mr: 1 }} />
                <span>Explain</span>
              </Box>
            }
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default Header;