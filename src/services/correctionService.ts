import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SaveCorrectionParams, StoredCorrection, CorrectionResult } from '../types';
import { correctFrenchText } from './geminiService';

const CORRECTIONS_COLLECTION = 'corrections';

/**
 * Corrects the given text using the Gemini service.
 * @param text The text to correct.
 * @returns A promise that resolves to the corrected text and explanation.
 */
export const correctText = async (text: string): Promise<CorrectionResult> => {
  try {
    // Directly call the Gemini service function
    const result = await correctFrenchText(text);
    return result;
  } catch (error) {
    console.error('Error correcting text via Gemini service:', error);
    // Re-throw a more specific error to be handled by the UI
    throw new Error('Failed to get correction from the AI service.');
  }
};

/**
 * Saves a correction to Firestore.
 * @param correction The correction data to save.
 * @returns A promise that resolves to the saved correction with ID and timestamps.
 */
export const saveCorrection = async (
  correction: SaveCorrectionParams
): Promise<StoredCorrection> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const docRef = await addDoc(collection(db, CORRECTIONS_COLLECTION), {
      ...correction,
      userId,
      createdAt: Timestamp.now(),
    });

    return {
      ...correction,
      id: docRef.id,
      userId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error saving correction:', error);
    throw error;
  }
};

/**
 * Gets all corrections for the current user.
 * @returns A promise that resolves to an array of the user's corrections.
 */
/**
 * Deletes a correction from Firestore.
 * @param correctionId The ID of the correction to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteCorrection = async (correctionId: string): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Delete the document with the given ID
    await deleteDoc(doc(db, CORRECTIONS_COLLECTION, correctionId));
  } catch (error) {
    console.error('Error deleting correction:', error);
    throw error;
  }
};

/**
 * Gets all corrections for the current user.
 * @returns A promise that resolves to an array of the user's corrections.
 */
export const getUserCorrections = async (): Promise<StoredCorrection[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      // Return an empty array or throw an error, depending on desired behavior
      // for unauthenticated users.
      return [];
    }

    const q = query(
      collection(db, CORRECTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const corrections: StoredCorrection[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      corrections.push({
        id: doc.id,
        userId: data.userId,
        originalText: data.originalText,
        correctedText: data.correctedText,
        corrections: data.corrections,
        createdAt: (data.createdAt as Timestamp).toDate(),
      });
    });

    return corrections;
  } catch (error) {
    console.error('Error getting user corrections:', error);
    throw error;
  }
};
