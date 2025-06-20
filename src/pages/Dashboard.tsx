import React, { useState } from 'react';
import { correctText, saveCorrection } from '../services/correctionService';
import { CorrectionResult } from '../types';
import { CorrectionAccordion } from '../components/CorrectionAccordion';

export const Dashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCorrectText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to correct.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const correctionResult = await correctText(inputText);
      setResult(correctionResult);
      // Save the correction to Firestore
      await saveCorrection({
        originalText: inputText,
        correctedText: correctionResult.correctedText,
        corrections: correctionResult.corrections,
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Your Text</h2>
          <textarea
            className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-md text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="Enter your French text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Output Panel */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-300">Corrected Text</h2>
            {result?.correctedText && (
              <button
                onClick={() => navigator.clipboard.writeText(result.correctedText)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            )}
          </div>
          <div className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-md text-slate-300 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-slate-400">Correcting...</p>
              </div>
            ) : result ? (
              <p className="whitespace-pre-wrap">{result.correctedText}</p>
            ) : (
              <p className="text-slate-500">The correction will appear here.</p>
            )}
          </div>
        </div>
      </div>

      {/* Corrections Section */}
      {result?.corrections && result.corrections.length > 0 && (
        <div className="mt-6 bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-300">Corrections</h2>
            <span className="px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-300 rounded-full">
              {result.corrections.length} {result.corrections.length === 1 ? 'correction' : 'corrections'} found
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <CorrectionAccordion corrections={result.corrections} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleCorrectText}
          disabled={isLoading || !inputText.trim()}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Correcting...' : 'Correct Text'}
        </button>
      </div>
    </div>
  );
};
