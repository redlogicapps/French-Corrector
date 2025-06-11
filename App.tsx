
import React, { useState, useCallback } from 'react';
import { TextAreaInput } from './components/TextAreaInput';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Alert } from './components/Alert';
import { CopyButton } from './components/CopyButton';
import { correctFrenchText } from './services/geminiService';
import { DEFAULT_PLACEHOLDER_TEXT } from './constants';
import { CorrectionResult } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [correctedText, setCorrectedText] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
    if (correctedText) setCorrectedText('');
    if (explanation) setExplanation('');
    if (error) setError(null);
  }, [correctedText, explanation, error]);

  const handleSubmitCorrection = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Veuillez entrer du texte à corriger.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCorrectedText('');
    setExplanation('');

    try {
      const result: CorrectionResult = await correctFrenchText(inputText);
      setCorrectedText(result.correctedText);
      setExplanation(result.explanation);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleUseSampleText = useCallback(() => {
    setInputText(DEFAULT_PLACEHOLDER_TEXT);
    setCorrectedText('');
    setExplanation('');
    setError(null);
  }, []);

  const CorrectionIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-slate-100 flex flex-col items-center p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
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
        
        {/* Explanation Section - Placed outside the 2-column grid but within the main card */}
        {!isLoading && !error && explanation && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700">
            <h3 className="text-xl font-semibold text-amber-400 mb-3">Explication des Corrections</h3>
            <div className="bg-slate-700 p-4 rounded-lg prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
              {explanation}
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

export default App;