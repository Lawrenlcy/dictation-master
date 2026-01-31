export interface Cue {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface BiCue {
  id: string;
  start: number;
  end: number;
  en: string;
  zh?: string;
}

export interface ProjectData {
  videoFile: File | null;
  enSubtitleFile: File | null;
  zhSubtitleFile: File | null;
  videoUrl: string | null;
  cues: BiCue[];
  title: string;
}

export enum DiffType {
  MATCH = 'MATCH',
  MISSING = 'MISSING',
  EXTRA = 'EXTRA',
  MISMATCH = 'MISMATCH',
}

export interface DiffPart {
  type: DiffType;
  value: string;
}
