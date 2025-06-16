import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getModelConfig, updateModelConfig, clearModelCache } from '../services/configService';
import { getAvailableModels, GeminiModel } from '../services/geminiService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Button, Card, CardContent, CircularProgress, Container, MenuItem, Select, FormControl, InputLabel, Typography, Alert, Snackbar, Paper } from '@mui/material';

const Admin: React.FC = () => {
  const { currentUser } = useAuth();
  const [modelName, setModelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const models = await getAvailableModels();
        setAvailableModels(models);
        setModelsError('');
      } catch (err) {
        console.error('Error loading models:', err);
        setModelsError('Failed to load available models. Using default models.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

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
            {isLoadingModels ? (
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CircularProgress size={20} />
                <Typography>Loading available models...</Typography>
              </Box>
            ) : modelsError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {modelsError}
              </Alert>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="model-select-label">Select Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={modelName}
                  label="Select Model"
                  onChange={(e) => setModelName(e.target.value as string)}
                  disabled={isSaving}
                  renderValue={(selected) => {
                    const model = availableModels.find(m => m.name === selected);
                    return model ? model.displayName : selected;
                  }}
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model.name} value={model.name}>
                      <Box>
                        <Typography>{model.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Model: <strong>{modelName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Last updated by: {currentUser?.email || 'system'}
            </Typography>
            
            {!isLoadingModels && !modelsError && availableModels.length > 0 && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Model Details:</Typography>
                {availableModels
                  .filter(m => m.name === modelName)
                  .map(model => (
                    <Box key={model.name}>
                      <Typography variant="body2">
                        <strong>Version:</strong> {model.version}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Input Tokens:</strong> {model.inputTokenLimit.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Output Tokens:</strong> {model.outputTokenLimit.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
              </Paper>
            )}
          </Box>
          
          <Box mb={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving || isLoadingModels}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
              sx={{ mt: 2 }}
            >
              {isSaving ? 'Saving...' : 'Save Model Configuration'}
            </Button>
          </Box>
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
