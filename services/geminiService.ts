import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { ApiKeyContainer, CorrectionResult } from "../types";


// The API key MUST be obtained EXCLUSIVELY from the environment variable process.env.API_KEY.
// It is a hard requirement that this variable is pre-configured and accessible.
// The application MUST NOT prompt the user for it or offer ways to input/manage it.
const apiKeyContainer: ApiKeyContainer = { apiKey: process.env.API_KEY };

if (!apiKeyContainer.apiKey) {
  console.warn(
    "API_KEY environment variable is not set. " +
    "The application will not be able to connect to the Gemini API. " +
    "Please ensure API_KEY is configured in your environment."
  );
}

const ai = new GoogleGenAI({ apiKey: apiKeyContainer.apiKey! }); 

export const correctFrenchText = async (text: string): Promise<CorrectionResult> => {
  if (!apiKeyContainer.apiKey) {
    throw new Error("La clé API Gemini n'est pas configurée. Veuillez contacter l'administrateur.");
  }

  if (!text.trim()) {
    return { correctedText: "", explanation: "" };
  }

  const prompt = `Corrige le texte français suivant. Concentre-toi sur la grammaire, l'orthographe et la syntaxe pour un usage professionnel (e-mails, messages).
Fournis une réponse JSON avec deux clés : "correctedText" (string) pour le texte corrigé, et "explanation" (string) pour un bref résumé des principales modifications apportées (par exemple, en utilisant des puces).
Ne fournis que l'objet JSON, sans aucune phrase d'introduction ou de conclusion en dehors du JSON.

Voici le texte à corriger :
"${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    // Get the text content from the response
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr) as CorrectionResult;
      if (typeof parsedData.correctedText === 'string' && typeof parsedData.explanation === 'string') {
        return {
          correctedText: parsedData.correctedText.trim(),
          explanation: parsedData.explanation.trim(),
        };
      } else {
        console.error("Parsed JSON does not match expected format:", parsedData);
        throw new Error("La réponse de l'IA n'a pas le format JSON attendu (correctedText ou explanation manquant).");
      }
    } catch (e) {
      console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
      // Fallback if JSON parsing fails but we have some text
      if (response.text && typeof response.text === 'string' && response.text.length > 0 && !response.text.includes('{') && !response.text.includes('}')) {
        return { correctedText: response.text.trim(), explanation: "L'explication n'a pas pu être extraite en raison d'un problème de formatage de la réponse de l'IA."};
      }
      throw new Error("La réponse de l'IA n'est pas un JSON valide.");
    }

  } catch (error) {
    console.error("Error correcting text via Gemini API:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
         throw new Error("La clé API Gemini est invalide. Veuillez vérifier la configuration.");
      }
      throw new Error(`Erreur lors de la correction du texte: ${error.message}`);
    }
    throw new Error("Une erreur inconnue est survenue lors de la communication avec l'IA.");
  }
};