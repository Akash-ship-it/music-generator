// lib/useGeneration.ts
import { useState, useCallback } from "react";
import {
  GenerateFromDescriptionRequest,
  generateMusic,
  GenerateWithCustomLyricsRequest,
  GenerateWithDescribedLyricsRequest,
  validateGenerationRequest,
} from "@/lib/api";
import { GenerationConfig, GeneratedMusic, GenerationRequestData } from "../types";

const useGeneration = (
  activeTab: "description" | "custom_lyrics" | "described_lyrics",
  description: string,
  prompt: string,
  lyrics: string,
  describedLyrics: string,
  config: GenerationConfig,
  setGeneratedMusic: React.Dispatch<React.SetStateAction<GeneratedMusic | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  saveToStorage: (music: GeneratedMusic, type: string, generationData: GenerationRequestData) => void
) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 10));
    }, 1000);

    try {
      let requestData: GenerationRequestData;
      let type: "description" | "custom_lyrics" | "described_lyrics";

      switch (activeTab) {
        case "description":
          type = "description";
          if (!description.trim()) throw new Error("🎵 Aika needs your creative vision! Paint your musical idea with words - the more vivid, the better your track will be.");
          if (description.trim().length < 10) throw new Error("🎨 Give Aika more details to work with! A richer description creates more amazing music.");
          requestData = { full_described_song: description.trim(), ...config } as GenerateFromDescriptionRequest;
          break;

        case "custom_lyrics":
          type = "custom_lyrics";
          if (!prompt.trim()) throw new Error("🎼 Aika needs to know the musical style! Tell me what genre or vibe you're going for (e.g., 'dreamy indie pop', 'energetic rock').");
          if (!lyrics.trim()) throw new Error("✍️ Aika is ready to compose, but where are your lyrics? Share your words and I'll turn them into music!");
          if (lyrics.trim().length < 20) throw new Error("📝 Your lyrics are a bit short! Give Aika more content to work with for a fuller musical experience.");
          requestData = { prompt: prompt.trim(), lyrics: lyrics.trim(), ...config } as GenerateWithCustomLyricsRequest;
          break;

        case "described_lyrics":
          type = "described_lyrics";
          if (!prompt.trim()) throw new Error("🎵 Aika needs the musical direction! Describe the style, tempo, or mood you want (e.g., 'upbeat electronic dance', 'mellow acoustic folk').");
          if (!describedLyrics.trim()) throw new Error("💭 What story should Aika tell through lyrics? Describe the theme, emotion, or message you want to convey.");
          if (describedLyrics.trim().length < 15) throw new Error("🎭 Give Aika more context about your lyrical concept! The richer your description, the better your song will be.");
          requestData = { prompt: prompt.trim(), described_lyrics: describedLyrics.trim(), ...config } as GenerateWithDescribedLyricsRequest;
          break;

        default:
          throw new Error("🤔 Aika is confused! Please select a generation method (Description, Custom Lyrics, or AI Lyrics) to get started.");
      }

      if (!validateGenerationRequest(type, requestData)) {
        throw new Error("🔍 Aika double-checked your input and something seems off. Please review your details and try again!");
      }

      if (config.audio_duration < 30 || config.audio_duration > 300) {
        throw new Error("⏱️ Aika works best with durations between 30 seconds and 5 minutes. Please adjust the duration slider!");
      }

      if (config.guidance_scale < 1 || config.guidance_scale > 20) {
        throw new Error("🎨 The creativity setting seems out of range! Keep it between 1-20 for best results.");
      }

      if (config.infer_step < 20 || config.infer_step > 100) {
        throw new Error("⚙️ Quality setting should be between 20-100 steps. Lower is faster, higher is better quality!");
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Aika is taking longer than usual! This might be due to high demand. Please try again in a moment - your creativity is worth the wait!")), 300000)
      );

      const result = (await Promise.race([generateMusic(type, requestData), timeoutPromise])) as GeneratedMusic;

      if (!result || !result.cloudinary_url) {
        throw new Error("🎵 Aika encountered an unexpected issue while creating your music. This happens sometimes during my learning process - please try again!");
      }

      setGeneratedMusic(result);
      saveToStorage(result, type, requestData);
      setProgress(100);

      setTimeout(() => {
        const playerElement = document.getElementById("music-player");
        playerElement?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    } catch (err) {
      console.error("Generation error:", err);
      let errorMessage = "🎵 Aika encountered an unexpected issue. This is project #2 in my learning journey - these hiccups help me improve!";

      if (err instanceof Error) {
        errorMessage = err.message.includes("🎵") || err.message.includes("🎼") ? err.message : errorMessage;
      }

      setError(errorMessage);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  }, [activeTab, description, prompt, lyrics, describedLyrics, config, setGeneratedMusic, setError, setProgress, saveToStorage]);

  return { isGenerating, handleGenerate };
};

export default useGeneration;