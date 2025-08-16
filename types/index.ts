// types/index.ts
export interface GenerationConfig {
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}

export interface GeneratedMusic {
  cloudinary_url: string;
  cover_image_cloudinary_url: string;
  categories: string[];
  generationData?: GenerationRequestData;
}

export interface StoredMusic extends GeneratedMusic {
  id: string;
  timestamp: number;
  title: string;
  type: string;
  generationData?: GenerationRequestData;
}

export type GenerationRequestData =
  | GenerateFromDescriptionRequest
  | GenerateWithCustomLyricsRequest
  | GenerateWithDescribedLyricsRequest;

// Assuming these are defined in @/lib/api
export interface GenerateFromDescriptionRequest {
  full_described_song: string;
  // plus config fields
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}

export interface GenerateWithCustomLyricsRequest {
  prompt: string;
  lyrics: string;
  // plus config fields
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}

export interface GenerateWithDescribedLyricsRequest {
  prompt: string;
  described_lyrics: string;
  // plus config fields
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}