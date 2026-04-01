import React, { useEffect, useState, RefObject } from 'react';
import { BiCue, MediaType } from '../types';

interface VideoPlayerProps {
  src: string;
  cue: BiCue | null;
  onTimeUpdate?: (currentTime: number) => void;
  loopEnabled: boolean;
  playbackRate: number;
  mediaType: MediaType;
  title: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  cue,
  onTimeUpdate,
  loopEnabled,
  playbackRate,
  mediaType,
  title,
  videoRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = mediaType === 'audio';

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoRef]);

  useEffect(() => {
    if (videoRef.current && cue) {
      videoRef.current.currentTime = cue.start;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [cue, videoRef]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;

    if (onTimeUpdate) {
      onTimeUpdate(current);
    }

    if (cue && current >= cue.end) {
      if (loopEnabled) {
        videoRef.current.currentTime = cue.start;
        videoRef.current.play();
      } else if (!videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      if (cue && videoRef.current.currentTime >= cue.end) {
        videoRef.current.currentTime = cue.start;
      }
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    if (videoRef.current && cue) {
      videoRef.current.currentTime = cue.start;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={`relative group bg-black rounded-lg overflow-hidden shadow-lg w-full ${
        isAudio ? 'min-h-[280px]' : 'aspect-video'
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        className={isAudio ? 'absolute inset-0 h-full w-full opacity-0 pointer-events-none' : 'w-full h-full object-contain'}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {isAudio && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6 text-white"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold">Audio Dictation Mode</p>
            <p className="mt-2 max-w-xl truncate text-sm text-gray-300" title={title}>{title}</p>
            <p className="mt-3 text-xs text-gray-400">Click anywhere here, or use ~ / Ctrl+Space, to play or pause.</p>
          </div>
        </button>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-lg bg-black/50 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <div className="flex gap-2">
          <button onClick={togglePlay} className="text-white hover:text-blue-400">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </button>
          <button onClick={handleReplay} className="text-white hover:text-blue-400" title="Replay current sentence (Ctrl+R)">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="text-sm font-mono text-white">
          {loopEnabled ? 'Loop: ON' : 'Loop: OFF'}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
