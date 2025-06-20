import React, { Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { 
  ChevronDownIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Correction, CorrectionType } from '../types';

const typeConfig: Record<CorrectionType, { 
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  'Punctuation': {
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    icon: DocumentTextIcon
  },
  'Conjugation': {
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    icon: PencilSquareIcon
  },
  'Spelling': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    icon: CheckCircleIcon
  },
  'Comprehension': {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    icon: LightBulbIcon
  },
  'Grammar': {
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    icon: ExclamationCircleIcon
  },
  'Other': {
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    icon: QuestionMarkCircleIcon
  }
};

interface CorrectionAccordionProps {
  corrections: Correction[];
}

// Helper function to safely get type config with fallback to 'Other'
const getTypeConfig = (type: CorrectionType) => {
  return typeConfig[type] || typeConfig['Other'];
};

export const CorrectionAccordion: React.FC<CorrectionAccordionProps> = ({ corrections }) => {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (corrections.length === 0) {
    return (
      <div className="text-center py-4 text-slate-400">
        No corrections needed. Your text looks good!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {corrections.map((correction, index) => (
        <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-600/50">
          <button
            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-700/30 transition-colors flex items-center justify-between group"
            onClick={() => toggleItem(index)}
            aria-expanded={!!openItems[index]}
          >
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeConfig(correction.type).bgColor} ${getTypeConfig(correction.type).color}`}>
                {React.createElement(getTypeConfig(correction.type).icon, { className: "h-3 w-3 mr-1" })}
                {correction.type}
              </span>
              <span className="text-left text-blue-300 group-hover:text-blue-200 transition-colors">
                {correction.shortExplanation}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openItems[index] ? 'transform rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          <Transition
            as={Fragment}
            show={!!openItems[index]}
            enter="transition-all ease-out duration-200"
            enterFrom="opacity-0 max-h-0"
            enterTo="opacity-100 max-h-96"
            leave="transition-all ease-in duration-150"
            leaveFrom="opacity-100 max-h-96"
            leaveTo="opacity-0 max-h-0"
          >
            <div className="px-4 pb-4 pt-1 text-sm text-slate-300 border-t border-slate-700/50">
              <div className="mt-3 bg-slate-900/40 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-xs font-medium text-slate-400">Original</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeConfig(correction.type).bgColor} ${getTypeConfig(correction.type).color}`}>
                        {React.createElement(getTypeConfig(correction.type).icon, { className: "h-3 w-3 mr-1" })}
                        {correction.type}
                      </span>
                    </div>
                    <p className="text-amber-200">{correction.original}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Correction</p>
                    <p className="text-green-300">{correction.corrected}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <p className="text-xs font-medium text-slate-400 mb-1">Explanation</p>
                  <p className="text-slate-300">{correction.explanation}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      ))}
    </div>
  );
};
