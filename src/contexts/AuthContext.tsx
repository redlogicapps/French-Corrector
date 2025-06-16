import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Function to check if a user is an admin
const checkAdminStatus = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    // Check if the user has admin role in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() && userDoc.data()?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check admin status after successful login
      const adminStatus = await checkAdminStatus(result.user);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Function to handle auth state changes
  const handleAuthStateChanged = useCallback(async (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      const adminStatus = await checkAdminStatus(user);
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return unsubscribe;
  }, [handleAuthStateChanged]);

  const value = {
    currentUser,
    loading,
    isAdmin,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
