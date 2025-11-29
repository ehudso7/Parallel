// ===========================================
// PARALLEL - Content Generation Providers
// Music, Video, Image, Voice
// ===========================================

import type {
  MusicGenerationRequest,
  MusicGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VoiceGenerationRequest,
  VoiceGenerationResponse,
} from '../types';

// ===========================================
// SUNO - Music Generation
// ===========================================

const SUNO_API_URL = 'https://api.suno.ai/v1';

export async function generateMusic(
  request: MusicGenerationRequest
): Promise<MusicGenerationResponse> {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    throw new Error('SUNO_API_KEY is not set');
  }

  try {
    const response = await fetch(`${SUNO_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        style: request.style,
        duration: request.duration || 30,
        instrumental: request.instrumental || false,
        tags: request.tags,
      }),
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      status: 'processing',
      metadata: data,
    };
  } catch (error) {
    console.error('Music generation failed:', error);
    return {
      id: Date.now().toString(),
      status: 'failed',
    };
  }
}

export async function getMusicStatus(jobId: string): Promise<MusicGenerationResponse> {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    throw new Error('SUNO_API_KEY is not set');
  }

  try {
    const response = await fetch(`${SUNO_API_URL}/status/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: jobId,
      status: data.status,
      audioUrl: data.audio_url,
      duration: data.duration,
      metadata: data,
    };
  } catch (error) {
    console.error('Music status check failed:', error);
    return {
      id: jobId,
      status: 'failed',
    };
  }
}

// ===========================================
// RUNWAY - Video Generation
// ===========================================

const RUNWAY_API_URL = 'https://api.runwayml.com/v1';

export async function generateVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResponse> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY is not set');
  }

  try {
    const body: Record<string, unknown> = {
      prompt: request.prompt,
      duration: request.duration || 4,
      aspect_ratio: request.aspectRatio || '16:9',
    };

    if (request.imageUrl) {
      body.image_url = request.imageUrl;
    }

    const response = await fetch(`${RUNWAY_API_URL}/generate/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      status: 'processing',
      metadata: data,
    };
  } catch (error) {
    console.error('Video generation failed:', error);
    return {
      id: Date.now().toString(),
      status: 'failed',
    };
  }
}

export async function getVideoStatus(jobId: string): Promise<VideoGenerationResponse> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY is not set');
  }

  try {
    const response = await fetch(`${RUNWAY_API_URL}/status/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: jobId,
      status: data.status,
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      metadata: data,
    };
  } catch (error) {
    console.error('Video status check failed:', error);
    return {
      id: jobId,
      status: 'failed',
    };
  }
}

// ===========================================
// REPLICATE - Image Generation (Flux/SDXL)
// ===========================================

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

export async function generateImageReplicate(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN is not set');
  }

  try {
    // Using Flux Pro model
    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-1.1-pro',
        input: {
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          width: request.width || 1024,
          height: request.height || 1024,
          num_outputs: request.numImages || 1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      status: 'processing',
      metadata: data,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      id: Date.now().toString(),
      status: 'failed',
    };
  }
}

export async function getImageStatus(jobId: string): Promise<ImageGenerationResponse> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN is not set');
  }

  try {
    const response = await fetch(`${REPLICATE_API_URL}/predictions/${jobId}`, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const data = await response.json();

    const status =
      data.status === 'succeeded'
        ? 'completed'
        : data.status === 'failed'
          ? 'failed'
          : 'processing';

    return {
      id: jobId,
      status,
      imageUrls: data.output,
      metadata: data,
    };
  } catch (error) {
    console.error('Image status check failed:', error);
    return {
      id: jobId,
      status: 'failed',
    };
  }
}

// ===========================================
// ELEVENLABS - Voice Generation
// ===========================================

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function generateVoice(
  request: VoiceGenerationRequest
): Promise<VoiceGenerationResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${request.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: request.stability || 0.5,
            similarity_boost: request.similarityBoost || 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Convert audio to base64 or upload to storage
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return {
      id: Date.now().toString(),
      audioUrl,
      duration: 0, // Would need to parse audio to get duration
    };
  } catch (error) {
    console.error('Voice generation failed:', error);
    throw error;
  }
}

// Get available voices
export async function getVoices(): Promise<
  { voice_id: string; name: string; preview_url: string }[]
> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    return [];
  }
}
