import { useState } from 'react';
import { StudyAdvice } from '../services/geminiService';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface StudyAdviceAccordionProps {
  advice: StudyAdvice | null;
  loading?: boolean;
  error?: string | null;
}

export default function StudyAdviceAccordion({ advice, loading, error }: StudyAdviceAccordionProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-blue-300">Analyse en cours</h3>
            <p className="text-sm text-slate-400 max-w-md">L'IA analyse vos corrections pour vous fournir des conseils personnalisés. Veuillez patienter quelques instants...</p>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{
              width: '70%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200">
        <p className="font-medium">Erreur</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
        Aucun conseil d'étude disponible.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Résumé de l'analyse</h3>
        <p className="text-slate-300">{advice.summary}</p>
      </div>

      {/* Corrections Accordion */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-300">Conseils détaillés</h3>
        
        {advice.corrections.map((correction, index) => (
          <div key={index} className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
              onClick={() => toggleSection(index)}
              aria-expanded={openSections[index]}
              aria-controls={`correction-${index}`}
            >
              <div>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-900/50 text-blue-300 mb-1">
                  {correction.category}
                </span>
                <h4 className="text-blue-300 font-medium">{correction.title}</h4>
              </div>
              {openSections[index] ? (
                <ChevronUpIcon className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-slate-400" />
              )}
            </button>
            
            <div
              id={`correction-${index}`}
              className={`${openSections[index] ? 'block' : 'hidden'} p-4 bg-slate-800/30`}
            >
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 mb-4">{correction.content}</p>
                
                {correction.examples.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h5 className="text-sm font-medium text-slate-400">Exemples :</h5>
                    <div className="space-y-4">
                      {correction.examples.map((example, exIndex) => (
                        <div key={exIndex} className="bg-slate-800/50 p-3 rounded-md border-l-4 border-blue-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Original :</p>
                              <p className="text-red-300 line-through">{example.original}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Correction :</p>
                              <p className="text-green-300">{(example as any).corrected || (example as any).correction || 'Aucune correction disponible'}</p>
                            </div>
                          </div>
                          {example.explanation && (
                            <div className="mt-2 text-sm text-slate-300 bg-slate-900/30 p-2 rounded">
                              <span className="font-medium">Explication :</span> {example.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
