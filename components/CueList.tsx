import React, { useEffect, useRef } from 'react';
import { BiCue } from '../types';

interface CueListProps {
  cues: BiCue[];
  currentIndex: number;
  onSelectCue: (index: number) => void;
  completedIndices: Set<number>;
}

const CueList: React.FC<CueListProps> = ({ cues, currentIndex, onSelectCue, completedIndices }) => {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col h-full bg-gray-50 border-t border-gray-200">
      <div className="p-3 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-gray-500 flex justify-between items-center bg-gray-100">
        <span>Sentence List</span>
        <span className="bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200">{completedIndices.size} / {cues.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {cues.map((cue, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = completedIndices.has(idx);
          
          return (
            <button
              key={cue.id}
              ref={isActive ? activeRef : null}
              onClick={() => onSelectCue(idx)}
              className={`w-full text-left p-2 rounded-md text-sm transition-all duration-200 border group ${
                isActive 
                  ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-100' 
                  : 'hover:bg-white hover:border-gray-300 border-transparent text-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <div className={`truncate ${isActive ? 'font-medium text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {isCompleted ? cue.en : (isActive ? 'Listening...' : 'Locked')}
                    </div>
                </div>
                {isCompleted && (
                   <span className="text-green-500 flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                   </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CueList;
