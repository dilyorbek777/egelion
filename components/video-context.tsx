"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";

type VideoContextType = {
  playingVideoId: string | null;
  setPlayingVideo: (id: string | null) => void;
  registerVideo: (id: string, pauseFn: () => void) => void;
  unregisterVideo: (id: string) => void;
};

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, () => void>>(new Map());
  const pendingPauseId = useRef<string | null>(null);

  useEffect(() => {
    if (pendingPauseId.current) {
      const idToKeep = pendingPauseId.current;
      pendingPauseId.current = null;
      // Pause all videos except the one that should be playing
      videoRefs.current.forEach((pauseFn, videoId) => {
        if (videoId !== idToKeep) {
          pauseFn();
        }
      });
    }
  });

  const registerVideo = useCallback((id: string, pauseFn: () => void) => {
    videoRefs.current.set(id, pauseFn);
  }, []);

  const unregisterVideo = useCallback((id: string) => {
    videoRefs.current.delete(id);
  }, []);

  const setPlayingVideo = useCallback((id: string | null) => {
    setPlayingVideoId(id);
    if (id) {
      pendingPauseId.current = id;
    }
  }, []);

  return (
    <VideoContext.Provider
      value={{
        playingVideoId,
        setPlayingVideo,
        registerVideo,
        unregisterVideo,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within VideoProvider");
  }
  return context;
}
