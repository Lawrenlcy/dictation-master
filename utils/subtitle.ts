import { Cue, BiCue } from '../types';

// Helper to convert timestamp string to seconds
// Formats: 00:00:20,000 (SRT) or 00:00:20.000 (VTT)
// Also supports single digits: 0:0:2,54
const parseTimestamp = (timeStr: string): number => {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  
  let seconds = 0;
  let minutes = 0;
  let hours = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2].replace(',', '.'));
  } else {
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1].replace(',', '.'));
  }

  return hours * 3600 + minutes * 60 + seconds;
};

// Simple parser for SRT and VTT
export const parseSubtitle = async (file: File): Promise<Cue[]> => {
  const text = await file.text();
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const cues: Cue[] = [];
  
  let currentStart = 0;
  let currentEnd = 0;
  let currentText: string[] = [];
  let state: 'IDLE' | 'TIME' | 'TEXT' = 'IDLE';

  // Regex for timestamps line: 
  // Supports standard 00:00:20,000 --> 00:00:24,400
  // And relaxed 0:0:0,0 --> 0:0:2,54
  const timeRegex = /(\d{1,2}:\d{1,2}:\d{1,2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{1,2}:\d{1,2}[,.]\d{1,3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'WEBVTT') continue; // Skip header
    if (line === '') {
      if (state === 'TEXT' && currentText.length > 0) {
        cues.push({
          id: `cue-${cues.length}`,
          start: currentStart,
          end: currentEnd,
          text: currentText.join(' ').replace(/<[^>]*>/g, ''), // Remove HTML tags
        });
        currentText = [];
      }
      state = 'IDLE';
      continue;
    }

    if (state === 'IDLE') {
      // Could be ID or Timestamp
      const timeMatch = line.match(timeRegex);
      if (timeMatch) {
        currentStart = parseTimestamp(timeMatch[1]);
        currentEnd = parseTimestamp(timeMatch[2]);
        state = 'TEXT';
      } else if (/^\d+$/.test(line)) {
        // Just an ID, ignore, wait for timestamp
      }
    } else if (state === 'TEXT') {
       // Check if this line is actually a start of new cue (timestamp) - rare malformed case
       const timeMatch = line.match(timeRegex);
       if (timeMatch) {
          // Push previous
          if(currentText.length > 0) {
            cues.push({
                id: `cue-${cues.length}`,
                start: currentStart,
                end: currentEnd,
                text: currentText.join(' '),
            });
            currentText = [];
          }
          currentStart = parseTimestamp(timeMatch[1]);
          currentEnd = parseTimestamp(timeMatch[2]);
          state = 'TEXT';
       } else {
         currentText.push(line);
       }
    }
  }

  // Flush last
  if (currentText.length > 0) {
    cues.push({
      id: `cue-${cues.length}`,
      start: currentStart,
      end: currentEnd,
      text: currentText.join(' ').replace(/<[^>]*>/g, ''),
    });
  }

  return cues;
};

// Align English and Chinese cues based on time overlap
export const alignCues = (enCues: Cue[], zhCues: Cue[]): BiCue[] => {
  if (!zhCues || zhCues.length === 0) {
    return enCues.map(c => ({ ...c, en: c.text, zh: '' }));
  }

  return enCues.map(enCue => {
    // Find overlapping Chinese cues
    // Overlap condition: Not (zhEnd <= enStart OR zhStart >= enEnd)
    // Simplified: zhStart < enEnd AND zhEnd > enStart
    const matches = zhCues.filter(zhCue => 
      zhCue.start < enCue.end && zhCue.end > enCue.start
    );

    // If multiple matches, join them.
    const zhText = matches.map(m => m.text).join(' ');

    return {
      id: enCue.id,
      start: enCue.start,
      end: enCue.end,
      en: enCue.text,
      zh: zhText,
    };
  });
};