// components/MusicPlayer.tsx
import React, { useRef, useEffect, useReducer, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, CheckCircle, Volume2 } from "lucide-react";
import Image from "next/image";
import { GeneratedMusic } from "../types";

type PlayerState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
};

type PlayerAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_VOLUME"; payload: number };

const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case "PLAY":
      return { ...state, isPlaying: true };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_VOLUME":
      return { ...state, volume: action.payload };
    default:
      return state;
  }
};

interface MusicPlayerProps {
  generatedMusic: GeneratedMusic;
}

const MusicPlayer = React.memo((props: MusicPlayerProps) => {
  const { generatedMusic } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerState, dispatchPlayerAction] = useReducer(playerReducer, {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = "metadata";

    const updateTime = () => {
      dispatchPlayerAction({ type: "SET_CURRENT_TIME", payload: audio.currentTime });
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        dispatchPlayerAction({ type: "SET_DURATION", payload: audio.duration });
      }
    };

    const handleEnded = () => {
      dispatchPlayerAction({ type: "PAUSE" });
      dispatchPlayerAction({ type: "SET_CURRENT_TIME", payload: 0 });
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      dispatchPlayerAction({ type: "PAUSE" });
    };

    audio.addEventListener("timeupdate", updateTime, { passive: true });
    audio.addEventListener("loadedmetadata", updateDuration, { passive: true });
    audio.addEventListener("ended", handleEnded, { passive: true });
    audio.addEventListener("error", handleError, { passive: true });

    audio.volume = playerState.volume;

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [generatedMusic.cloudinary_url, playerState.volume]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playerState.isPlaying) {
      audio.pause();
      dispatchPlayerAction({ type: "PAUSE" });
    } else {
      audio.play().catch((e) => console.error("Error playing audio:", e));
      dispatchPlayerAction({ type: "PLAY" });
    }
  }, [playerState.isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    dispatchPlayerAction({ type: "SET_CURRENT_TIME", payload: value[0] });
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    dispatchPlayerAction({ type: "SET_VOLUME", payload: newVolume });
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const downloadAudio = useCallback(() => {
    if (!generatedMusic.cloudinary_url) return;

    window.open(generatedMusic.cloudinary_url, '_blank');
  }, [generatedMusic.cloudinary_url]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card id="music-player" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
          <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          Your Generated Masterpiece
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex gap-6 items-start">
          <div className="relative group">
            <Image
              src={generatedMusic.cover_image_cloudinary_url}
              alt="Album Cover"
              width={128}
              height={128}
              className="w-32 h-32 rounded-2xl object-cover shadow-2xl transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="text-white text-2xl font-bold">Your Aika Creation</h3>
            <div className="flex flex-wrap gap-2">
              {generatedMusic.categories.map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-300 border border-violet-500/30 px-4 py-2 text-sm font-medium"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={generatedMusic.cloudinary_url} preload="auto" />

        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Button
              onClick={togglePlayPause}
              size="lg"
              className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            >
              {playerState.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>

            <Button
              onClick={downloadAudio}
              variant="outline"
              size="lg"
              className="h-12 px-8 bg-white/5 border-white/20 text-white hover:bg-white hover:border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
            >
              <Download className="w-5 h-5 mr-3" />
              Download Track
            </Button>
          </div>

          <div className="space-y-3">
            <Slider
              value={[playerState.currentTime]}
              min={0}
              max={playerState.duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-fuchsia-400 [&>span:first-child>span]:to-pink-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-fuchsia-500/20"
            />
            <div className="flex justify-between text-slate-300 font-medium">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 max-w-xs">
            <Volume2 className="w-5 h-5 text-slate-300" />
            <Slider
              value={[playerState.volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1 [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-orange-400 [&>span:first-child>span]:to-amber-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-orange-500/20"
            />
            <span className="text-slate-400 text-sm min-w-[3rem]">{Math.round(playerState.volume * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MusicPlayer.displayName = 'MusicPlayer';

export default MusicPlayer;