import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CONFIG_COLLECTION = 'app_config';
const MODEL_CONFIG_DOC = 'gemini_model';

export interface ModelConfig {
  modelName: string;
  updatedAt: any; // Firestore timestamp
  updatedBy: string;
}

// Default model configuration
const DEFAULT_MODEL: ModelConfig = {
  modelName: 'gemini-2.5-flash-preview-05-20',
  updatedAt: new Date(),
  updatedBy: 'system',
};

/**
 * Get the current Gemini model configuration
 * @param userId The ID of the current user (for logging)
 * @returns Promise with the current model configuration
 */
export const getModelConfig = async (userId: string): Promise<ModelConfig> => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, MODEL_CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ModelConfig;
    }
    
    // If no config exists, create the default one
    const defaultConfig = { ...DEFAULT_MODEL, updatedBy: userId };
    await setDoc(docRef, defaultConfig);
    return defaultConfig;
    
  } catch (error) {
    console.error('Error getting model config:', error);
    // Return default config in case of error
    return { ...DEFAULT_MODEL, updatedBy: 'system' };
  }
};

/**
 * Update the Gemini model configuration
 * @param modelName The new model name
 * @param userId The ID of the user making the change
 * @returns Promise that resolves when the update is complete
 */
export const updateModelConfig = async (modelName: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, MODEL_CONFIG_DOC);
    await setDoc(docRef, {
      modelName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  } catch (error) {
    console.error('Error updating model config:', error);
    throw error;
  }
};

// Create a simple in-memory cache for the model name
let cachedModelName: string | null = null;

/**
 * Get the current model name (cached version for performance)
 * @param userId The ID of the current user
 * @returns Promise with the current model name
 */
export const getCurrentModelName = async (userId: string): Promise<string> => {
  if (cachedModelName) {
    return cachedModelName;
  }
  
  const config = await getModelConfig(userId);
  cachedModelName = config.modelName;
  return cachedModelName;
};

/**
 * Clear the cached model name (call this after updating the model)
 */
export const clearModelCache = (): void => {
  cachedModelName = null;
};
