import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreatorEngineAgent } from '@parallel/ai';

// Valid content types
const VALID_CONTENT_TYPES = ['music', 'video', 'image', 'meme'] as const;
type ContentType = (typeof VALID_CONTENT_TYPES)[number];

// Input validation constants
const MAX_PROMPT_LENGTH = 2000;
const MIN_PROMPT_LENGTH = 3;

// Type for generated content update data
interface ContentUpdateData {
  status: 'completed' | 'failed';
  completed_at?: string;
  result_url?: string;
  result_urls?: string[];
  thumbnail_url?: string;
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Validate content type
function isValidContentType(type: unknown): type is ContentType {
  return typeof type === 'string' && VALID_CONTENT_TYPES.includes(type as ContentType);
}

// Sanitize prompt - remove potentially harmful patterns
function sanitizePrompt(prompt: string): string {
  // Remove excessive whitespace
  return prompt.trim().replace(/\s+/g, ' ');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, prompt: rawPrompt, settings } = body;

    // Validate type
    if (!type || !isValidContentType(type)) {
      return NextResponse.json({
        error: `Invalid content type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`
      }, { status: 400 });
    }

    // Validate prompt
    if (!rawPrompt || typeof rawPrompt !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    const prompt = sanitizePrompt(rawPrompt);

    if (prompt.length < MIN_PROMPT_LENGTH) {
      return NextResponse.json({
        error: `Prompt too short. Minimum ${MIN_PROMPT_LENGTH} characters required.`
      }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({
        error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`
      }, { status: 400 });
    }

    // Check user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance, subscription_tier, lifetime_credits_used')
      .eq('id', user.id)
      .single();

    const creditCosts: Record<string, number> = {
      music: 10,
      video: 25,
      image: 5,
      meme: 5,
    };

    const cost = creditCosts[type] || 10;

    if ((profile?.credits_balance || 0) < cost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Create content record
    const { data: content, error: contentError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        content_type: type,
        status: 'pending',
        prompt,
        parameters: settings,
        provider: type === 'music' ? 'suno' : type === 'video' ? 'runway' : 'replicate',
        credits_used: cost,
      })
      .select()
      .single();

    if (contentError) {
      console.error('Content creation error:', contentError);
      return NextResponse.json({ error: 'Failed to create content record' }, { status: 500 });
    }

    // Deduct credits
    await supabase
      .from('profiles')
      .update({
        credits_balance: (profile?.credits_balance || 0) - cost,
        lifetime_credits_used: (profile?.lifetime_credits_used || 0) + cost,
      })
      .eq('id', user.id);

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -cost,
      balance_after: (profile?.credits_balance || 0) - cost,
      source: 'usage',
      source_id: content.id,
      description: `${type} generation`,
    });

    // Initialize creator engine
    const creator = new CreatorEngineAgent();

    try {
      let result;

      switch (type) {
        case 'music':
          result = await creator.generateMusic({
            prompt,
            style: settings?.style,
            duration: settings?.duration || 30,
            instrumental: settings?.instrumental || false,
          });
          break;

        case 'video':
          result = await creator.generateVideo({
            prompt,
            duration: settings?.duration || 4,
            aspectRatio: settings?.aspectRatio || '9:16',
          });
          break;

        case 'image': {
          const dimensions = {
            square: { width: 1024, height: 1024 },
            portrait: { width: 1024, height: 1792 },
            landscape: { width: 1792, height: 1024 },
          };
          const size = dimensions[settings?.size as keyof typeof dimensions] || dimensions.square;

          result = await creator.generateImage({
            prompt,
            style: settings?.style,
            ...size,
          });
          break;
        }

        case 'meme':
          result = await creator.generateMeme(prompt);
          break;

        default:
          throw new Error(`Unknown content type: ${type}`);
      }

      // Update content status
      await supabase
        .from('generated_content')
        .update({
          status: result.status === 'completed' ? 'completed' : 'processing',
          provider_job_id: result.id,
          result_url: 'imageUrls' in result ? result.imageUrls?.[0] : 'audioUrl' in result ? result.audioUrl : 'videoUrl' in result ? result.videoUrl : null,
          result_urls: 'imageUrls' in result ? result.imageUrls : [],
        })
        .eq('id', content.id);

      return NextResponse.json({
        id: content.id,
        status: result.status,
        jobId: result.id,
        ...('imageUrls' in result && { imageUrl: result.imageUrls?.[0] }),
        ...('audioUrl' in result && { audioUrl: result.audioUrl }),
        ...('videoUrl' in result && { videoUrl: result.videoUrl }),
      });
    } catch (genError) {
      // Update status to failed
      await supabase
        .from('generated_content')
        .update({
          status: 'failed',
          error_message: genError instanceof Error ? genError.message : 'Unknown error',
        })
        .eq('id', content.id);

      // Refund credits on failure
      await supabase
        .from('profiles')
        .update({
          credits_balance: profile?.credits_balance || 0,
        })
        .eq('id', user.id);

      throw genError;
    }
  } catch (error) {
    console.error('Create API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check generation status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('id');

    if (!contentId) {
      return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
    }

    if (!isValidUUID(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID format' }, { status: 400 });
    }

    const { data: content, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (error || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // If still processing, check with provider
    if (content.status === 'processing' && content.provider_job_id) {
      const creator = new CreatorEngineAgent();
      const status = await creator.getJobStatus(content.provider_job_id);

      if (status.status === 'completed') {
        // Update content with result
        const updateData: ContentUpdateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
        };

        if ('imageUrls' in status && status.imageUrls) {
          updateData.result_url = status.imageUrls[0];
          updateData.result_urls = status.imageUrls;
        }
        if ('audioUrl' in status && status.audioUrl) {
          updateData.result_url = status.audioUrl;
        }
        if ('videoUrl' in status && status.videoUrl) {
          updateData.result_url = status.videoUrl;
          updateData.thumbnail_url = status.thumbnailUrl;
        }

        await supabase
          .from('generated_content')
          .update(updateData)
          .eq('id', contentId);

        return NextResponse.json({ ...content, ...updateData });
      } else if (status.status === 'failed') {
        await supabase
          .from('generated_content')
          .update({ status: 'failed' })
          .eq('id', contentId);

        return NextResponse.json({ ...content, status: 'failed' });
      }
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
