import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BookIcon from '@mui/icons-material/Book';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface HeaderProps {
  currentTab: string;
  handleTabChange: (tab: string) => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentTab, handleTabChange, isLoggedIn = false }) => {
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
            marginLeft: isMobile ? 0 : '2rem',
            marginRight: isMobile ? 0 : 'auto',
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
        
        {/* Authentication Buttons */}
        <Box sx={{ display: 'flex', mt: isMobile ? 1 : 0 }}>
          {isLoggedIn ? (
            <Button 
              component={RouterLink} 
              to="/profile" 
              color="primary" 
              startIcon={<AccountCircleIcon />}
              sx={{ ml: 1 }}
            >
              Profile
            </Button>
          ) : (
            <>
              <Button 
                component={RouterLink} 
                to="/login" 
                color="primary" 
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                component={RouterLink} 
                to="/register" 
                color="primary" 
                variant="contained"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;