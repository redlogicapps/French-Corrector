import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, DocumentData } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SaveCorrectionParams, StoredCorrection } from '../types';

const CORRECTIONS_COLLECTION = 'corrections';

/**
 * Saves a correction to Firestore
 * @param correction The correction data to save
 * @returns A promise that resolves to the saved correction with ID and timestamps
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
 * Gets all corrections for the current user
 * @returns A promise that resolves to an array of the user's corrections
 */
export const getUserCorrections = async (): Promise<StoredCorrection[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const q = query(
      collection(db, CORRECTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Omit<StoredCorrection, 'id' | 'createdAt'> & { 
        createdAt: Timestamp;
      };
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    throw error;
  }
};
