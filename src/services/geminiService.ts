import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveCorrection as saveCorrectionToFirestore } from './correctionService';
import { Correction, CorrectionResult } from '../types';

// Initialize the Google Generative AI with the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Missing VITE_GEMINI_API_KEY in environment variables');
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

// The model to use for corrections - using Gemini 2.5 Flash (Preview 05-20)
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

// Helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Corrects French text using the Gemini API with retry logic for rate limiting
 * @param text The text to correct
 * @param retries Number of retry attempts (default: 3)
 * @param delayMs Initial delay between retries in milliseconds (default: 1000ms)
 * @returns A promise that resolves to the corrected text and explanation
 */
export const correctFrenchText = async (text: string, retries = 3, delayMs = 1000): Promise<CorrectionResult> => {
  for (let i = 0; i < retries; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      // The prompt for the AI
      const prompt = `
        You are a professional French language tutor. Your task is to correct the following French text. 
        Provide the corrected text and a detailed list of all corrections made.
        
        Text to correct: "${text}"
        
        Respond in this exact JSON format:
        {
          "correctedText": "The fully corrected text goes here",
          "corrections": [
            {
              "original": "original text that was changed",
              "corrected": "corrected version of the text",
              "explanation": "detailed explanation of why this correction was made"
            },
            // Include all corrections in this array
          ]
        }
        
        Important:
        - List EVERY correction made, no matter how small
        - Include spelling, grammar, and punctuation corrections
        - Be specific in your explanations
        - Only respond with the JSON object, nothing else`;

      // Generate the response
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
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
        if (!responseData.correctedText) {
          throw new Error('Missing correctedText in response');
        }
        
        return {
          correctedText: responseData.correctedText,
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
