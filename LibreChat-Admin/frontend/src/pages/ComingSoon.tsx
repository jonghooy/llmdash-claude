import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button
} from '@mui/material';
import { Construction } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 6,
          mt: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Construction sx={{ fontSize: 80, mb: 3, opacity: 0.9 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
          {description || 'This feature is coming soon!'}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ComingSoon;