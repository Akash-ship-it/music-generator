"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer, lazy, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Pause,
  Download,
  Music,
  Wand2,
  Settings,
  Volume2,
  Clock,
  Shuffle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  AudioWaveform,
  Headphones,
  RotateCcw,
  Zap,
  Star,
  History,
  HelpCircle,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GenerateFromDescriptionRequest,
  generateMusic,
  GenerateWithCustomLyricsRequest,
  GenerateWithDescribedLyricsRequest,
  validateGenerationRequest,
} from "@/lib/api";
import Image from "next/image";

interface GenerationConfig {
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}

interface GeneratedMusic {
  cloudinary_url: string;
  cover_image_cloudinary_url: string;
  categories: string[];
  generationData?: GenerationRequestData;
}

interface StoredMusic extends GeneratedMusic {
  id: string;
  timestamp: number;
  title: string;
  type: string;
  generationData?: GenerationRequestData;
}

type GenerationRequestData =
  | GenerateFromDescriptionRequest
  | GenerateWithCustomLyricsRequest
  | GenerateWithDescribedLyricsRequest;

function MusicGeneratorPage() {
  // Define reducer for complex state management
  type PlayerState = {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
  };

  type PlayerAction =
    | { type: 'PLAY' }
    | { type: 'PAUSE' }
    | { type: 'SET_CURRENT_TIME'; payload: number }
    | { type: 'SET_DURATION'; payload: number }
    | { type: 'SET_VOLUME'; payload: number };

  const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
    switch (action.type) {
      case 'PLAY':
        return { ...state, isPlaying: true };
      case 'PAUSE':
        return { ...state, isPlaying: false };
      case 'SET_CURRENT_TIME':
        return { ...state, currentTime: action.payload };
      case 'SET_DURATION':
        return { ...state, duration: action.payload };
      case 'SET_VOLUME':
        return { ...state, volume: action.payload };
      default:
        return state;
    }
  };

  // State management
  const [activeTab, setActiveTab] = useState("description");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<StoredMusic | null>(null);

  // Use reducer for player state
  const [playerState, dispatchPlayerAction] = useReducer(playerReducer, {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7
  });

  // Audio ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Form states
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [describedLyrics, setDescribedLyrics] = useState("");
  const [storedTracks, setStoredTracks] = useState<StoredMusic[]>([]);

  // 2. Add these constants after your existing state declarations
  const STORAGE_KEY = "generated_music_tracks";
  const MAX_STORED_TRACKS = 10; // Limit storage to prevent overflow

  const saveToStorage = (
    music: GeneratedMusic,
    type: string,
    generationData: GenerationRequestData
  ) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("LocalStorage not available");
        return;
      }

      const existingTracks = getFromStorage();
      const newTrack: StoredMusic = {
        ...music,
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: generateTrackTitle(type, generationData),
        type,
        generationData,
      };

      const updatedTracks = [newTrack, ...existingTracks].slice(
        0,
        MAX_STORED_TRACKS
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracks));
      setStoredTracks(updatedTracks);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  const getFromStorage = (): StoredMusic[] => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return [];
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return [];
    }
  };

  const generateTrackTitle = (type: string, data: GenerationRequestData): string => {
    const timestamp = new Date().toLocaleString();
    switch (type) {
      case "description":
        return `${(data as GenerateFromDescriptionRequest).full_described_song?.slice(0, 30)}... - ${timestamp}`;
      case "custom_lyrics":
        return `${(data as GenerateWithCustomLyricsRequest).prompt?.slice(0, 30)}... - ${timestamp}`;
      case "described_lyrics":
        return `${(data as GenerateWithDescribedLyricsRequest).prompt?.slice(0, 30)}... - ${timestamp}`;
      default:
        return `Generated Track - ${timestamp}`;
    }
  };

  // Optimized track loading with preloading
  const loadStoredTrack = useCallback((track: StoredMusic) => {
    setGeneratedMusic(track);
    // Reset player state using reducer
    dispatchPlayerAction({ type: 'PAUSE' });
    dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: 0 });
    dispatchPlayerAction({ type: 'SET_DURATION', payload: 0 });

    // Preload audio in background
    if (audioRef.current) {
      // Set preload attribute for better performance
      audioRef.current.preload = 'metadata';

      // After metadata is loaded, preload the actual audio content
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          audioRef.current.preload = 'auto';
        }
      };
    }

    // Optional: scroll to the music player section with optimized animation
    requestAnimationFrame(() => {
      const musicPlayerElement = document.getElementById("music-player");
      if (musicPlayerElement) {
        musicPlayerElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, []);

  // Add these functions after the existing storage functions

  const confirmDeleteTrack = useCallback((trackId: string) => {

    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("LocalStorage not available");
        return;
      }

      const existingTracks = getFromStorage();
      const updatedTracks = existingTracks.filter(track => track.id !== trackId);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracks));
      setStoredTracks(updatedTracks);

      // If the deleted track was currently playing, clear the player
      if (generatedMusic && 'id' in generatedMusic && generatedMusic.id === trackId) {
        setGeneratedMusic(null);
        dispatchPlayerAction({ type: 'PAUSE' });
        dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: 0 });
      }

      setTrackToDelete(null); // Close dialog
    } catch (error) {
      console.error("Failed to delete track:", error);
      setError("Failed to delete track. Please try again.");
    }
  }, [generatedMusic]);


  const clearAllTracks = useCallback(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("LocalStorage not available");
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setStoredTracks([]);

      // Clear currently playing track if any
      setGeneratedMusic(null);
      dispatchPlayerAction({ type: 'PAUSE' });
      dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: 0 });
    } catch (error) {
      console.error("Failed to clear tracks:", error);
      setError("Failed to clear history. Please try again.");
    }
  }, []);

  // Generation config
  const [config, setConfig] = useState<GenerationConfig>({
    audio_duration: 180,
    seed: -1,
    guidance_scale: 15,
    infer_step: 60,
    instrumental: false,
  });

  // Performance monitoring (optional)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 16) { // Longer than 1 frame
            console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    const tracks = getFromStorage();
    setStoredTracks(tracks);

    // If there are stored tracks and no current music, load the most recent one
    // if (tracks.length > 0 && !generatedMusic) {
    //   setGeneratedMusic(tracks[0]);
    // }
  }, []);

  // Audio event handlers with optimized event listeners and throttling
  // Audio event handlers with optimized event listeners and throttling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Optimize audio performance
    if ('preload' in audio) {
      audio.preload = 'metadata';
    }

    // Use throttled event handlers for better performance
    let timeUpdateFrame: number;

    // Memoize handlers to prevent recreation
    const updateTime = () => {
      if (!audio) return;
      cancelAnimationFrame(timeUpdateFrame);
      timeUpdateFrame = requestAnimationFrame(() => {
        if (audio && !audio.paused) {
          dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
        }
      });
    };

    const updateDuration = () => {
      if (audio && audio.duration && !isNaN(audio.duration)) {
        dispatchPlayerAction({ type: 'SET_DURATION', payload: audio.duration });
      }
    };

    const handleEnded = () => {
      dispatchPlayerAction({ type: 'PAUSE' });
      dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: 0 });
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      dispatchPlayerAction({ type: 'PAUSE' });
    };

    // Use passive event listeners for better performance
    audio.addEventListener("timeupdate", updateTime, { passive: true });
    audio.addEventListener("loadedmetadata", updateDuration, { passive: true });
    audio.addEventListener("ended", handleEnded, { passive: true });
    audio.addEventListener("error", handleError, { passive: true });

    // Set volume safely
    if (audio.volume !== playerState.volume) {
      audio.volume = Math.max(0, Math.min(1, playerState.volume));
    }

    return () => {
      cancelAnimationFrame(timeUpdateFrame);
      if (audio) {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      }
    };
  }, [generatedMusic?.cloudinary_url, playerState.volume]); // More specific dependency

  // Original function replaced with memoized version above

  // Original function replaced with memoized version above

  // Original function replaced with memoized version above

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Original function replaced with memoized version above

  // Original function replaced with memoized version above

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Simulate progress with better error handling
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 1000);

    try {
      let requestData: GenerationRequestData;
      let type: "description" | "custom_lyrics" | "described_lyrics";

      // Determine request data based on active tab with enhanced error messages
      switch (activeTab) {
        case "description":
          type = "description";
          if (!description.trim()) {
            throw new Error("🎵 Aika needs your creative vision! Paint your musical idea with words - the more vivid, the better your track will be.");
          }
          if (description.trim().length < 10) {
            throw new Error("🎨 Give Aika more details to work with! A richer description creates more amazing music.");
          }
          requestData = {
            full_described_song: description.trim(),
            ...config,
          } as GenerateFromDescriptionRequest;
          break;

        case "custom_lyrics":
          type = "custom_lyrics";
          if (!prompt.trim()) {
            throw new Error("🎼 Aika needs to know the musical style! Tell me what genre or vibe you're going for (e.g., 'dreamy indie pop', 'energetic rock').");
          }
          if (!lyrics.trim()) {
            throw new Error("✍️ Aika is ready to compose, but where are your lyrics? Share your words and I'll turn them into music!");
          }
          if (lyrics.trim().length < 20) {
            throw new Error("📝 Your lyrics are a bit short! Give Aika more content to work with for a fuller musical experience.");
          }
          requestData = {
            prompt: prompt.trim(),
            lyrics: lyrics.trim(),
            ...config,
          } as GenerateWithCustomLyricsRequest;
          break;

        case "described_lyrics":
          type = "described_lyrics";
          if (!prompt.trim()) {
            throw new Error("🎵 Aika needs the musical direction! Describe the style, tempo, or mood you want (e.g., 'upbeat electronic dance', 'mellow acoustic folk').");
          }
          if (!describedLyrics.trim()) {
            throw new Error("💭 What story should Aika tell through lyrics? Describe the theme, emotion, or message you want to convey.");
          }
          if (describedLyrics.trim().length < 15) {
            throw new Error("🎭 Give Aika more context about your lyrical concept! The richer your description, the better your song will be.");
          }
          requestData = {
            prompt: prompt.trim(),
            described_lyrics: describedLyrics.trim(),
            ...config,
          } as GenerateWithDescribedLyricsRequest;
          break;

        default:
          throw new Error("🤔 Aika is confused! Please select a generation method (Description, Custom Lyrics, or AI Lyrics) to get started.");
      }

      // Additional validation with friendly messages
      if (!validateGenerationRequest(type, requestData)) {
        throw new Error("🔍 Aika double-checked your input and something seems off. Please review your details and try again!");
      }

      // Validate config parameters with helpful messages
      if (config.audio_duration < 30 || config.audio_duration > 300) {
        throw new Error("⏱️ Aika works best with durations between 30 seconds and 5 minutes. Please adjust the duration slider!");
      }

      if (config.guidance_scale < 1 || config.guidance_scale > 20) {
        throw new Error("🎨 The creativity setting seems out of range! Keep it between 1-20 for best results.");
      }

      if (config.infer_step < 20 || config.infer_step > 100) {
        throw new Error("⚙️ Quality setting should be between 20-100 steps. Lower is faster, higher is better quality!");
      }

      // Use the API function with timeout and enhanced error handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Aika is taking longer than usual! This might be due to high demand. Please try again in a moment - your creativity is worth the wait!")), 300000) // 5 minutes
      );

      const result = await Promise.race([
        generateMusic(type, requestData),
        timeoutPromise
      ]) as GeneratedMusic;

      // Enhanced result validation
      if (!result) {
        throw new Error("🎵 Aika encountered an unexpected issue while creating your music. This happens sometimes during my learning process - please try again!");
      }

      if (!result.cloudinary_url) {
        throw new Error("🎼 Aika generated something but couldn't create the audio file properly. Let's try again - sometimes the second attempt works perfectly!");
      }

      if (!result.cover_image_cloudinary_url) {
        console.warn("Cover image not generated, but audio is available");
        // Don't throw error, just log warning since audio is more important
      }

      // Success! Set the generated music
      setGeneratedMusic(result);
      saveToStorage(result, type, requestData);
      setProgress(100);

      // Show success message briefly
      setTimeout(() => {
        setError(null);
      }, 100);

      // Auto-scroll to player after generation with success message
      setTimeout(() => {
        const playerElement = document.getElementById("music-player");
        playerElement?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);

    } catch (err) {
      console.error("Aika music generation error:", err);

      // Enhanced error handling with more specific messages
      let errorMessage = "🎵 Aika encountered an unexpected issue. This is project #2 in my learning journey - these hiccups help me improve!";

      if (err instanceof Error) {
        // If it's one of our custom error messages, use it directly
        if (err.message.includes('🎵') || err.message.includes('🎼') || err.message.includes('✍️') ||
          err.message.includes('💭') || err.message.includes('🎨') || err.message.includes('🤔') ||
          err.message.includes('🔍') || err.message.includes('⏱️') || err.message.includes('⚙️') ||
          err.message.includes('⏰')) {
          errorMessage = err.message;
        } else {
          // Handle specific API errors with friendly messages
          const message = err.message.toLowerCase();

          if (message.includes('network') || message.includes('fetch')) {
            errorMessage = "🌐 Aika can't connect to the music generation servers right now. Check your internet connection and try again!";
          } else if (message.includes('timeout')) {
            errorMessage = "⏰ Aika is taking longer than usual - probably high demand! Give it another try in a moment.";
          } else if (message.includes('rate limit') || message.includes('too many requests')) {
            errorMessage = "🚦 Aika is getting lots of requests right now! Wait a minute and try again - popularity is a good problem to have!";
          } else if (message.includes('invalid') || message.includes('bad request')) {
            errorMessage = "📝 Aika didn't understand the request format. This might be a bug in my code - thanks for helping me test project #2!";
          } else if (message.includes('unauthorized') || message.includes('forbidden')) {
            errorMessage = "🔐 Aika hit an authentication issue. This is on my end - I'm still figuring out the backend deployment!";
          } else if (message.includes('server error') || message.includes('internal error')) {
            errorMessage = "🔧 Aika's servers are having a moment. These growing pains are part of building in public - try again soon!";
          } else {
            // Generic friendly error with build-in-public context
            errorMessage = `🎵 Aika hit a snag: "${err.message}". Building project #2 of 52 means lots of learning from these moments!`;
          }
        }
      }

      setError(errorMessage);

      // Add some helpful suggestions based on common issues
      setTimeout(() => {
        if (errorMessage.includes('connect') || errorMessage.includes('network')) {
          setError(prev => prev + " 💡 Tip: Try refreshing the page if the issue persists.");
        } else if (errorMessage.includes('timeout') || errorMessage.includes('longer than usual')) {
          setError(prev => prev + " 💡 Tip: Try generating a shorter track first, then work up to longer ones.");
        }
      }, 2000);

    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      // Delay reset for better UX - let users read any error messages
      setTimeout(() => {
        if (!error) {
          setProgress(0);
        }
      }, 1000);
    }
  };

  // Extract HistoryPanel to be loaded lazily
  // Replace the existing HistoryPanel component with this updated version:

  // Replace the existing HistoryPanel component with this updated version:

  const HistoryPanel = React.memo(() => (
    <>
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
              <History className="w-5 h-5 text-violet-400" />
              Track History ({storedTracks.length})
            </CardTitle>
            {storedTracks.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={clearAllTracks}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                    <p>Clear all history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {storedTracks.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No tracks generated yet
            </p>
          ) : (
            storedTracks.map((track) => (
              <div
                key={track.id}
                className="relative p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
              >
                {/* Main clickable area for playing track */}
                <div
                  className="cursor-pointer pr-10" // Add right padding for delete button
                  onClick={() => loadStoredTrack(track)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Image
                        src={track.cover_image_cloudinary_url}
                        alt="Track cover"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      {/* Play indicator overlay */}
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="text-white font-medium text-sm leading-tight mb-1 truncate">
                        {track.title.split(' - ')[0]}...
                      </h4>
                      <p className="text-slate-400 text-xs mb-2 truncate">
                        {new Date(track.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {track.categories.slice(0, 2).map((cat, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs border-violet-500/30 text-violet-300 px-1.5 py-0.5 truncate max-w-20"
                          >
                            {cat.length > 8 ? cat.slice(0, 8) + '...' : cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete button - always visible but subtle */}
                <div className="absolute top-2 right-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackToDelete(track);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-all duration-200 rounded-md opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                        <p>Delete track</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Currently playing indicator */}
                {generatedMusic && 'id' in generatedMusic && generatedMusic.id === track.id && (
                  <div className="absolute left-2 top-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">Playing</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {trackToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="bg-slate-800 border-slate-600 max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Are you sure you want to delete this track? This action cannot be undone.
              </p>
              <div className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-lg">
                <strong>Track:</strong> {trackToDelete.title.split(' - ')[0]}...
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setTrackToDelete(null)}
                  className="text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => confirmDeleteTrack(trackToDelete.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Track
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  ));

  HistoryPanel.displayName = 'HistoryPanel';


  // Create lazy-loaded components
  const LazyHistoryPanel = useMemo(() => React.lazy(() =>
    Promise.resolve({ default: HistoryPanel })
  ), [storedTracks.length]); // Proper dependency

  // Use useCallback for event handlers with reducer
  const memoizedTogglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playerState.isPlaying) {
      audio.pause();
      dispatchPlayerAction({ type: 'PAUSE' });
    } else {
      audio.play().catch(e => console.error('Error playing audio:', e));
      dispatchPlayerAction({ type: 'PLAY' });
    }
  }, [playerState.isPlaying]);

  const memoizedHandleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    dispatchPlayerAction({ type: 'SET_CURRENT_TIME', payload: value[0] });
  }, []);

  const memoizedHandleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    dispatchPlayerAction({ type: 'SET_VOLUME', payload: newVolume });
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const memoizedGenerateRandomSeed = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000000),
    }));
  }, []);

  const memoizedDownloadAudio = useCallback(() => {
    if (!generatedMusic?.cloudinary_url) {
      console.warn('No audio URL available for download');
      return;
    }

    const link = document.createElement("a");
    link.href = generatedMusic.cloudinary_url;
    link.download = "generated-music.wav";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedMusic]);

  const memoizedResetConfig = useCallback(() => {
    setConfig({
      audio_duration: 180,
      seed: -1,
      guidance_scale: 15,
      infer_step: 60,
      instrumental: false,
    });
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-fuchsia-950/30 to-cyan-950/40">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-32 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 backdrop-blur-sm border border-violet-500/20 mb-6">
            <AudioWaveform className="w-12 h-12 text-violet-400 animate-pulse" />
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                Aika
              </span>
              <br />
              <span className="text-white/90">AI Music Generator</span>
            </h1>

            <div className="flex items-center justify-center gap-2 text-violet-300">
              {/* <Star className="w-5 h-5 fill-current" /> */}
              <span className="text-lg font-medium">
                ⭐ Project #2/52 - Solving Problems & Testing What People Actually Need ⭐
              </span>
              {/* <Star className="w-5 h-5 fill-current" /> */}
            </div>

            <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Transform any idea into professional music tracks using AI. Follow my 52-week journey of building real solutions and discovering which projects deserve to become meaningful businesses.

            </p>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Instant Generation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-medium">Studio Quality</span>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Enhanced Generation Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  Create Your Aika Track
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg">
                  Choose your preferred method and let AI craft your perfect
                  track
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-sm p-1">
                    <TabsTrigger
                      value="description"
                      className="text-white data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      From Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="custom_lyrics"
                      className="text-white data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Custom Lyrics
                    </TabsTrigger>
                    <TabsTrigger
                      value="described_lyrics"
                      className="text-white data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      AI Lyrics
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-16 md:mt-8">
                    <TabsContent value="description" className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="description"
                          className="text-white text-lg font-semibold flex items-center gap-2"
                        >
                          <Music className="w-5 h-5 text-violet-400" />
                          Describe Your Vision
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your musical vision in detail... (e.g., 'An upbeat indie-pop song with dreamy vocals, shimmering guitars, and a nostalgic 90s vibe perfect for summer road trips')"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[140px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-lg resize-none focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="custom_lyrics" className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="prompt"
                          className="text-white text-lg font-semibold flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 text-violet-400" />
                          Musical Style
                        </Label>
                        <Input
                          id="prompt"
                          placeholder="e.g., dreamy indie pop with reverb, heavy metal with soaring guitars, chill lo-fi hip hop beats"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-lg h-14 focus:border-violet-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="lyrics"
                          className="text-white text-lg font-semibold flex items-center gap-2"
                        >
                          <AudioWaveform className="w-5 h-5 text-violet-400" />
                          Your Lyrics
                        </Label>
                        <Textarea
                          id="lyrics"
                          placeholder="Pour your heart into lyrics... Use [Verse], [Chorus], [Bridge] tags. Example:
[Verse]
Walking down the empty street tonight
[Chorus] 
This is where the magic happens..."
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-lg resize-none focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="described_lyrics" className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="prompt"
                          className="text-white text-lg font-semibold flex items-center gap-2"
                        >
                          <Zap className="w-5 h-5 text-violet-400" />
                          Musical Style
                        </Label>
                        <Input
                          id="prompt"
                          placeholder="e.g., upbeat electronic dance, 128 BPM, festival anthem"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-lg h-14 focus:border-violet-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="described_lyrics"
                          className="text-white text-lg font-semibold flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 text-violet-400" />
                          Lyrics Concept
                        </Label>
                        <Textarea
                          id="described_lyrics"
                          placeholder="Describe the story, theme, or emotion you want the lyrics to convey... (e.g., 'A song about overcoming challenges and rising stronger, with themes of resilience and hope')"
                          value={describedLyrics}
                          onChange={(e) => setDescribedLyrics(e.target.value)}
                          className="min-h-[140px] bg-white/5 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm text-lg resize-none focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Enhanced Generate Button */}
                <div className="pt-6">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-16 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-cyan-700 text-white text-xl font-bold shadow-xl shadow-violet-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.02] disabled:scale-100 disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Crafting Your Masterpiece...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6 mr-3" />
                        Create with Aika
                        <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-medium">
                          Creating your unique track...
                        </span>
                        <span className="font-bold text-violet-300">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-3 bg-white/10" />
                      <div className="text-center text-slate-400 text-sm">
                        <span className="animate-pulse">
                          🎵 Aika is composing • Generating lyrics • Creating melodies • Mixing audio 🎵
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Error Display */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-200 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-lg">{error}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Music Player */}
            {generatedMusic && (
              <Card
                id="music-player"
                className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    Your Generated Masterpiece
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Enhanced Cover Art Section */}
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
                      <h3 className="text-white text-2xl font-bold">
                        Your Aika Creation
                      </h3>
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

                  {/* Enhanced Audio Controls with optimized audio element */}
                  <div className="space-y-6">
                    <audio
                      ref={audioRef}
                      src={generatedMusic.cloudinary_url}
                      preload="metadata"
                      onLoadedMetadata={() => {
                        // Once metadata is loaded, preload the actual audio content
                        if (audioRef.current) {
                          audioRef.current.preload = 'auto';
                        }
                      }}
                    />

                    {/* Play Controls */}
                    <div className="flex items-center gap-6">
                      <Button
                        onClick={memoizedTogglePlayPause}
                        size="lg"
                        className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                      >
                        {playerState.isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8" />
                        )}
                      </Button>

                      <Button
                        onClick={memoizedDownloadAudio}
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 bg-white/5 border-white/20 text-white hover:bg-white hover:border-white/30 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Download Track
                      </Button>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-3">
                      <Slider
                        value={[playerState.currentTime]}
                        min={0}
                        max={playerState.duration || 100}
                        step={0.1}
                        onValueChange={memoizedHandleSeek}
                        className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-fuchsia-400 [&>span:first-child>span]:to-pink-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-fuchsia-500/20"
                      />
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>{formatTime(playerState.currentTime)}</span>
                        <span>{formatTime(playerState.duration)}</span>
                      </div>
                    </div>

                    {/* Enhanced Volume Control */}
                    <div className="flex items-center gap-4 max-w-xs">
                      <Volume2 className="w-5 h-5 text-slate-300" />
                      <Slider
                        value={[playerState.volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={memoizedHandleVolumeChange}
                        className="flex-1 [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-orange-400 [&>span:first-child>span]:to-amber-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-orange-500/20"
                      />
                      <span className="text-slate-400 text-sm min-w-[3rem]">
                        {Math.round(playerState.volume * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Settings Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl sticky top-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      Fine-tune
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Customize your generation parameters
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={memoizedResetConfig}
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                        <p>Reset all parameters to default</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Duration */}
                <div className="space-y-4">
                  <Label className="text-white font-semibold flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-violet-400" />
                    Duration:{" "}
                    <span className="text-violet-300">
                      {config.audio_duration}s
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Set the length of your generated track. Longer
                            durations create more complete songs but take more
                            time to generate.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Slider
                    value={[config.audio_duration]}
                    min={30}
                    max={300}
                    step={10}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        audio_duration: value[0],
                      }))
                    }
                    className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-cyan-400 [&>span:first-child>span]:to-blue-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-cyan-500/20"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>30s</span>
                    <span>5min</span>
                  </div>
                </div>

                {/* Guidance Scale */}
                <div className="space-y-4">
                  <Label className="text-white font-semibold flex items-center gap-2 text-base">
                    Creativity:{" "}
                    <span className="text-violet-300">
                      {config.guidance_scale}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Controls how closely the AI follows your prompt.
                            Lower values stick closer to your description,
                            higher values allow more creative interpretation.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Slider
                    value={[config.guidance_scale]}
                    min={1}
                    max={20}
                    step={0.5}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        guidance_scale: value[0],
                      }))
                    }
                    className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-violet-400 [&>span:first-child>span]:to-purple-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-violet-500/20"
                  />

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Inference Steps */}
                <div className="space-y-4">
                  <Label className="text-white font-semibold flex items-center gap-2 text-base">
                    Quality:{" "}
                    <span className="text-violet-300">{config.infer_step}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Higher values produce better quality audio but take
                            longer to generate. 60+ recommended for final
                            tracks.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Slider
                    value={[config.infer_step]}
                    min={20}
                    max={100}
                    step={5}
                    onValueChange={(value) =>
                      setConfig((prev) => ({ ...prev, infer_step: value[0] }))
                    }
                    className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-emerald-400 [&>span:first-child>span]:to-green-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-emerald-500/20"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Fast</span>
                    <span>Premium</span>
                  </div>
                </div>

                {/* Seed */}
                <div className="space-y-4">
                  <Label className="text-white font-semibold flex items-center gap-2 text-base">
                    <Shuffle className="w-4 h-4 text-violet-400" />
                    Seed
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Random number that controls variation. Use the same
                            seed to reproduce similar results, or -1 for random
                            generation.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={config.seed}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          seed: parseInt(e.target.value) || -1,
                        }))
                      }
                      className="flex-1 bg-white/5 border-white/20 text-white h-12 focus:border-violet-400 focus:ring-violet-400/20"
                      placeholder="Random"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={memoizedGenerateRandomSeed}
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                          <p>Generate random seed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Instrumental Toggle */}
                <div className="space-y-3">
                  <Label className="text-white font-semibold flex items-center gap-2 text-base">
                    <Headphones className="w-4 h-4 text-violet-400" />
                    Audio Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-2" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Choose between instrumental music (no vocals) or full tracks with singing.
                            Perfect for background music or complete songs.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/3 border border-white/10 hover:border-white/20 hover:from-white/8 hover:to-white/5 transition-all duration-200 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${config.instrumental ? 'bg-orange-400' : 'bg-violet-400'}`}></div>
                      <span className="text-slate-300 font-medium">
                        {config.instrumental ? 'Instrumental only' : 'With vocals'}
                      </span>
                    </div>

                    <Switch
                      checked={config.instrumental}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          instrumental: checked,
                        }))
                      }
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-amber-500 data-[state=unchecked]:bg-gradient-to-r data-[state-unchecked]:from-violet-500 data-[state=unchecked]:to-fuchsia-500 transition-all duration-200 shadow-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips Card */}
            <Card className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border-violet-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-slate-300 text-sm space-y-2">
                  <p>💡 Be specific with genres and emotions for better results</p>
                  <p>⏱️ Higher quality settings = longer generation time</p>
                  <p>🎵 Use [Verse], [Chorus], [Bridge] tags in custom lyrics</p>
                  <p>🎲 Try different seeds for unique variations</p>
                  <p>🚀 This is project #2/52 - your feedback shapes what I build next!</p>
                </div>
              </CardContent>
            </Card>
            {storedTracks.length > 0 && (
              <Suspense fallback={
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                      <span className="text-slate-300">Loading history...</span>
                    </div>
                  </CardContent>
                </Card>
              }>
                <LazyHistoryPanel />
              </Suspense>
            )}
          </div>
        </div>
      </div>
      {/* Build in Public Footer */}
      <Card className="bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border-violet-500/20 backdrop-blur-xl mt-12">
        <CardContent className="p-8 text-center">
          <p className="text-slate-300 text-lg mb-4">
            👋 <strong>Building in Public:</strong> Aika is project #2 in my 52-week challenge
          </p>
          <p className="text-slate-400">
            Some projects will fail, some will teach me invaluable lessons, and hopefully a few will solve real problems worth turning into businesses.
            <span className="text-violet-300 font-semibold"> What do you think of Aika?</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Use proper typing for React.memo
export default React.memo(MusicGeneratorPage);