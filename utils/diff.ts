import { DiffPart, DiffType } from '../types';

// Standardize text for comparison: lowercase, remove punctuation
const cleanText = (text: string) => {
  return text.toLowerCase().replace(/['".,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
};

// Map of expanded forms to contractions for robust matching
const CONTRACTIONS: Record<string, string> = {
  "do not": "dont",
  "can not": "cant",
  "cannot": "cant",
  "will not": "wont",
  "i am": "im",
  "you are": "youre",
  "we are": "were",
  "they are": "theyre",
  "it is": "its",
  "is not": "isnt",
  "are not": "arent",
  "was not": "wasnt",
  "were not": "werent",
  "have not": "havent",
  "has not": "hasnt",
  "had not": "hadnt",
  "would not": "wouldnt",
  "could not": "couldnt",
  "should not": "shouldnt",
  "did not": "didnt",
  "does not": "doesnt",
};

export interface DiffResult {
    diff: DiffPart[];
    firstErrorIndex: number;
    firstErrorType: DiffType | null;
}

export const computeDiff = (input: string, target: string): DiffResult => {
  // We split the ORIGINAL target to preserve punctuation for display
  const targetWordsOriginal = target.trim().split(/\s+/);
  
  // We split input and target by space for processing
  const inputWords = input.trim().split(/\s+/).filter(w => w.length > 0);
  
  const result: DiffPart[] = [];
  
  let i = 0; // input index
  let j = 0; // target index
  let firstErrorIndex = -1;
  let firstErrorType: DiffType | null = null;

  const setError = (idx: number, type: DiffType) => {
      if (firstErrorIndex === -1) {
          firstErrorIndex = idx;
          firstErrorType = type;
      }
  };
  
  while (j < targetWordsOriginal.length) {
    const targetOriginal = targetWordsOriginal[j];
    const targetClean = cleanText(targetOriginal);
    
    // If we ran out of input
    if (i >= inputWords.length) {
      result.push({ type: DiffType.MISSING, value: targetOriginal });
      setError(i, DiffType.MISSING);
      j++;
      continue;
    }

    const inputClean = cleanText(inputWords[i]);

    // 1. Exact Match (cleaned)
    if (inputClean === targetClean) {
      result.push({ type: DiffType.MATCH, value: targetOriginal });
      i++;
      j++;
      continue;
    }

    // 2. Check for "do not" (input) vs "don't" (target)
    if (i + 1 < inputWords.length) {
      const combinedInput = inputClean + cleanText(inputWords[i+1]);
      if (CONTRACTIONS[`${inputClean} ${cleanText(inputWords[i+1])}`] === targetClean || combinedInput === targetClean) {
         result.push({ type: DiffType.MATCH, value: targetOriginal });
         i += 2; // consumed 2 input words
         j++;    // consumed 1 target word
         continue;
      }
    }

    // 3. Lookahead for MISSING word in input (Target has it, Input skipped it)
    // Check if current input matches the NEXT target word
    if (j + 1 < targetWordsOriginal.length) {
        const nextTargetClean = cleanText(targetWordsOriginal[j+1]);
        if (inputClean === nextTargetClean) {
            // We assume target[j] was skipped.
            result.push({ type: DiffType.MISSING, value: targetOriginal });
            setError(i, DiffType.MISSING);
            // We do NOT increment i, because input[i] matches target[j+1]
            j++;
            continue;
        }
    }

    // 4. Mismatch logic
    result.push({ type: DiffType.MISMATCH, value: targetOriginal });
    setError(i, DiffType.MISMATCH);
    
    // Advance both
    i++; 
    j++;
  }
  
  // If we have extra input words left at the end
  if (i < inputWords.length) {
      if (firstErrorIndex === -1) {
          firstErrorIndex = i;
          firstErrorType = DiffType.EXTRA;
      }
  }

  return { diff: result, firstErrorIndex, firstErrorType };
};

// Helper to calculate score
export const calculateScore = (diff: DiffPart[]): number => {
    if (diff.length === 0) return 0;
    const correct = diff.filter(d => d.type === DiffType.MATCH).length;
    return Math.round((correct / diff.length) * 100);
}