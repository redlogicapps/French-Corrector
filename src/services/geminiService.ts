import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { saveCorrection as saveCorrectionToFirestore } from './correctionService';
import { Correction, CorrectionResult } from '../types';
import { functions } from '../firebase';

// Define types for the Gemini API response
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  [key: string]: any;
}

export interface GeminiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

// Initialize Firebase callable function for Gemini proxy
const geminiProxy = httpsCallable(functions, 'geminiProxy');

// Helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: call Gemini via Cloud Function and extract plain text response
const generateContentViaProxy = async (prompt: string, userId?: string): Promise<string> => {
  try {
    const requestData: any = { 
      prompt: prompt,
      options: {} // Add empty options object to match expected structure
    };
    
    // Add userId to the request if provided
    if (userId) {
      requestData.userId = userId;
    }
    
    const result = await geminiProxy(requestData) as HttpsCallableResult<GeminiResponse | string>;
    
    // Check if the response is in the expected format
    if (typeof result.data === 'string') {
      return result.data;
    }
    
    // Handle the case where the response is an object with candidates
    const geminiResponse = result.data as GeminiResponse;
    if (geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      return geminiResponse.candidates[0].content.parts[0].text!;
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected response format from geminiProxy:', result.data);
    throw new Error("Unexpected response format from Gemini proxy");
  } catch (error: any) {
    console.error('Error in generateContentViaProxy:', error);
    throw new Error(error?.message || 'Failed to generate content');
  }
};

/**
 * Analyzes a list of corrections and returns personalized study advice as a French teacher would.
 * @param corrections Array of correction objects (with mistake and correction/explanation fields).

 * @returns Promise<string> - AI-generated study advice.
 */
export interface StudyAdvice {
  summary: string;
  corrections: {
    category: string;
    title: string;
    content: string;
    examples: Array<{
      original: string;
      corrected: string;
      explanation: string;
    }>;
  }[];
}

export const getStudyAdviceFromCorrections = async (corrections: Correction[]): Promise<StudyAdvice> => {
  if (!corrections || corrections.length === 0) {
    return {
      summary: 'Aucune correction à analyser.',
      corrections: []
    };
  }

  // Prepare a summary of mistakes for the AI
  const correctionSummaries = corrections.map((corr, idx) => {
    return `Erreur ${idx + 1}:\nTexte original: ${corr.original}\nCorrection: ${corr.corrected}\nExplication: ${corr.explanation || corr.shortExplanation || ''}`;
  }).join('\n\n');

  const prompt = `Tu es un professeur de français expérimenté. Voici une liste d'erreurs faites par un étudiant dans ses écrits, avec les corrections et explications. 

Analyse ces erreurs et fournis une réponse structurée au format JSON avec les champs suivants :
1. 'summary' : Un résumé concis de l'analyse (2-3 phrases maximum)
2. 'corrections' : Un tableau d'objets contenant :
   - 'category' : La catégorie de l'erreur (Grammaire, Orthographe, Conjugaison, Vocabulaire, etc.)
   - 'title' : Un titre court pour ce type d'erreur
   - 'content' : Une explication claire et détaillée de la règle
   - 'examples' : Un tableau d'objets contenant les exemples d'erreurs avec 'original', 'correction' et 'explication'

Sois précis, bienveillant, et donne des axes de travail concrets. Voici les erreurs à analyser :

${correctionSummaries}`;

  try {
    // Use the default model
    const responseText = await generateContentViaProxy(prompt);
    
    // Try to extract JSON from the response
    try {
      // Look for JSON in code blocks or as raw JSON
      const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*})/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      
      // Parse the JSON and ensure it matches our interface
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate the response structure
      if (!parsedResponse.summary || !Array.isArray(parsedResponse.corrections)) {
        throw new Error('Invalid response structure from AI');
      }
      
      return parsedResponse as StudyAdvice;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to a simple text response if JSON parsing fails
      return {
        summary: 'Analyse des erreurs terminée.',
        corrections: [{
          category: 'Général',
          title: 'Conseils généraux',
          content: responseText,
          examples: []
        }]
      };
    }
  } catch (error) {
    console.error('Error getting study advice:', error);
    return {
      summary: 'Une erreur est survenue lors de l\'analyse.',
      corrections: [{
        category: 'Erreur',
        title: 'Erreur technique',
        content: 'Impossible de générer des conseils d\'étude pour le moment. Veuillez réessayer plus tard.',
        examples: []
      }]
    };
  }
};

/**
 * Fetches available models from Google Gemini API
 * @param userId Optional user ID to include in the request
 * @returns Promise with array of available models
 */
export const getAvailableModels = async (userId?: string): Promise<GeminiModel[]> => {
  const requestData: any = { listModels: true };
  if (userId) {
    requestData.userId = userId;
  }
  
  const result = await geminiProxy(requestData) as HttpsCallableResult<{ models?: Array<{
    name: string;
    version: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
  }> }>;

  // If we got models in the response, map them to our interface
  if (result.data?.models) {
    return result.data.models.map(model => ({
      name: model.name,
      version: model.version || '1.0',
      displayName: model.displayName || model.name,
      description: model.description || `Model: ${model.name}`,
      inputTokenLimit: model.inputTokenLimit || 8192,
      outputTokenLimit: model.outputTokenLimit || 2048,
      supportedGenerationMethods: model.supportedGenerationMethods || ['generateContent']
    }));
  }
  
  // Default models in case the API call fails
  return [
    {
      name: 'gemini-2.5-flash',
      version: '1.0',
      displayName: 'Gemini 2.5 Flash',
      description: 'Fast and capable model for text generation',
      inputTokenLimit: 1000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    },
    {
      name: 'gemini-2.5-pro',
      version: '1.0',
      displayName: 'Gemini 2.5 Pro',
      description: 'Most capable model for complex tasks',
      inputTokenLimit: 2000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    }
  ];
};

/**
 * Corrects French text using the Gemini API with retry logic for rate limiting
 * @param text The text to correct
 * @param retries Number of retry attempts (default: 3)
 * @param delayMs Initial delay between retries in milliseconds (default: 1000ms)
 * @returns A promise that resolves to the corrected text and explanation
 */
/**
 * Corrects French text using the Gemini API with retry logic for rate limiting
 * @param text The text to correct
 * @param retries Number of retry attempts (default: 3)
 * @param delayMs Initial delay between retries in milliseconds (default: 1000ms)
 * @returns A promise that resolves to the corrected text and explanation
 */
export const correctFrenchText = async (text: string, retries = 3, delayMs = 1000, userId?: string): Promise<CorrectionResult> => {
  for (let i = 0; i < retries; i++) {
    try {
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
              "explanation": "detailed explanation of why this correction was made",
              "type": "One of: Punctuation, Conjugation, Spelling, Comprehension, Grammar, or Other"
            },
            // Include all corrections in this array
          ]
        }
        
        Important:
        - Include spelling, grammar, and punctuation corrections
        - Be specific in your explanations
        - Only respond with the JSON object, nothing else`;

      // Generate the response with the user's ID
      const responseText = await generateContentViaProxy(prompt, userId);
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
            ? responseData.corrections.map((correction: any) => ({
                ...correction,
                type: (correction.type || 'Other') as Correction['type']
              }))
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
      if (typeof error.message === 'string' && error.message.includes('429') && i < retries - 1) {
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
