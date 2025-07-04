import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface GeminiRequest {
  prompt?: string;
  options?: Record<string, any>;
  listModels?: boolean;
  userId?: string; // Add userId to the request
}

// Handle regular HTTP requests
export const geminiProxy = functions.region('us-central1').https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // For callable functions, data is in req.body.data
    // For direct HTTP requests, it's in req.body
    const data: GeminiRequest = 'data' in req.body ? req.body.data : req.body;
    const apiKey = functions.config().gemini?.key;
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // If client asks for model list, proxy that request
    if (data.listModels) {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!modelsRes.ok) {
        throw new Error(`Failed to list models: ${modelsRes.status}`);
      }
      const modelsData = await modelsRes.json();
      
      // Transform the response to match our expected format
      const transformedModels = {
        models: modelsData.models?.map((model: any) => ({
          name: model.name,
          version: model.version || '1.0',
          displayName: model.displayName || model.name,
          description: model.description || `Model: ${model.name}`,
          inputTokenLimit: model.inputTokenLimit || 8192,
          outputTokenLimit: model.outputTokenLimit || 2048,
          supportedGenerationMethods: model.supportedGenerationMethods || ['generateContent']
        })) || []
      };
      
      // Wrap the response in a data property to match the expected format
      res.status(200).json({ data: transformedModels });
      return;
    }

    // Otherwise expect { prompt } in the request
    if (!data?.prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const body = {
      contents: [{
        parts: [{
          text: data.prompt
        }]
      }],
      ...(data.options || {})
    };

    // Get the model configuration for the user
    const userId = data.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get the model configuration from Firestore
    const configDoc = await admin.firestore()
      .collection('app_config')
      .doc('gemini_model')
      .get();
      
    let modelName = 'gemini-2.5-flash'; // Default model if not configured
    
    if (configDoc.exists) {
      const config = configDoc.data();
      if (config?.modelName) {
        modelName = config.modelName;
      }
    }
    
    console.log(`Using model: ${modelName} for user: ${userId}`);
    
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorText);
      res.status(geminiRes.status).json({
        error: 'Gemini API request failed',
        status: geminiRes.status,
        details: errorText
      });
      return;
    }

    const result = await geminiRes.json();
    // Wrap the result in a data field to match Firebase Callable Functions format
    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error in geminiProxy:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});
