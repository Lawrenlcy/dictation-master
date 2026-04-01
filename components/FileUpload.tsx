import React, { useState } from 'react';
import { ProjectData, BiCue, MediaType } from '../types';
import { parseSubtitle, alignCues } from '../utils/subtitle';

interface FileUploadProps {
  onProjectLoaded: (project: ProjectData) => void;
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.flac', '.opus', '.weba'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv', '.mkv'];

const detectMediaType = (file: File): MediaType | null => {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  const filename = file.name.toLowerCase();

  if (AUDIO_EXTENSIONS.some(ext => filename.endsWith(ext))) {
    return 'audio';
  }

  if (VIDEO_EXTENSIONS.some(ext => filename.endsWith(ext))) {
    return 'video';
  }

  return null;
};

const FileUpload: React.FC<FileUploadProps> = ({ onProjectLoaded }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [enFile, setEnFile] = useState<File | null>(null);
  const [zhFile, setZhFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!mediaFile || !enFile) {
      alert('Please upload at least one media file and English subtitles.');
      return;
    }

    const mediaType = detectMediaType(mediaFile);
    if (!mediaType) {
      alert('Unsupported media file. Please choose a browser-compatible audio or video file.');
      return;
    }

    setLoading(true);
    try {
      const enCues = await parseSubtitle(enFile);
      let cues: BiCue[] = [];

      if (zhFile) {
        const zhCues = await parseSubtitle(zhFile);
        cues = alignCues(enCues, zhCues);
      } else {
        cues = enCues.map(c => ({ ...c, en: c.text, zh: '' }));
      }

      // Filter empty cues
      cues = cues.filter(c => c.en.trim().length > 0);

      const videoUrl = URL.createObjectURL(mediaFile);

      onProjectLoaded({
        videoFile: mediaFile,
        enSubtitleFile: enFile,
        zhSubtitleFile: zhFile,
        videoUrl,
        mediaType,
        cues,
        title: mediaFile.name,
      });
    } catch (e) {
      console.error(e);
      alert('Error parsing files. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 text-center">New Dictation Project</h1>
        <p className="text-gray-500 mb-8 text-center">Load your local media and subtitles to start practicing.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media File (video / audio)</label>
            <input
              type="file"
              accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English Subtitles (.srt, .vtt)</label>
            <input
              type="file"
              accept=".srt,.vtt"
              onChange={(e) => setEnFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chinese Subtitles (Optional)</label>
            <input
              type="file"
              accept=".srt,.vtt"
              onChange={(e) => setZhFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!mediaFile || !enFile || loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-colors ${
              !mediaFile || !enFile || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            {loading ? 'Processing...' : 'Start Practice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
