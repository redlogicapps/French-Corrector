
import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TextAreaInput } from './components/TextAreaInput';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Alert } from './components/Alert';
import { CopyButton } from './components/CopyButton';
import { correctFrenchText } from './src/services/geminiService';
import { saveCorrection } from './src/services/correctionService';
import { DEFAULT_PLACEHOLDER_TEXT } from './constants';
import { Navbar } from './src/components/Navbar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Login } from './src/components/auth/Login';
import { History } from './src/pages/History';
import { ProtectedRoute } from './src/components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Redirect to login if not authenticated and not on auth pages
  if (!currentUser && !['/login', '/signup'].includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }
  const [inputText, setInputText] = useState<string>('');
  const [correctedText, setCorrectedText] = useState<string>('');
  const [corrections, setCorrections] = useState<Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
    if (correctedText) setCorrectedText('');
    if (corrections.length > 0) setCorrections([]);
    if (error) setError(null);
  }, [correctedText, corrections.length, error]);

  const handleSubmitCorrection = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Veuillez entrer du texte à corriger.");
      return;
    }
    
    if (!currentUser) {
      setError("Veuillez vous connecter pour enregistrer vos corrections.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCorrectedText('');
    setCorrections([]);

    try {
      const result = await correctFrenchText(inputText);
      setCorrectedText(result.correctedText);
      setCorrections(result.corrections || []);
      
      // Save the correction to Firestore if there are corrections
      if (result.corrections && result.corrections.length > 0) {
        try {
          await saveCorrection({
            originalText: inputText,
            correctedText: result.correctedText,
            corrections: result.corrections
          });
        } catch (saveError) {
          console.error('Error saving correction:', saveError);
          // Don't show error to user for save failure
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      setError(errorMessage);
      console.error('Error in correction:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, currentUser]);

  const handleUseSampleText = useCallback(() => {
    setInputText(DEFAULT_PLACEHOLDER_TEXT);
    setCorrectedText('');
    setCorrections([]);
    setError(null);
  }, []);

  const CorrectionIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-slate-100 flex flex-col items-center p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
      <Navbar />
      <header className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          Correcteur de Français IA
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Améliorez vos écrits professionnels en français avec la puissance de l'IA.
        </p>
      </header>

      <main className="w-full max-w-5xl p-6 sm:p-8 bg-slate-800 shadow-2xl rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Input Section */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-semibold text-sky-400">Votre Texte</h2>
            <TextAreaInput
              value={inputText}
              onChange={handleInputChange}
              placeholder="Écrivez ou collez votre texte français ici..."
              rows={10}
            />
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button 
                onClick={handleSubmitCorrection} 
                isLoading={isLoading}
                disabled={isLoading || !inputText.trim()}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white"
              >
                <CorrectionIcon />
                Corriger le Texte
              </Button>
              <Button 
                onClick={handleUseSampleText} 
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                Utiliser un exemple
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Texte Corrigé</h2>
            {isLoading && (
              <div className="flex justify-center items-center h-full min-h-[200px] bg-slate-700 rounded-lg">
                <LoadingSpinner />
              </div>
            )}
            {error && !isLoading && (
               <div className="h-full min-h-[200px] flex items-center justify-center bg-slate-700 rounded-lg p-4">
                <Alert type="error" message={error} />
               </div>
            )}
            {!isLoading && !error && correctedText && (
              <>
                <div className="bg-slate-700 p-4 rounded-lg min-h-[150px] prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap">
                  {correctedText}
                </div>
                <CopyButton textToCopy={correctedText} />
              </>
            )}
            {!isLoading && !error && !correctedText && (
                 <div className="flex items-center justify-center h-full min-h-[200px] bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 italic">Le texte corrigé apparaîtra ici.</p>
                 </div>
            )}
          </div>
        </div>
        
        {/* Corrections List Section */}
        {!isLoading && !error && corrections.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700">
            <h3 className="text-xl font-semibold text-amber-400 mb-4">Corrections Apportées</h3>
            <div className="space-y-4">
              {corrections.map((correction, index) => (
                <div key={index} className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-amber-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Original :</p>
                      <p className="text-red-300 line-through">{correction.original}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Corrigé :</p>
                      <p className="text-green-300 font-medium">{correction.corrected}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-600">
                    <p className="text-sm text-slate-300">{correction.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <footer className="w-full max-w-5xl mt-8 text-center">
        <p className="text-sm text-slate-500">
          Propulsé par l'IA de Google Gemini.
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppContent />} />
            <Route path="/history" element={<History />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;