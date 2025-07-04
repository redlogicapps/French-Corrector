import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Dialog, Transition } from '@headlessui/react';
import { getUserCorrections, deleteCorrection } from '../services/correctionService';
import { getStudyAdviceFromCorrections } from '../services/geminiService';
import type { StudyAdvice } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { fr } from 'date-fns/locale';
import { StoredCorrection } from '../types';
import StudyAdviceAccordion from '../components/StudyAdviceAccordion';
import { CorrectionAccordion } from '../components/CorrectionAccordion';
import { format as formatDate, subDays, startOfDay, endOfDay, isValid } from 'date-fns';
import { isWithinInterval } from 'date-fns';

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
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 relative group">
                        <p className="text-green-300 whitespace-pre-wrap pr-8">{correction.correctedText}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(correction.correctedText);
                            // You could add a toast notification here if desired
                          }}
                          className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                          title="Copy to clipboard"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
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

// Date filter options
const dateRanges = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'All time', value: 0 },
  { label: 'Custom range', value: 'custom' },
];

export function History() {
  const [corrections, setCorrections] = useState<StoredCorrection[]>([]);
  const [filteredCorrections, setFilteredCorrections] = useState<StoredCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<StoredCorrection | null>(null);
  const [correctionToDelete, setCorrectionToDelete] = useState<{ id: string } | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedRange, setSelectedRange] = useState<number | 'custom'>(30);
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

  // Helper function to safely parse dates
  const parseDate = (date: string | Date): Date => {
    return date instanceof Date ? date : new Date(date);
  };

  // Always update filtered corrections when any filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    if (!corrections.length) {
      setFilteredCorrections([]);
      return;
    }
    if (selectedRange === 'custom') {
      if (dateRange.start && dateRange.end) {
        const start = startOfDay(dateRange.start);
        const end = endOfDay(dateRange.end);
        setFilteredCorrections(
          corrections.filter(correction => {
            const correctionDate = parseDate(correction.createdAt);
            return isWithinInterval(correctionDate, { start, end });
          })
        );
      } else {
        setFilteredCorrections([...corrections]); // Show all until both dates are set
      }
    } else if (selectedRange > 0) {
      const startDate = subDays(new Date(), selectedRange);
      setFilteredCorrections(
        corrections.filter(correction => parseDate(correction.createdAt) >= startDate)
      );
    } else {
      setFilteredCorrections([...corrections]);
    }
  }, [corrections, dateRange.start, dateRange.end, selectedRange]);

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

  const handleDateRangeChange = (value: number | 'custom') => {
    setSelectedRange(value);
    if (value !== 'custom') {
      setDateRange({ start: null, end: null });
      
      if (value > 0) {
        const startDate = subDays(new Date(), value);
        setFilteredCorrections(corrections.filter(correction => 
          parseDate(correction.createdAt) >= startDate
        ));
      } else {
        setFilteredCorrections([...corrections]);
      }
    } else {
      setDateRange({ start: null, end: null }); // Reset dates on custom selection
      setFilteredCorrections([...corrections]); // Show all until both dates are set
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', dateString: string) => {
    const newDate = dateString ? new Date(dateString) : null;
    setDateRange(prev => ({
      ...prev,
      [type]: newDate
    }));
  };
  
  const clearDateFilter = () => {
    setSelectedRange(0);
    setDateRange({ start: null, end: null });
    setFilteredCorrections([...corrections]);
  };

  const renderFilterBar = () => (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-6">
      <div className="flex-1">
        <h2 className="text-lg font-medium text-white">Filter by Date</h2>
        <p className="text-sm text-slate-400">
          {selectedRange === 'custom' && dateRange.start && dateRange.end
            ? `${isValid(dateRange.start) ? formatDate(dateRange.start, 'MMM d, yyyy', { locale: fr }) : ''} - ${isValid(dateRange.end) ? formatDate(dateRange.end, 'MMM d, yyyy', { locale: fr }) : ''}`
            : selectedRange === 0
            ? 'All time'
            : `Last ${selectedRange} days`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <select
            value={selectedRange}
            onChange={(e) => {
              const val = e.target.value;
              handleDateRangeChange(val === 'custom' ? 'custom' : Number(val));
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-700 text-white"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        {/* Always show date pickers when custom is selected */}
        {selectedRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">From</label>
              <input
                type="date"
                value={dateRange.start && isValid(dateRange.start) ? formatDate(dateRange.start, 'yyyy-MM-dd', { locale: fr }) : ''}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-700 text-white"
                max={dateRange.end && isValid(dateRange.end) ? formatDate(dateRange.end, 'yyyy-MM-dd', { locale: fr }) : formatDate(new Date(), 'yyyy-MM-dd', { locale: fr })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">To</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.end && isValid(dateRange.end) ? formatDate(dateRange.end, 'yyyy-MM-dd', { locale: fr }) : ''}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-700 text-white"
                  min={dateRange.start && isValid(dateRange.start) ? formatDate(dateRange.start, 'yyyy-MM-dd', { locale: fr }) : undefined}
                  max={formatDate(new Date(), 'yyyy-MM-dd', { locale: fr })}
                />
                <button
                  onClick={clearDateFilter}
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Calculate pagination
  const totalItems = selectedRange !== 0 || dateRange.start || dateRange.end ? filteredCorrections.length : corrections.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center justify-between">
        <div className="sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${currentPage === 1 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-300 hover:text-white'}`}
          >
            Previous
          </button>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm text-slate-400">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div className="sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${currentPage === totalPages ? 'text-slate-500 cursor-not-allowed' : 'text-blue-300 hover:text-white'}`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end gap-4">
          <div className="text-sm text-slate-400">
            Showing <span className="font-medium">{Math.min(startIndex + 1, totalItems)}</span> to{' '}
            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          <div className="flex-shrink-0">
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Always show first page, last page, current page, and one page before and after current
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum 
                      ? 'bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 z-10' 
                      : 'text-slate-300 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 focus:outline-offset-0 hover:text-white'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
    );
  };

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

    const itemsToDisplay = selectedRange !== 0 || dateRange.start || dateRange.end ? filteredCorrections : corrections;
    
    return (
      <>
        {renderFilterBar()}
        {itemsToDisplay.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No corrections found</h3>
            <p className="mt-2 text-sm text-slate-400">{corrections.length === 0 ? 'Get started by correcting some French text on the dashboard.' : 'Try adjusting your filter or clearing the date range.'}</p>
            {corrections.length === 0 && (
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
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsToDisplay.map((correction) => (
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
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-green-300">Corrected</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(correction.correctedText);
                          }}
                          className="text-slate-400 hover:text-white ml-2"
                          title="Copy to clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
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
            {totalPages > 1 && (
              <div className="border-t border-slate-700/50 pt-4 mt-2">
                <div className="flex justify-center">
                  <div className="text-sm text-slate-400">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  };


  // AI Study Advice Modal state
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<StudyAdvice | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  // Handler to get AI advice
  const handleGetAdvice = async () => {
    if (!currentUser) {
      setAdviceError('You must be logged in to get study advice.');
      return;
    }
    
    setAdviceLoading(true);
    setAdviceError(null);
    setAiAdvice(null);
    setIsAdviceModalOpen(true);
    try {
      // Aggregate all Correction[] from filteredCorrections
      const allCorrections = filteredCorrections.flatMap(c => c.corrections ?? []);
      if (allCorrections.length === 0) {
        setAiAdvice({
          summary: 'Aucune correction à analyser.',
          corrections: []
        });
        setAdviceLoading(false);
        return;
      }
      const advice = await getStudyAdviceFromCorrections(allCorrections);
      setAiAdvice(advice);
    } catch (err) {
      console.error('Error getting study advice:', err);
      setAdviceError('Erreur lors de la génération des conseils. Veuillez réessayer plus tard.');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Correction History</h1>
          <button
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGetAdvice}
            disabled={filteredCorrections.length === 0}
          >
            Get Study Advice from AI
          </button>
        </div>
        {totalPages > 1 && (
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            {renderPagination()}
          </div>
        )}
      </div>
      {renderContent()}
      {/* AI Advice Modal */}
      <Transition appear show={isAdviceModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsAdviceModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold leading-6 text-white flex items-center"
                    >
                      <svg className="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Conseils d'étude personnalisés
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-white"
                      onClick={() => setIsAdviceModalOpen(false)}
                    >
                      <span className="sr-only">Fermer</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {(aiAdvice || adviceLoading) && (
                      <StudyAdviceAccordion 
                        advice={aiAdvice}
                        loading={adviceLoading} 
                        error={adviceError} 
                      />
                    )}
                  </div>

                  <div className="mt-6 flex justify-end border-t border-slate-700 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-md border border-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                      onClick={() => setIsAdviceModalOpen(false)}
                    >
                      Fermer
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <CorrectionDetailModal correction={selectedCorrection} onClose={() => setSelectedCorrection(null)} />
      <ConfirmDeleteModal 
        isOpen={!!correctionToDelete}
        onClose={() => setCorrectionToDelete(null)}
        onConfirm={handleDeleteCorrection}
      />
    </div>
  );
}
