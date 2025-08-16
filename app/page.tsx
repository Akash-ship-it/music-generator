// app/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { AudioWaveform, Sparkles, Zap, Headphones, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import GenerationSection from "@/components/GenerationSection";
import MusicPlayer from "@/components/MusicPlayer";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import ProTips from "@/components/ProTips";

import useStorage from "@/lib/useStorage";
import useGeneration from "@/lib/useGeneration";
import { GenerationConfig, GeneratedMusic, StoredMusic, GenerationRequestData } from "../types";

export default function MusicGeneratorPage() {
  const [activeTab, setActiveTab] = useState<"description" | "custom_lyrics" | "described_lyrics">("description");
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [config, setConfig] = useState<GenerationConfig>({
    audio_duration: 180,
    seed: -1,
    guidance_scale: 15,
    infer_step: 60,
    instrumental: false,
  });
  const [description, setDescription] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [lyrics, setLyrics] = useState<string>("");
  const [describedLyrics, setDescribedLyrics] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);

  // Update in app/page.tsx (hook call):
const { storedTracks, saveToStorage, clearAllTracks, confirmDeleteTrack } = useStorage(generatedMusic, setGeneratedMusic);
  const { isGenerating, handleGenerate } = useGeneration(
    activeTab,
    description,
    prompt,
    lyrics,
    describedLyrics,
    config,
    setGeneratedMusic,
    setError,
    setProgress,
    saveToStorage
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-32 h-32 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-fuchsia-950/30 to-cyan-950/40">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-32 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
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
              <span className="text-lg font-medium">
                ⭐ Project #2/52 - Solving Problems & Testing What People Actually Need ⭐
              </span>
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
          <div className="xl:col-span-3 space-y-8">
            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />}>
              <GenerationSection
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isGenerating={isGenerating}
                handleGenerate={handleGenerate}
                progress={progress}
                error={error}
                description={description}
                setDescription={setDescription}
                prompt={prompt}
                setPrompt={setPrompt}
                lyrics={lyrics}
                setLyrics={setLyrics}
                describedLyrics={describedLyrics}
                setDescribedLyrics={setDescribedLyrics}
              />
            </Suspense>

            {generatedMusic && (
              <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />}>
                <MusicPlayer generatedMusic={generatedMusic} />
              </Suspense>
            )}
          </div>

          <div className="xl:col-span-1 space-y-6">
            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />}>
              <SettingsPanel config={config} setConfig={setConfig} />
            </Suspense>

            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />}>
              <ProTips />
            </Suspense>

            {storedTracks.length > 0 && (
              <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />}>
                <HistoryPanel
                  storedTracks={storedTracks}
                  setGeneratedMusic={setGeneratedMusic}
                  generatedMusic={generatedMusic}
                  clearAllTracks={clearAllTracks}
                  confirmDeleteTrack={confirmDeleteTrack}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>

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