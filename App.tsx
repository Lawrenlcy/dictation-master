import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectData } from './types';
import FileUpload from './components/FileUpload';
import VideoPlayer from './components/VideoPlayer';
import DictationArea from './components/DictationArea';
import CueList from './components/CueList';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  
  // Resizable sidebar state
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (project?.videoUrl) {
        URL.revokeObjectURL(project.videoUrl);
      }
    };
  }, [project]);

  const handleNext = useCallback(() => {
    if (project && currentCueIndex < project.cues.length - 1) {
      setCurrentCueIndex(prev => prev + 1);
    }
  }, [project, currentCueIndex]);

  const handlePrev = useCallback(() => {
    if (currentCueIndex > 0) {
      setCurrentCueIndex(prev => prev - 1);
    }
  }, [currentCueIndex]);

  const handleMarkCorrect = () => {
    setCompletedIndices(prev => new Set(prev).add(currentCueIndex));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project) return;

      // ` (Backtick) or Ctrl+Space: Play/Pause
      if (e.code === 'Backquote' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        if (videoRef.current) {
          const video = videoRef.current;
          const cue = project.cues[currentCueIndex];
          
          if (video.paused) {
            // If paused, and we are at the end (or past) of the cue, rewind to start before playing
            if (cue && video.currentTime >= cue.end - 0.1) { // -0.1 tolerance
                 video.currentTime = cue.start;
            }
            video.play();
          } else {
            video.pause();
          }
        }
      }

      // Ctrl + ArrowRight: Next Sentence
      if (e.ctrlKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }

      // Ctrl + ArrowLeft: Prev Sentence
      if (e.ctrlKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }

      // Ctrl + R: Replay Current
      if (e.ctrlKey && e.code === 'KeyR') {
         e.preventDefault();
         const currentCue = project.cues[currentCueIndex];
         if (videoRef.current && currentCue) {
             videoRef.current.currentTime = currentCue.start;
             videoRef.current.play();
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, currentCueIndex, handleNext, handlePrev]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate new width from right edge of screen
        const newWidth = window.innerWidth - e.clientX;
        // Limits
        if (newWidth > 300 && newWidth < 800) {
            setRightPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  if (!project) {
    return <FileUpload onProjectLoaded={setProject} />;
  }

  const currentCue = project.cues[currentCueIndex];

  return (
    <div className="flex h-screen bg-gray-100 font-sans flex-col">
       {/* Header */}
       <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-20 relative">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">DM</div>
             <h1 className="font-semibold text-gray-700 truncate max-w-xs" title={project.title}>{project.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex gap-3 text-xs text-gray-400 mr-2 border-r border-gray-200 pr-4">
                <span><code className="bg-gray-100 px-1 rounded font-bold">~</code> Play/Pause</span>
                <span><code className="bg-gray-100 px-1 rounded">Enter</code> Check/Next</span>
                <span><code className="bg-gray-100 px-1 rounded">Ctrl+R</code> Replay</span>
             </div>

             <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-500 font-bold uppercase">Speed</span>
                <select 
                    value={playbackRate} 
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                </select>
             </div>

             <button 
                onClick={() => setLoopEnabled(!loopEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${loopEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {loopEnabled ? 'Loop On' : 'Loop Off'}
             </button>

             <button 
                onClick={() => setProject(null)}
                className="text-gray-500 hover:text-red-500 text-sm font-medium px-2"
             >
                Exit
             </button>
          </div>
        </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Panel */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative min-w-[300px]">
             <div className="w-full h-full flex flex-col justify-center max-w-5xl mx-auto">
                 <VideoPlayer 
                    videoRef={videoRef}
                    src={project.videoUrl!} 
                    cue={currentCue} 
                    loopEnabled={loopEnabled}
                    playbackRate={playbackRate}
                 />
                 
                 {/* Navigation Bar under video */}
                 <div className="flex items-center justify-between mt-4 text-white w-full px-2">
                    <button 
                        onClick={handlePrev}
                        disabled={currentCueIndex === 0}
                        className="flex items-center gap-1 text-sm font-medium hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Prev
                    </button>

                    <div className="text-sm font-mono text-gray-400">
                        {currentCueIndex + 1} / {project.cues.length}
                    </div>

                    <button 
                        onClick={handleNext}
                        disabled={currentCueIndex === project.cues.length - 1}
                        className="flex items-center gap-1 text-sm font-medium hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                 </div>
             </div>
        </div>

        {/* Resizer Handle */}
        <div 
           className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize flex-shrink-0 z-10 transition-colors"
           onMouseDown={() => setIsResizing(true)}
        ></div>

        {/* Right: Dictation & Sentences */}
        <div 
           style={{ width: rightPanelWidth }}
           className="flex-shrink-0 bg-white border-l border-gray-200 z-0 flex flex-col h-full"
        >
             {/* Top: Dictation Input */}
             <div className="flex-shrink-0" style={{ minHeight: '300px' }}>
                <DictationArea 
                    cue={currentCue} 
                    onCorrect={handleMarkCorrect}
                    onPeek={() => {}} 
                    onNextSentence={handleNext}
                />
             </div>

             {/* Bottom: Sentences List */}
             <div className="flex-1 overflow-hidden">
                <CueList 
                    cues={project.cues} 
                    currentIndex={currentCueIndex} 
                    onSelectCue={setCurrentCueIndex}
                    completedIndices={completedIndices}
                />
             </div>
        </div>

      </div>
    </div>
  );
};

export default App;
