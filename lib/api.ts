// Types for music generation
export interface GenerationConfig {
  audio_duration: number;
  seed: number;
  guidance_scale: number;
  infer_step: number;
  instrumental: boolean;
}

export interface GenerateFromDescriptionRequest extends GenerationConfig {
  full_described_song: string;
}

export interface GenerateWithCustomLyricsRequest extends GenerationConfig {
  prompt: string;
  lyrics: string;
}

export interface GenerateWithDescribedLyricsRequest extends GenerationConfig {
  prompt: string;
  described_lyrics: string;
}

export interface GeneratedMusic {
  cloudinary_url: string;
  cover_image_cloudinary_url: string;
  categories: string[];
}

export interface GenerateMusicResponse {
  audio_data: string;
}

// Modal endpoint URLs - Use the exact URLs from your deployment
const ENDPOINTS = {
  generateFromDescription: 'https://akashmore83387--music-generator-musicgenserver-generate--8b9c2f.modal.run',
  generateWithLyrics: 'https://akashmore83387--music-generator-musicgenserver-generate--6c0770.modal.run',
  generateWithDescribedLyrics: 'https://akashmore83387--music-generator-musicgenserver-generate--7f4980.modal.run',
  generateBase64: 'https://akashmore83387--music-generator-musicgenserver-generate.modal.run', // Base generate endpoint
};

/**
 * Generate music from description using the backend service
 * @param request The music generation request parameters
 * @returns Promise with the generated music data
 */
export async function generateFromDescription(request: GenerateFromDescriptionRequest): Promise<GeneratedMusic> {
  try {
    console.log('Sending request to Modal:', ENDPOINTS.generateFromDescription);
    console.log('Request payload:', request);

    const response = await fetch(ENDPOINTS.generateFromDescription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to generate music from description (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Generate music from description error:', error);
    throw error;
  }
}

/**
 * Generate music with custom lyrics using the backend service
 * @param request The music generation request parameters
 * @returns Promise with the generated music data
 */
export async function generateWithCustomLyrics(request: GenerateWithCustomLyricsRequest): Promise<GeneratedMusic> {
  try {
    console.log('Sending request to Modal:', ENDPOINTS.generateWithLyrics);
    console.log('Request payload:', request);

    const response = await fetch(ENDPOINTS.generateWithLyrics, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to generate music with custom lyrics (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Generate music with custom lyrics error:', error);
    throw error;
  }
}

/**
 * Generate music with described lyrics using the backend service
 * @param request The music generation request parameters
 * @returns Promise with the generated music data
 */
export async function generateWithDescribedLyrics(request: GenerateWithDescribedLyricsRequest): Promise<GeneratedMusic> {
  try {
    console.log('Sending request to Modal:', ENDPOINTS.generateWithDescribedLyrics);
    console.log('Request payload:', request);

    const response = await fetch(ENDPOINTS.generateWithDescribedLyrics, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to generate music with described lyrics (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Generate music with described lyrics error:', error);
    throw error;
  }
}

/**
 * Generate music and get the base64 data directly
 * @param request The music generation request parameters (uses basic generation)
 * @returns Promise with the base64 music data
 */
export async function generateMusicBase64(request: GenerationConfig): Promise<GenerateMusicResponse> {
  try {
    console.log('Sending base64 request to Modal:', ENDPOINTS.generateBase64);

    const response = await fetch(ENDPOINTS.generateBase64, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Base64 error response:', errorText);
      throw new Error(`Failed to generate base64 music (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Generate music base64 error:', error);
    throw error;
  }
}

/**
 * Generic music generation function that routes to the appropriate endpoint
 * @param type The type of generation request
 * @param data The request data
 * @returns Promise with the generated music data
 */
export async function generateMusic(
  type: "description" | "custom_lyrics" | "described_lyrics",
  data: GenerateFromDescriptionRequest | GenerateWithCustomLyricsRequest | GenerateWithDescribedLyricsRequest
): Promise<GeneratedMusic> {
  switch (type) {
    case "description":
      return generateFromDescription(data as GenerateFromDescriptionRequest);
    case "custom_lyrics":
      return generateWithCustomLyrics(data as GenerateWithCustomLyricsRequest);
    case "described_lyrics":
      return generateWithDescribedLyrics(data as GenerateWithDescribedLyricsRequest);
    default:
      throw new Error(`Invalid generation type: ${type}`);
  }
}

// Test function to check if the API is working
export async function testMusicConnection(): Promise<boolean> {
  try {
    const testRequest: GenerateFromDescriptionRequest = {
      full_described_song: "test music generation",
      audio_duration: 30,
      seed: -1,
      guidance_scale: 15,
      infer_step: 20, // Reduced for faster testing
      instrumental: true,
    };

    await generateFromDescription(testRequest);
    return true;
  } catch (error) {
    console.error('Music connection test failed:', error);
    return false;
  }
}

// Utility function to create default config
export function createDefaultConfig(): GenerationConfig {
  return {
    audio_duration: 180,
    seed: -1,
    guidance_scale: 15,
    infer_step: 60,
    instrumental: false,
  };
}

// Utility function to validate request data
export function validateGenerationRequest(type: string, data: GenerateFromDescriptionRequest | GenerateWithCustomLyricsRequest | GenerateWithDescribedLyricsRequest): boolean {
  switch (type) {
    case "description":
      return Boolean((data as GenerateFromDescriptionRequest).full_described_song?.trim());
    case "custom_lyrics":
      const customLyricsData = data as GenerateWithCustomLyricsRequest;
      return Boolean(customLyricsData.prompt?.trim() && customLyricsData.lyrics?.trim());
    case "described_lyrics":
      const describedLyricsData = data as GenerateWithDescribedLyricsRequest;
      return Boolean(describedLyricsData.prompt?.trim() && describedLyricsData.described_lyrics?.trim());
    default:
      return false;
  }
}