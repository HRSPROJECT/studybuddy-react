import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, AlertColor } from '@mui/material';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import AskTab from './components/AskTab';
import ExplainTab from './components/ExplainTab';
import Notification from './components/Notification';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Indigo
      light: '#6366f1',
      dark: '#4338ca',
    },
    secondary: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#f3f4f6', // Light gray
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none', // No uppercase for buttons
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  // State for active tab
  const [currentTab, setCurrentTab] = useState<string>('ask');
  
  // State for notification
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };
  
  // Show notification
  const showNotification = (message: string, severity: AlertColor) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header currentTab={currentTab} handleTabChange={handleTabChange} />
        
        <Container maxWidth="lg" component="main" sx={{ flexGrow: 1 }}>
          {currentTab === 'ask' && <AskTab showNotification={showNotification} />}
          {currentTab === 'explain' && <ExplainTab showNotification={showNotification} />}
        </Container>
        
        <Footer />
        
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={handleCloseNotification}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
