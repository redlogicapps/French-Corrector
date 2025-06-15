// Represents a single correction made by the AI
export interface Correction {
  original: string;
  corrected: string;
  shortExplanation: string;
  explanation: string;
}

// The result from the Gemini API
export interface CorrectionResult {
  correctedText: string;
  explanation: string;
  corrections: Correction[];
}

// Data needed to save a correction
export interface SaveCorrectionParams {
  originalText: string;
  correctedText: string;
  corrections: Correction[];
}

// A correction as stored in Firestore
export interface StoredCorrection extends SaveCorrectionParams {
  id?: string;
  userId: string;
  createdAt: Date;
}

// User information from Firebase Auth
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
