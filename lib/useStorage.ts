// lib/useStorage.ts
import { useState, useEffect, useCallback } from "react";
import { StoredMusic, GeneratedMusic, GenerationRequestData, GenerateFromDescriptionRequest, GenerateWithCustomLyricsRequest, GenerateWithDescribedLyricsRequest } from "../types";

const STORAGE_KEY = "generated_music_tracks";
const MAX_STORED_TRACKS = 10;

const useStorage = (generatedMusic: GeneratedMusic | null, setGeneratedMusic: React.Dispatch<React.SetStateAction<GeneratedMusic | null>>) => {
  const [storedTracks, setStoredTracks] = useState<StoredMusic[]>([]);

  const getFromStorage = useCallback((): StoredMusic[] => {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }, []);

  useEffect(() => {
    const tracks = getFromStorage();
    setStoredTracks(tracks);
  }, [getFromStorage]);

  const generateTrackTitle = useCallback((type: string, data: GenerationRequestData): string => {
    const timestamp = new Date().toLocaleString();
    switch (type) {
      case "description":
        return `${(data as GenerateFromDescriptionRequest).full_described_song?.slice(0, 30) ?? ""}... - ${timestamp}`;
      case "custom_lyrics":
        return `${(data as GenerateWithCustomLyricsRequest).prompt?.slice(0, 30) ?? ""}... - ${timestamp}`;
      case "described_lyrics":
        return `${(data as GenerateWithDescribedLyricsRequest).prompt?.slice(0, 30) ?? ""}... - ${timestamp}`;
      default:
        return `Generated Track - ${timestamp}`;
    }
  }, []);

  const saveToStorage = useCallback(
    (music: GeneratedMusic, type: string, generationData: GenerationRequestData) => {
      try {
        if (typeof window === "undefined" || !window.localStorage) return;

        const existingTracks = getFromStorage();
        const newTrack: StoredMusic = {
          ...music,
          id: Date.now().toString(),
          timestamp: Date.now(),
          title: generateTrackTitle(type, generationData),
          type,
          generationData,
        };

        const updatedTracks = [newTrack, ...existingTracks].slice(0, MAX_STORED_TRACKS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracks));
        setStoredTracks(updatedTracks);
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    },
    [getFromStorage, generateTrackTitle]
  );

  const confirmDeleteTrack = useCallback(
    (trackId: string) => {
      try {
        if (typeof window === "undefined" || !window.localStorage) return;

        const existingTracks = getFromStorage();
        const updatedTracks = existingTracks.filter((track) => track.id !== trackId);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracks));
        setStoredTracks(updatedTracks);

        if (generatedMusic && "id" in generatedMusic && generatedMusic.id === trackId) {
          setGeneratedMusic(null);
        }
      } catch (error) {
        console.error("Failed to delete track:", error);
      }
    },
    [getFromStorage, generatedMusic, setGeneratedMusic]
  );

  const clearAllTracks = useCallback(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;

      localStorage.removeItem(STORAGE_KEY);
      setStoredTracks([]);
      setGeneratedMusic(null);
    } catch (error) {
      console.error("Failed to clear tracks:", error);
    }
  }, [setGeneratedMusic]);

  return { storedTracks, saveToStorage, confirmDeleteTrack, clearAllTracks };
};

export default useStorage;