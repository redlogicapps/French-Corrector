import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveCorrection as saveCorrectionToFirestore } from './correctionService';
import { getCurrentModelName } from './configService';
import { Correction, CorrectionResult } from '../types';

export interface GeminiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

// Initialize the Google Generative AI with the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Missing VITE_GEMINI_API_KEY in environment variables');
}

// Initialize the Google Generative AI client
export const genAI = new GoogleGenerativeAI(apiKey);

// Cache for available models
let availableModelsCache: GeminiModel[] | null = null;

/**
 * Fetches available models from Google Gemini API
 * @returns Promise with array of available models
 */
export const getAvailableModels = async (): Promise<GeminiModel[]> => {
  if (availableModelsCache) {
    return availableModelsCache;
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.models) {
      throw new Error('No models found in response');
    }
    
    // Filter for Gemini models and transform the response
    const geminiModels = data.models
      .filter((model: any) => model.name.startsWith('models/gemini'))
      .map((model: any) => ({
        name: model.name.replace('models/', ''),
        version: model.version || '',
        displayName: model.displayName || model.name.replace('models/', ''),
        description: model.description || '',
        inputTokenLimit: model.inputTokenLimit || 0,
        outputTokenLimit: model.outputTokenLimit || 0,
        supportedGenerationMethods: model.supportedGenerationMethods || []
      }));
    
    availableModelsCache = geminiModels;
    return geminiModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return default models as fallback
    return [
      { name: 'gemini-1.5-pro-latest', version: '1.5', displayName: 'Gemini 1.5 Pro', description: 'Latest Gemini 1.5 Pro model', inputTokenLimit: 128000, outputTokenLimit: 8192, supportedGenerationMethods: ['generateContent'] },
      { name: 'gemini-1.5-flash', version: '1.5', displayName: 'Gemini 1.5 Flash', description: 'Fast and capable model', inputTokenLimit: 1000000, outputTokenLimit: 8192, supportedGenerationMethods: ['generateContent'] },
      { name: 'gemini-1.0-pro', version: '1.0', displayName: 'Gemini 1.0 Pro', description: 'Gemini 1.0 Pro model', inputTokenLimit: 30720, outputTokenLimit: 2048, supportedGenerationMethods: ['generateContent'] },
    ];
  }
};

// Helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Corrects French text using the Gemini API with retry logic for rate limiting
 * @param text The text to correct
 * @param retries Number of retry attempts (default: 3)
 * @param delayMs Initial delay between retries in milliseconds (default: 1000ms)
 * @returns A promise that resolves to the corrected text and explanation
 */
export const correctFrenchText = async (text: string, userId: string, retries = 3, delayMs = 1000): Promise<CorrectionResult> => {
  for (let i = 0; i < retries; i++) {
    try {
      const modelName = await getCurrentModelName(userId);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // The prompt for the AI
      const prompt = `
        Corrige le texte français suivant. Concentre-toi sur la grammaire, l'orthographe et la syntaxe pour un usage professionnel (e-mails, messages).
        
        Voici le texte à corriger : "${text}"
        
        Respond in this exact JSON format:
        {
          "correctedText": "The fully corrected text goes here",
          "corrections": [
            {
              "original": "original text that was changed",
              "corrected": "corrected version of the text",
              "shortExplanation": "short explanation of why this correction was made",
              "explanation": "detailed explanation of why this correction was made"
            },
            // Include all corrections in this array
          ]
        }
        
        Important:
        - Include spelling, grammar, and punctuation corrections
        - Be specific in your explanations
        - Only respond with the JSON object, nothing else`;

      // Generate the response
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log(responseText);
      try {
        // Clean the response text by removing markdown code block syntax if present
        let cleanResponse = responseText.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse
            .replace(/^```json\n?|```$/g, '') // Remove ```json and ```
            .trim();
        }
        
        // Try to parse the response as JSON
        const responseData = JSON.parse(cleanResponse);
        
        // Validate the response structure
        if (responseData.correctedText === undefined || responseData.correctedText === null) {
          throw new Error('Missing correctedText in response');
        }
        
        return {
          correctedText: responseData.correctedText || text,
          explanation: responseData.explanation || 'No explanation provided.',
          corrections: Array.isArray(responseData.corrections) 
            ? responseData.corrections 
            : []
        };
      } catch (e) {
        console.error('Failed to parse AI response as JSON:', e);
        console.log('Raw response text:', responseText);
        // Fallback to returning the raw response if JSON parsing fails
        return {
          correctedText: responseText,
          explanation: 'The AI provided an invalid response format. ' + (e instanceof Error ? e.message : String(e)),
          corrections: []
        };
      }
    } catch (error: any) {
      if (error.message.includes('429') && i < retries - 1) {
        // If rate limited, wait and retry with exponential backoff
        const waitTime = delayMs * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await delay(waitTime);
        continue;
      }
      console.error('Error correcting text with Gemini API:', error);
      throw new Error('Failed to correct text. Please try again later.');
    }
  }
  throw new Error('Failed after multiple retries. Please try again later.');
};

/**
 * Saves a correction to Firestore
 * @param correction The correction to save
 * @returns A promise that resolves when the correction is saved
 */
export const saveCorrection = async (params: {
  originalText: string;
  correctedText: string;
  corrections: Correction[];
}) => {
  const { originalText, correctedText, corrections } = params;
  return await saveCorrectionToFirestore({
    originalText,
    correctedText,
    corrections,
  });
};
