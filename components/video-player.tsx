"use client";

import { useRef, useEffect, useState } from "react";
import { useVideo } from "./video-context";
import { Play, VolumeX, Volume2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  postId: string;
}

export function VideoPlayer({ src, postId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { registerVideo, unregisterVideo, setPlayingVideo, playingVideoId, isMuted, setIsMuted } = useVideo();
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

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video entered viewport - play it
            video.play().then(() => {
              setIsPlaying(true);
              setPlayingVideo(postId);
            }).catch(() => {
              // Autoplay might be blocked, that's okay
            });
          } else {
            // Video left viewport - pause it
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.5, // Play when 50% of video is visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [postId, setPlayingVideo]);

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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full" onClick={handleClick}>
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[67vh] object-cover rounded-lg"
        onPlay={handlePlay}
        onPause={handlePause}
        autoPlay
        loop
        muted={isMuted}
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
      <button
        onClick={toggleMute}
        className="absolute top-18 right-4 z-30 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
