import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  open, 
  message, 
  severity, 
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(open);
  
  useEffect(() => {
    setIsOpen(open);
  }, [open]);
  
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;