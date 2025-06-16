import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getModelConfig, updateModelConfig, clearModelCache } from '../services/configService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Button, Card, CardContent, CircularProgress, Container, TextField, Typography, Alert, Snackbar } from '@mui/material';

const Admin: React.FC = () => {
  const { currentUser } = useAuth();
  const [modelName, setModelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Available Gemini models
  const availableModels = [
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash',
    'gemini-2.5-flash-preview-05-20',
    'gemini-1.0-pro',
  ];

  useEffect(() => {
    if (!currentUser) return;

    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const config = await getModelConfig(currentUser.uid);
        setModelName(config.modelName);
      } catch (err) {
        console.error('Error loading model config:', err);
        setError('Failed to load model configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();

    // Set up real-time listener for config changes
    const configRef = doc(db, 'app_config', 'gemini_model');
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setModelName(data.modelName);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser || !modelName.trim()) return;

    try {
      setIsSaving(true);
      setError('');
      
      await updateModelConfig(modelName.trim(), currentUser.uid);
      clearModelCache(); // Clear the in-memory cache
      
      setSuccess('Model configuration updated successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error updating model config:', err);
      setError('Failed to update model configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel - Model Configuration
      </Typography>
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gemini Model Settings
          </Typography>
          
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Model: <strong>{modelName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Last updated by: {currentUser?.email || 'system'}
            </Typography>
          </Box>
          
          <Box mb={3}>
            <TextField
              select
              fullWidth
              label="Select Model"
              value={modelName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelName(e.target.value)}
              SelectProps={{ native: true }}
              variant="outlined"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              Select the Gemini model to use for text correction
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Admin;
