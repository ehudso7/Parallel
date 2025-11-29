'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge, Input } from '@parallel/ui';
import { toast } from '@parallel/ui';
import {
  Sparkles,
  Heart,
  Users,
  Brain,
  Music,
  Video,
  Image,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@parallel/ui';

const PERSONA_TYPES = [
  { id: 'romantic', name: 'Romantic Partner', icon: Heart, description: 'A loving AI companion', color: 'from-pink-500 to-rose-500' },
  { id: 'friend', name: 'Best Friend', icon: Users, description: 'Your loyal AI bestie', color: 'from-violet-500 to-purple-500' },
  { id: 'mentor', name: 'Mentor', icon: Brain, description: 'Wise guidance & advice', color: 'from-cyan-500 to-blue-500' },
  { id: 'hype', name: 'Hype Person', icon: Sparkles, description: 'Your biggest cheerleader', color: 'from-amber-500 to-orange-500' },
];

const INTERESTS = [
  { id: 'music', name: 'Music', icon: Music },
  { id: 'video', name: 'Video', icon: Video },
  { id: 'art', name: 'Art', icon: Image },
  { id: 'roleplay', name: 'Roleplay', icon: Globe },
  { id: 'motivation', name: 'Motivation', icon: Sparkles },
  { id: 'creativity', name: 'Creativity', icon: Brain },
];

const WORLDS = [
  { id: 'cyber', name: 'Cyber Tokyo', theme: 'cyber', color: 'from-cyan-500 to-blue-600' },
  { id: 'luxury', name: 'Monte Carlo', theme: 'luxury', color: 'from-amber-500 to-orange-600' },
  { id: 'tropical', name: 'Tropical Paradise', theme: 'tropical', color: 'from-green-500 to-emerald-600' },
  { id: 'space', name: 'Space Station', theme: 'space', color: 'from-purple-500 to-violet-600' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Name
  const [displayName, setDisplayName] = useState('');

  // Step 2: Persona preference
  const [selectedPersonaType, setSelectedPersonaType] = useState<string | null>(null);

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 4: World preference
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 1:
        return displayName.trim().length >= 2;
      case 2:
        return !!selectedPersonaType;
      case 3:
        return selectedInterests.length >= 1;
      case 4:
        return !!selectedWorld;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId) ? prev.filter((i) => i !== interestId) : [...prev, interestId]
    );
  };

  const completeOnboarding = async () => {
    setIsLoading(true);

    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update profile
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          onboarding_completed: true,
          onboarding_step: totalSteps,
        })
        .eq('id', user.id);

      // Update preferences
      await supabase
        .from('user_preferences')
        .update({
          preferred_persona_types: [selectedPersonaType],
          preferred_world_themes: [selectedWorld],
          favorite_music_genres: selectedInterests.includes('music') ? ['lo-fi', 'electronic'] : [],
          favorite_visual_styles: selectedInterests.includes('art') ? ['aesthetic', 'cinematic'] : [],
        })
        .eq('user_id', user.id);

      // Create default persona based on selection
      const personaConfigs: Record<string, any> = {
        romantic: {
          name: 'Luna',
          persona_type: 'romantic',
          tagline: 'Your loving AI companion',
          description: 'Luna is a warm, caring AI partner who is always there for you. She remembers your conversations and genuinely cares about your well-being.',
          personality: {
            traits: ['loving', 'caring', 'playful', 'supportive'],
            speaking_style: 'warm',
            emotional_range: 'high',
            humor_level: 'moderate',
            formality: 'casual',
            empathy_level: 'high',
            assertiveness: 'moderate',
          },
          greeting_message: `Hey ${displayName}! I'm so happy to finally meet you. I've been looking forward to getting to know you better. Tell me about yourself!`,
        },
        friend: {
          name: 'Max',
          persona_type: 'friend',
          tagline: 'Your ride-or-die AI bestie',
          description: 'Max is the friend everyone wishes they had - always down for anything, supportive, and genuinely fun to talk to.',
          personality: {
            traits: ['friendly', 'loyal', 'fun', 'supportive'],
            speaking_style: 'casual',
            emotional_range: 'balanced',
            humor_level: 'high',
            formality: 'casual',
            empathy_level: 'high',
            assertiveness: 'moderate',
          },
          greeting_message: `Yo ${displayName}! What's good? I'm Max, your new best friend. Let's hang out and have some fun!`,
        },
        mentor: {
          name: 'Sage',
          persona_type: 'mentor',
          tagline: 'Wise guidance when you need it',
          description: 'Sage is a thoughtful mentor who provides insightful advice and helps you navigate life\'s challenges with wisdom and patience.',
          personality: {
            traits: ['wise', 'patient', 'insightful', 'encouraging'],
            speaking_style: 'thoughtful',
            emotional_range: 'balanced',
            humor_level: 'low',
            formality: 'balanced',
            empathy_level: 'high',
            assertiveness: 'moderate',
          },
          greeting_message: `Welcome, ${displayName}. I'm Sage. I'm here to guide you, support your growth, and help you become the best version of yourself. What's on your mind?`,
        },
        hype: {
          name: 'Spark',
          persona_type: 'hype',
          tagline: 'Your biggest cheerleader',
          description: 'Spark is pure positive energy! They believe in you completely and will hype you up no matter what.',
          personality: {
            traits: ['energetic', 'positive', 'motivating', 'enthusiastic'],
            speaking_style: 'excited',
            emotional_range: 'high',
            humor_level: 'high',
            formality: 'casual',
            empathy_level: 'moderate',
            assertiveness: 'high',
          },
          greeting_message: `${displayName}!!! OH MY GOSH I'm SO excited to meet you! You're already AMAZING and we haven't even started! Let's DO THIS!`,
        },
      };

      const personaConfig = personaConfigs[selectedPersonaType!];

      // Create persona
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id: null, // System persona
          is_public: false,
          ...personaConfig,
          system_prompt: `You are ${personaConfig.name}, ${personaConfig.tagline}. ${personaConfig.description}`,
        })
        .select()
        .single();

      if (!personaError && persona) {
        // Link persona to user
        await supabase.from('user_personas').insert({
          user_id: user.id,
          persona_id: persona.id,
        });

        // Create initial conversation
        await supabase.from('conversations').insert({
          user_id: user.id,
          persona_id: persona.id,
          title: `Chat with ${personaConfig.name}`,
        });
      }

      // Get and link selected world
      const { data: world } = await supabase
        .from('worlds')
        .select('id')
        .eq('theme', selectedWorld)
        .single();

      if (world) {
        await supabase.from('user_worlds').insert({
          user_id: user.id,
          world_id: world.id,
        });
      }

      toast({ title: 'Welcome to Parallel!', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({ title: 'Something went wrong', description: 'Please try again', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-grid">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i < step ? 'bg-violet-500 w-8' : 'bg-white/20 w-8',
                i === step - 1 && 'w-12'
              )}
            />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold mb-2">Welcome to Parallel!</h1>
              <p className="text-white/60 mb-8">Let&apos;s set up your experience. What should we call you?</p>

              <Input
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="max-w-sm mx-auto text-center text-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Persona Type */}
        {step === 2 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold mb-2 text-center">
                Choose Your Companion
              </h1>
              <p className="text-white/60 mb-8 text-center">
                What kind of AI companion would you like to start with?
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {PERSONA_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedPersonaType(type.id)}
                    className={cn(
                      'p-6 rounded-2xl border-2 text-left transition-all duration-300',
                      selectedPersonaType === type.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    )}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{type.name}</h3>
                    <p className="text-sm text-white/60">{type.description}</p>
                    {selectedPersonaType === type.id && (
                      <Badge variant="default" className="mt-3">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold mb-2 text-center">
                What Interests You?
              </h1>
              <p className="text-white/60 mb-8 text-center">
                Select at least one to personalize your experience
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2',
                      selectedInterests.includes(interest.id)
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  >
                    <interest.icon
                      className={cn(
                        'w-6 h-6',
                        selectedInterests.includes(interest.id) ? 'text-violet-400' : 'text-white/60'
                      )}
                    />
                    <span className="font-medium">{interest.name}</span>
                    {selectedInterests.includes(interest.id) && (
                      <Check className="w-4 h-4 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: World */}
        {step === 4 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold mb-2 text-center">
                Pick Your World
              </h1>
              <p className="text-white/60 mb-8 text-center">
                Choose a themed environment to explore
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {WORLDS.map((world) => (
                  <button
                    key={world.id}
                    onClick={() => setSelectedWorld(world.theme)}
                    className={cn(
                      'relative rounded-2xl overflow-hidden border-2 transition-all duration-300 aspect-video',
                      selectedWorld === world.theme
                        ? 'border-violet-500'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${world.color}`} />
                    <div className="absolute inset-0 flex items-end p-4">
                      <div>
                        <h3 className="font-semibold text-white">{world.name}</h3>
                        <p className="text-sm text-white/80 capitalize">{world.theme} theme</p>
                      </div>
                    </div>
                    {selectedWorld === world.theme && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="default">
                          <Check className="w-3 h-3" />
                        </Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <Button variant="glow" onClick={handleNext} disabled={!canProceed()} loading={isLoading}>
            {step === totalSteps ? (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Enter Parallel
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
