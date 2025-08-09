"use client";

import React, { useState, useRef, useEffect } from "react";
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

export default function MusicGeneratorPage() {
  // State management
  const [activeTab, setActiveTab] = useState("description");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

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

  const loadStoredTrack = (track: StoredMusic) => {
    setGeneratedMusic(track);
    // Reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Optional: scroll to the music player section
    setTimeout(() => {
      const musicPlayerElement = document.getElementById("music-player");
      if (musicPlayerElement) {
        musicPlayerElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Generation config
  const [config, setConfig] = useState<GenerationConfig>({
    audio_duration: 180,
    seed: -1,
    guidance_scale: 15,
    infer_step: 60,
    instrumental: false,
  });

  useEffect(() => {
    setIsClient(true);
    const tracks = getFromStorage();
    setStoredTracks(tracks);

    // If there are stored tracks and no current music, load the most recent one
    // if (tracks.length > 0 && !generatedMusic) {
    //   setGeneratedMusic(tracks[0]);
    // }
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.volume = volume;

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [generatedMusic, volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const generateRandomSeed = () => {
    setConfig((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000000),
    }));
  };

  const downloadAudio = () => {
    if (generatedMusic?.cloudinary_url) {
      // Create download link without navigating away
      const link = document.createElement("a");
      link.href = generatedMusic.cloudinary_url;
      link.download = "generated-music.wav";
      link.target = "_blank"; // Open in new tab to prevent navigation
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 1000);

    try {
      let requestData: GenerationRequestData;
      let type: "description" | "custom_lyrics" | "described_lyrics";

      // Determine request data based on active tab
      switch (activeTab) {
        case "description":
          type = "description";
          requestData = {
            full_described_song: description,
            ...config,
          } as GenerateFromDescriptionRequest;

          // Validate request
          if (!validateGenerationRequest(type, requestData)) {
            throw new Error("Please provide a description");
          }
          break;

        case "custom_lyrics":
          type = "custom_lyrics";
          requestData = {
            prompt,
            lyrics,
            ...config,
          } as GenerateWithCustomLyricsRequest;

          // Validate request
          if (!validateGenerationRequest(type, requestData)) {
            throw new Error("Please provide both prompt and lyrics");
          }
          break;

        case "described_lyrics":
          type = "described_lyrics";
          requestData = {
            prompt,
            described_lyrics: describedLyrics,
            ...config,
          } as GenerateWithDescribedLyricsRequest;

          // Validate request
          if (!validateGenerationRequest(type, requestData)) {
            throw new Error(
              "Please provide both prompt and lyrics description"
            );
          }
          break;

        default:
          throw new Error("Invalid generation type");
      }

      // Use the API function instead of direct fetch
      const result = await generateMusic(type, requestData);
      setGeneratedMusic(result);
      saveToStorage(result, type, requestData);
      setProgress(100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const HistoryPanel = () => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
          <History className="w-5 h-5 text-violet-400" />
          Track History ({storedTracks.length})
        </CardTitle>
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
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => loadStoredTrack(track)}
            >
              <div className="flex items-start gap-3">
               <Image
  src={track.cover_image_cloudinary_url}
  alt="Track cover"
  width={48}
  height={48}
  className="w-12 h-12 rounded-lg object-cover"
/>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate text-sm">
                    {track.title}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {new Date(track.timestamp).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {track.categories.slice(0, 2).map((cat, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-violet-500/30 text-violet-300"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const resetConfig = () => {
    setConfig({
      audio_duration: 180,
      seed: -1,
      guidance_scale: 15,
      infer_step: 60,
      instrumental: false,
    });
  };

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
                AI Music
              </span>
              <br />
              <span className="text-white/90">Generator</span>
            </h1>

            <div className="flex items-center justify-center gap-2 text-violet-300">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-lg font-medium">
                Project #2 By Akash More
              </span>
              <Star className="w-5 h-5 fill-current" />
            </div>

            <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Transform your ideas into professional music tracks using
              cutting-edge AI technology. Create, customize, and export
              studio-quality audio in minutes.
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
                  Create Your Music
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg">
                  Choose your preferred method and let AI craft your perfect
                  track
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-sm p-1">
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

                  <div className="mt-8">
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
                          placeholder="Paint your musical vision with words... (e.g., 'An energetic synthwave track with 80s nostalgia, driving beats, and ethereal vocals that captures the essence of neon-lit cityscapes')"
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
                          placeholder="e.g., dreamy indie pop, heavy metal, jazz fusion, lo-fi hip hop"
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
                          placeholder="Write your masterpiece here... Structure with [verse], [chorus], [bridge] tags for best results."
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
                        Generate Music
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
                          🎵 AI is composing • Generating lyrics • Creating
                          melodies • Mixing audio 🎵
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
                        AI Generated Track
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

                  {/* Enhanced Audio Controls */}
                  <div className="space-y-6">
                    <audio ref={audioRef} src={generatedMusic.cloudinary_url} />

                    {/* Play Controls */}
                    <div className="flex items-center gap-6">
                      <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8" />
                        )}
                      </Button>

                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 text-white hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 font-semibold"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Download Track
                      </Button>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-3">
                      <Slider
                        value={[currentTime]}
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="w-full [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-fuchsia-400 [&>span:first-child>span]:to-pink-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-fuchsia-500/20"
                      />
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Enhanced Volume Control */}
                    <div className="flex items-center gap-4 max-w-xs">
                      <Volume2 className="w-5 h-5 text-slate-300" />
                      <Slider
                        value={[volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="flex-1 [&>span:first-child]:bg-slate-700/50 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-orange-400 [&>span:first-child>span]:to-amber-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-orange-500/20"
                      />
                      <span className="text-slate-400 text-sm min-w-[3rem]">
                        {Math.round(volume * 100)}%
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
                          onClick={resetConfig}
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
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-1" />
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
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-1" />
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
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-1" />
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
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-1" />
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
                    <Button
                      onClick={generateRandomSeed}
                      variant="outline"
                      size="sm"
                      className="h-12 px-8 bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 text-white hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 font-semibold"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Instrumental Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-violet-400" />
                    Instrumental Only
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-violet-400 cursor-help ml-1" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            Generate music without vocals. Perfect for
                            background music, study tracks, or instrumental
                            versions.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="relative">
                    <Switch
                      checked={config.instrumental}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          instrumental: checked,
                        }))
                      }
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500 data-[state=unchecked]:bg-slate-600 transition-all duration-200"
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
                  <p>• Be specific with genres and emotions</p>
                  <p>• Higher quality = longer generation time</p>
                  <p>• Use [verse], [chorus] tags in lyrics</p>
                  <p>• Try different seeds for variations</p>
                </div>
              </CardContent>
            </Card>
            {storedTracks.length > 0 && <HistoryPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
