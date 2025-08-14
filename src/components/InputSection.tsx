import React, { useRef } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { isMobileDevice } from '../utils/helpers';

interface InputSectionProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (file: File) => void;
  onClearImage: () => void;
  imagePreview: string | null;
  isLoading: boolean;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  showKeyboardShortcutHint?: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  value,
  onChange,
  onImageUpload,
  onClearImage,
  imagePreview,
  isLoading,
  onKeyDown,
  placeholder = "Ask a question or describe an image...",
  showKeyboardShortcutHint = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice(); 
  const theme = useTheme(); // Get the theme object

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : 2 }}>
      <TextField
        fullWidth
        multiline
        minRows={isMobile ? 2 : 3} 
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={isLoading}
        sx={{
          // borderRadius: '8px', // This is likely redundant
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px', // Apply border radius to the root of the outlined input
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 1.5 : 1 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1.5 : 1, flexGrow: 1 }}>
          <Button
            variant="outlined"
            onClick={handleUploadButtonClick}
            disabled={isLoading}
            fullWidth={isMobile} 
            sx={{ py: isMobile ? 1 : 0.8, fontSize: isMobile ? '0.8rem' : '0.875rem', borderRadius: '6px' }}
          >
            Upload Image
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {imagePreview && (
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={onClearImage} 
              disabled={isLoading}
              fullWidth={isMobile} 
              sx={{ py: isMobile ? 1 : 0.8, fontSize: isMobile ? '0.8rem' : '0.875rem', borderRadius: '6px' }}
            >
              Clear Image
            </Button>
          )}
        </Box>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', pl: isMobile ? 0 : 1, pt: isMobile && !imagePreview ? 1 : 0 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {imagePreview && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: isMobile? '150px' :'200px', 
              border: `1px solid ${theme.palette.divider}`, // Use theme's divider color
              borderRadius: '4px' 
            }} 
          />
        </Box>
      )}

      {showKeyboardShortcutHint && !isMobile && ( 
        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right', mt: 0.5 }}>
          Ctrl+Enter to submit
        </Typography>
      )}
    </Box>
  );
};

export default InputSection;
