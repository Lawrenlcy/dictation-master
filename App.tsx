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

  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleProjectLoaded = (nextProject: ProjectData) => {
    setProject(nextProject);
    setCurrentCueIndex(0);
    setCompletedIndices(new Set());
  };

  const handleExit = () => {
    setProject(null);
    setCurrentCueIndex(0);
    setCompletedIndices(new Set());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project) return;

      if (e.code === 'Backquote' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        if (videoRef.current) {
          const video = videoRef.current;
          const cue = project.cues[currentCueIndex];

          if (video.paused) {
            if (cue && video.currentTime >= cue.end - 0.1) {
              video.currentTime = cue.start;
            }
            video.play();
          } else {
            video.pause();
          }
        }
      }

      if (e.ctrlKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }

      if (e.ctrlKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
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
    return <FileUpload onProjectLoaded={handleProjectLoaded} />;
  }

  const currentCue = project.cues[currentCueIndex];

  return (
    <div className="flex h-screen flex-col bg-gray-100 font-sans">
      <header className="relative z-20 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">DM</div>
          <h1 className="max-w-xs truncate font-semibold text-gray-700" title={project.title}>{project.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="mr-2 hidden gap-3 border-r border-gray-200 pr-4 text-xs text-gray-400 lg:flex">
            <span><code className="rounded bg-gray-100 px-1 font-bold">~</code> Play/Pause</span>
            <span><code className="rounded bg-gray-100 px-1">Enter</code> Check/Next</span>
            <span><code className="rounded bg-gray-100 px-1">Ctrl+R</code> Replay</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-1">
            <span className="text-xs font-bold uppercase text-gray-500">Speed</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
            </select>
          </div>

          <button
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${loopEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {loopEnabled ? 'Loop On' : 'Loop Off'}
          </button>

          <button
            onClick={handleExit}
            className="px-2 text-sm font-medium text-gray-500 hover:text-red-500"
          >
            Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex min-w-[300px] flex-1 flex-col items-center justify-center bg-black p-4">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center">
            <VideoPlayer
              videoRef={videoRef}
              src={project.videoUrl!}
              cue={currentCue}
              loopEnabled={loopEnabled}
              playbackRate={playbackRate}
              mediaType={project.mediaType}
              title={project.title}
            />

            <div className="mt-4 flex w-full items-center justify-between px-2 text-white">
              <button
                onClick={handlePrev}
                disabled={currentCueIndex === 0}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
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
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className="z-10 w-1 flex-shrink-0 cursor-col-resize bg-gray-300 transition-colors hover:bg-blue-400"
          onMouseDown={() => setIsResizing(true)}
        ></div>

        <div
          style={{ width: rightPanelWidth }}
          className="z-0 flex h-full flex-shrink-0 flex-col border-l border-gray-200 bg-white"
        >
          <div className="flex-shrink-0" style={{ minHeight: '300px' }}>
            <DictationArea
              cue={currentCue}
              onCorrect={handleMarkCorrect}
              onPeek={() => {}}
              onNextSentence={handleNext}
            />
          </div>

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
