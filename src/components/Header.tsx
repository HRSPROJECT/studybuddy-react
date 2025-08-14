import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BookIcon from '@mui/icons-material/Book';
import SearchIcon from '@mui/icons-material/Search';
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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile // Ensures scroll buttons are visible on mobile if needed
          sx={{ 
            minHeight: '48px', 
            marginLeft: isMobile ? 0 : '2rem',
            marginRight: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 'auto', // Takes full width on mobile to allow scrolling
            '& .MuiTabs-indicator': {
            },
            '& .MuiTab-root': {
              minHeight: '48px',
              textTransform: 'none',
              // Ensure tabs don't shrink too much, allowing scroll behavior to trigger
              minWidth: isMobile? 'auto' : '90px', // Adjust minWidth as needed for mobile vs desktop
            }
          }}
        >
          <Tab 
            value="ask" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', px: isMobile ? 1 : 2 }}> 
                <QuestionAnswerIcon sx={{ mr: 0.5 }} fontSize={isMobile? "small" : "medium"}/>
                <span>Ask</span>
              </Box>
            } 
          />
          <Tab 
            value="explain" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', px: isMobile ? 1 : 2 }}> 
                <BookIcon sx={{ mr: 0.5 }} fontSize={isMobile? "small" : "medium"}/>
                <span>Explain</span>
              </Box>
            }
          />
          <Tab
            value="deep-research"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', px: isMobile ? 1 : 2 }}>
                <SearchIcon sx={{ mr: 0.5 }} fontSize={isMobile? "small" : "medium"}/>
                <span>Deep Research</span>
              </Box>
            }
          />
        </Tabs>
        
        {/* Authentication Buttons */}
        <Box sx={{ display: 'flex', mt: isMobile ? 1 : 0, ml: isMobile ? 0 : 1 }}> {/* Ensure spacing for auth buttons */}
          {isLoggedIn ? (
            <Button 
              component={RouterLink} 
              to="/profile" 
              color="primary" 
              startIcon={<AccountCircleIcon />}
              sx={{ textTransform: 'none', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
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
                sx={{ mr: 1, textTransform: 'none', fontSize: isMobile ? '0.8rem' : '0.9rem', padding: isMobile ? '4px 8px' : '6px 16px' }}
              >
                Login
              </Button>
              <Button 
                component={RouterLink} 
                to="/register" 
                color="primary" 
                variant="contained"
                sx={{ textTransform: 'none', fontSize: isMobile ? '0.8rem' : '0.9rem', padding: isMobile ? '4px 8px' : '6px 16px' }}
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