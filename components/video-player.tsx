"use client";

import { useRef, useEffect, useState } from "react";
import { useVideo } from "./video-context";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  postId: string;
}

export function VideoPlayer({ src, postId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { registerVideo, unregisterVideo, setPlayingVideo, playingVideoId } = useVideo();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  useEffect(() => {
    const pauseFn = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    registerVideo(postId, pauseFn);
    return () => unregisterVideo(postId);
  }, [postId, registerVideo, unregisterVideo]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setPlayingVideo(postId);
    } else {
      video.pause();
      setIsPlaying(false);
      setPlayingVideo(null);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setPlayingVideo(postId);
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playingVideoId === postId) {
      setPlayingVideo(null);
    }
  };

  return (
    <div className="relative w-full" onClick={handleClick}>
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[67vh] object-cover rounded-lg"
        onPlay={handlePlay}
        onPause={handlePause}
        playsInline
        preload="metadata"
      />
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-out">
          {isPlaying ? (
            <div className="bg-black/50 rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          ) : (
            <div className="bg-black/50 rounded-full p-4">
              <div className="w-8 h-8 border-l-4 border-white ml-1" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
