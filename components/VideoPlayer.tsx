import React, { useEffect, useState, RefObject } from 'react';
import { BiCue } from '../types';

interface VideoPlayerProps {
  src: string;
  cue: BiCue | null;
  onTimeUpdate?: (currentTime: number) => void;
  loopEnabled: boolean;
  playbackRate: number;
  videoRef: RefObject<HTMLVideoElement | null>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, cue, onTimeUpdate, loopEnabled, playbackRate, videoRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Effect to handle Playback Rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoRef]);

  // Effect to jump to start when cue changes
  useEffect(() => {
    if (videoRef.current && cue) {
      videoRef.current.currentTime = cue.start;
      // Auto-play when switching cues for smoother flow
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

    if (cue) {
      // Loop Logic
      if (current >= cue.end) {
        if (loopEnabled) {
             videoRef.current.currentTime = cue.start;
             videoRef.current.play();
        } else {
             // Loop disabled: Pause at end
             if (!videoRef.current.paused) {
                 videoRef.current.pause();
                 setIsPlaying(false);
                 // Optional: Snap to end visual to be precise, or just leave it slightly past
                 // videoRef.current.currentTime = cue.end; 
             }
        }
      }
    }
  };

  const togglePlay = () => {
    if(!videoRef.current) return;
    if (videoRef.current.paused) {
       // If we are at the end of the cue and hitting play, restart the cue
       if (cue && videoRef.current.currentTime >= cue.end) {
           videoRef.current.currentTime = cue.start;
       }
       videoRef.current.play();
       setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  const handleReplay = () => {
    if (videoRef.current && cue) {
        videoRef.current.currentTime = cue.start;
        videoRef.current.play();
        setIsPlaying(true);
    }
  }

  return (
    <div className="relative group bg-black rounded-lg overflow-hidden shadow-lg w-full aspect-video">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />
      
      {/* Overlay Controls (Simple) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-lg backdrop-blur-sm">
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
         <div className="text-white text-sm font-mono">
            {loopEnabled ? "Loop: ON" : "Loop: OFF"}
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;