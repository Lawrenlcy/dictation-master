import React, { useState, useEffect, useRef } from 'react';
import { BiCue, DiffPart, DiffType } from '../types';
import { computeDiff, calculateScore } from '../utils/diff';

interface DictationAreaProps {
  cue: BiCue | null;
  onCorrect: () => void;
  onPeek: () => void;
  onNextSentence: () => void;
}

const DictationArea: React.FC<DictationAreaProps> = ({ cue, onCorrect, onPeek, onNextSentence }) => {
  const [input, setInput] = useState('');
  const [diff, setDiff] = useState<DiffPart[] | null>(null);
  const [showAnswer, setShowAnswer] = useState(false); // Controls success/peek state
  const [revealMode, setRevealMode] = useState(false); // True if user clicked "Give Up"
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when cue changes
  useEffect(() => {
    setInput('');
    setDiff(null);
    setShowAnswer(false);
    setRevealMode(false);
    if(inputRef.current) inputRef.current.focus();
  }, [cue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Hide hint immediately when user types
    if (diff) {
        setDiff(null);
    }
  };

  const selectErrorWord = (inputVal: string, wordIndex: number, errorType: DiffType | null) => {
      const regex = /\S+/g;
      let match;
      let count = 0;
      while ((match = regex.exec(inputVal)) !== null) {
          if (count === wordIndex) {
              if (inputRef.current) {
                  inputRef.current.focus();
                  if (errorType === DiffType.MISSING) {
                      // Missing word: Place cursor BEFORE this word
                      inputRef.current.setSelectionRange(match.index, match.index);
                  } else {
                      // Mismatch/Extra: Select the whole word
                      inputRef.current.setSelectionRange(match.index, match.index + match[0].length);
                  }
              }
              return;
          }
          count++;
      }
      
      // If we reach here, it means we ran out of words (wordIndex >= total words)
      // This handles the case where words are missing at the END of the sentence
      if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(inputVal.length, inputVal.length);
      }
  }

  const handleSubmit = () => {
    if (!cue) return;
    
    // Compute diff
    const { diff: result, firstErrorIndex, firstErrorType } = computeDiff(input, cue.en);
    setDiff(result);
    
    // Check if fully correct 
    const isCorrect = result.every(p => p.type === DiffType.MATCH) && firstErrorIndex === -1;
    
    if (isCorrect) {
        onCorrect();
        setShowAnswer(true); // Shows translation
        setInput(cue.en); 
        setDiff(null); // Clear diff view
        
        // Keep focus on the input so the next 'Enter' press triggers onNextSentence via handleKeyDown
        if (inputRef.current) {
            inputRef.current.focus();
        }
    } else {
        // Move cursor/selection to the first error
        if (firstErrorIndex !== -1) {
            selectErrorWord(input, firstErrorIndex, firstErrorType);
        } else {
            // Fallback for weird edge cases, select end
            selectErrorWord(input, 9999, null);
        }
    }
  };

  const handleReveal = () => {
    setRevealMode(true);
    setShowAnswer(true);
    onPeek(); 
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (showAnswer) {
              // If already shown (correct or revealed), move next
              onNextSentence();
          } else {
              handleSubmit();
          }
      }
  }

  if (!cue) return <div className="p-8 text-center text-gray-400">Select a sentence to start</div>;

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-y-auto">
      
      {/* 1. Feedback / Diff Area */}
      <div className="mb-4 min-h-[40px]">
        {diff && !showAnswer ? (
          <div className="text-lg leading-relaxed">
            {(() => {
               const partsToRender = [];
               for (const part of diff) {
                   if (part.type === DiffType.MATCH) {
                       partsToRender.push(
                           <span key={partsToRender.length} className="text-green-600 font-medium inline-block mr-1">
                               {part.value}
                           </span>
                       );
                   } else {
                       partsToRender.push(
                           <span key={partsToRender.length} className="text-red-500 bg-red-50 px-1 rounded mx-0.5 border border-red-100 font-medium inline-block mr-1">
                               {part.value}
                           </span>
                       );
                       // We stop rendering after the first error to keep it clean, or render all?
                       // The user didn't specify, but rendering all helps. 
                       // Previous logic: break; -> only show up to first error.
                       // Let's keep the break to mimic DailyDictation style (Stop at error).
                       break; 
                   }
               }
               return partsToRender;
            })()}
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">
             {!showAnswer && "Listen and type..."}
          </div>
        )}
      </div>

      {/* 2. Original & Translation (Visible on Success/Reveal) */}
      {showAnswer && (
        <div className="mb-4 animate-fade-in bg-green-50 p-4 rounded-lg border border-green-100">
             {/* English */}
             <div className="mb-2">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide block mb-1">Original</span>
                <div className="text-lg text-gray-800 font-medium">{cue.en}</div>
             </div>
             
             {/* Chinese */}
             {cue.zh && (
                 <div className="mt-3 pt-3 border-t border-green-200">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wide block mb-1">Translation</span>
                    <div className="text-lg text-gray-700 font-serif">
                        {cue.zh}
                    </div>
                 </div>
             )}
        </div>
      )}

      {/* 3. Input Area */}
      <div className="relative mb-4 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type what you hear..."
          readOnly={showAnswer && !revealMode} 
          className={`w-full border rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm resize-none transition-colors ${
              showAnswer && !revealMode ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300'
          }`}
          style={{ minHeight: '100px' }}
        />
        <div className="absolute bottom-2 right-3 text-xs text-gray-400">
           {showAnswer ? 'Press Enter for Next' : 'Press Enter to Check'}
        </div>
      </div>

      {/* 4. Controls */}
      {!showAnswer && (
        <div className="flex gap-3 mb-2">
            <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
            Check
            </button>
            <button
                onClick={handleReveal}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
                Give Up
            </button>
        </div>
      )}
    </div>
  );
};

export default DictationArea;