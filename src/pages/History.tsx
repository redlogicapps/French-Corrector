import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Dialog, Transition } from '@headlessui/react';
import { getUserCorrections, deleteCorrection } from '../services/correctionService';
import { useAuth } from '../contexts/AuthContext';
import { StoredCorrection } from '../types';
import { CorrectionAccordion } from '../components/CorrectionAccordion';

const CorrectionDetailModal = ({ correction, onClose }: { correction: StoredCorrection | null, onClose: () => void }) => {
  if (!correction) return null;

  return (
    <Transition appear show={!!correction} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-slate-800 text-left align-middle shadow-xl transition-all border border-slate-700/50">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-white">
                      Correction Details
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-slate-400 hover:text-white focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-2">ORIGINAL TEXT</h4>
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                        <p className="text-slate-200 whitespace-pre-wrap">{correction.originalText}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-2">CORRECTED TEXT</h4>
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                        <p className="text-green-300 whitespace-pre-wrap">{correction.correctedText}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-400">CORRECTIONS</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                          {correction.corrections.length} {correction.corrections.length === 1 ? 'correction' : 'corrections'}
                        </span>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                        <CorrectionAccordion corrections={correction.corrections} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-md transition-colors"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export function History() {
  const [corrections, setCorrections] = useState<StoredCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<StoredCorrection | null>(null);
  const [correctionToDelete, setCorrectionToDelete] = useState<{ id: string } | null>(null);
  const { currentUser } = useAuth();

  const handleDeleteCorrection = async () => {
    if (!correctionToDelete?.id) {
      console.error('No correction ID provided');
      return;
    }

    const correctionId = correctionToDelete.id;
    
    try {
      setIsDeleting(correctionId);
      await deleteCorrection(correctionId);
      
      // Remove the deleted correction from the local state
      setCorrections(prev => prev.filter(c => c.id !== correctionId));
      setCorrectionToDelete(null);
    } catch (error) {
      console.error('Error deleting correction:', error);
      setError('Failed to delete the correction. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    const loadCorrections = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const userCorrections = await getUserCorrections();
        setCorrections(userCorrections);
      } catch (err) {
        console.error('Error loading corrections:', err);
        setError('Failed to load your correction history.');
      } finally {
        setLoading(false);
      }
    };

    loadCorrections();
  }, [currentUser]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      );
    }

    if (corrections.length === 0) {
      return (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">No corrections yet</h3>
          <p className="mt-2 text-sm text-slate-400">Get started by correcting some French text on the dashboard.</p>
          <div className="mt-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              New Correction
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corrections.map((correction) => (
          <div key={correction.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-2">
                {new Date(correction.createdAt).toLocaleString()}
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-300">Original</h4>
                  <p className="text-slate-300 text-sm truncate">{correction.originalText}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-300">Corrected</h4>
                  <p className="text-slate-300 text-sm truncate">{correction.correctedText}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700/50 px-6 py-3 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedCorrection(correction)} 
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                View details
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (correction.id) {
                    setCorrectionToDelete({ id: correction.id });
                  }
                }}
                className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!correction.id || isDeleting === correction.id}
              >
                {isDeleting === correction.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Correction History</h1>
      {renderContent()}
      <CorrectionDetailModal correction={selectedCorrection} onClose={() => setSelectedCorrection(null)} />
      <ConfirmDeleteModal 
        isOpen={!!correctionToDelete}
        onClose={() => setCorrectionToDelete(null)}
        onConfirm={handleDeleteCorrection}
      />
    </div>
  );
}
