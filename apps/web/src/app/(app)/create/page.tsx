'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Slider } from '@parallel/ui';
import { toast } from '@parallel/ui';
import {
  Music,
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Play,
  Download,
  Share2,
  Clock,
  Zap,
  ChevronRight,
  Loader2,
  Volume2,
  Palette,
  Wand2,
} from 'lucide-react';

type ContentType = 'music' | 'video' | 'image' | 'meme';

interface Template {
  id: string;
  name: string;
  type: ContentType;
  category: string;
  prompt: string;
  previewUrl?: string;
  credits: number;
}

const templates: Template[] = [
  // Music templates
  { id: 'music_lofi', name: 'Lo-Fi Chill', type: 'music', category: 'chill', prompt: 'Lo-fi hip hop beat, relaxing, study music', credits: 10 },
  { id: 'music_epic', name: 'Epic Cinematic', type: 'music', category: 'dramatic', prompt: 'Epic orchestral, dramatic, movie trailer', credits: 15 },
  { id: 'music_romantic', name: 'Romantic Ballad', type: 'music', category: 'emotional', prompt: 'Romantic love song, emotional, acoustic', credits: 15 },
  { id: 'music_hiphop', name: 'Hip Hop Beat', type: 'music', category: 'energetic', prompt: 'Modern hip hop beat, trap, hard-hitting', credits: 10 },

  // Video templates
  { id: 'video_aesthetic', name: 'Aesthetic Edit', type: 'video', category: 'social', prompt: 'Aesthetic visuals, pastel colors, dreamy', credits: 25 },
  { id: 'video_motivation', name: 'Motivation Clip', type: 'video', category: 'inspiration', prompt: 'Motivational scene, sunrise, achievement', credits: 25 },
  { id: 'video_romantic', name: 'Romantic Scene', type: 'video', category: 'emotional', prompt: 'Romantic couple scene, golden hour, love', credits: 30 },

  // Image templates
  { id: 'image_portrait', name: 'AI Portrait', type: 'image', category: 'character', prompt: 'Beautiful portrait, professional, detailed', credits: 5 },
  { id: 'image_fantasy', name: 'Fantasy Scene', type: 'image', category: 'world', prompt: 'Fantasy landscape, magical, ethereal', credits: 5 },
  { id: 'image_cyberpunk', name: 'Cyberpunk City', type: 'image', category: 'world', prompt: 'Cyberpunk city, neon lights, futuristic', credits: 5 },
];

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState<ContentType>('music');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Music settings
  const [musicDuration, setMusicDuration] = useState([30]);
  const [musicStyle, setMusicStyle] = useState('');
  const [isInstrumental, setIsInstrumental] = useState(false);

  // Video settings
  const [videoDuration, setVideoDuration] = useState([4]);
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16' | '1:1'>('9:16');

  // Image settings
  const [imageSize, setImageSize] = useState<'square' | 'portrait' | 'landscape'>('square');
  const [imageStyle, setImageStyle] = useState('realistic');

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedTemplate) {
      toast({ title: 'Please enter a prompt or select a template', variant: 'warning' });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          prompt: prompt || selectedTemplate?.prompt,
          settings: {
            ...(activeTab === 'music' && {
              duration: musicDuration[0],
              style: musicStyle,
              instrumental: isInstrumental,
            }),
            ...(activeTab === 'video' && {
              duration: videoDuration[0],
              aspectRatio: videoAspect,
            }),
            ...(activeTab === 'image' && {
              size: imageSize,
              style: imageStyle,
            }),
          },
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setGeneratedContent(data);
      toast({ title: 'Content generated!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Generation failed', description: 'Please try again', variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTemplates = templates.filter((t) => t.type === activeTab);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-violet-400" />
          Creator Studio
        </h1>
        <p className="text-white/60">
          Generate stunning AI content - music, videos, and images
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Creation Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type Selector */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="music" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Music
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="meme" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Meme
              </TabsTrigger>
            </TabsList>

            {/* Music Tab */}
            <TabsContent value="music" className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Music className="w-5 h-5 text-violet-400" />
                    Music Generation
                  </h3>

                  <Textarea
                    placeholder="Describe the music you want to create... (e.g., 'Upbeat electronic dance track with energetic synths and powerful drops')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Style/Genre</label>
                      <Input
                        placeholder="e.g., lo-fi, rock, jazz"
                        value={musicStyle}
                        onChange={(e) => setMusicStyle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">
                        Duration: {musicDuration[0]}s
                      </label>
                      <Slider
                        value={musicDuration}
                        onValueChange={setMusicDuration}
                        min={15}
                        max={120}
                        step={15}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstrumental}
                      onChange={(e) => setIsInstrumental(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Instrumental only (no vocals)</span>
                  </label>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Video className="w-5 h-5 text-cyan-400" />
                    Video Generation
                  </h3>

                  <Textarea
                    placeholder="Describe the video scene you want to create... (e.g., 'Cinematic shot of a woman walking through neon-lit streets of Tokyo at night')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Aspect Ratio</label>
                      <div className="flex gap-2">
                        {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setVideoAspect(ratio)}
                            className={`px-4 py-2 rounded-lg border transition ${
                              videoAspect === ratio
                                ? 'border-violet-500 bg-violet-500/20'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">
                        Duration: {videoDuration[0]}s
                      </label>
                      <Slider
                        value={videoDuration}
                        onValueChange={setVideoDuration}
                        min={2}
                        max={10}
                        step={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-pink-400" />
                    Image Generation
                  </h3>

                  <Textarea
                    placeholder="Describe the image you want to create... (e.g., 'Portrait of a beautiful woman with flowing silver hair, ethereal lighting, fantasy art style')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Size</label>
                      <div className="flex gap-2">
                        {(['square', 'portrait', 'landscape'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={`px-4 py-2 rounded-lg border transition capitalize ${
                              imageSize === size
                                ? 'border-violet-500 bg-violet-500/20'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Style</label>
                      <div className="flex gap-2 flex-wrap">
                        {['realistic', 'anime', 'artistic', 'fantasy'].map((style) => (
                          <button
                            key={style}
                            onClick={() => setImageStyle(style)}
                            className={`px-3 py-1.5 rounded-lg border transition capitalize text-sm ${
                              imageStyle === style
                                ? 'border-violet-500 bg-violet-500/20'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meme Tab */}
            <TabsContent value="meme" className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    Meme Generator
                  </h3>

                  <Textarea
                    placeholder="Describe your meme concept... (e.g., 'Surprised Pikachu face reacting to my code working on the first try')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generate Button */}
          <Button
            variant="glow"
            size="xl"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !selectedTemplate)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generatedContent && (
            <Card className="border-violet-500/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Generated Content
                </h3>

                {/* Preview based on type */}
                <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                  {activeTab === 'music' && (
                    <div className="text-center">
                      <Volume2 className="w-16 h-16 text-violet-400 mx-auto mb-2" />
                      <p className="text-white/60">Audio Preview</p>
                    </div>
                  )}
                  {activeTab === 'video' && (
                    <Play className="w-16 h-16 text-white/60" />
                  )}
                  {(activeTab === 'image' || activeTab === 'meme') && generatedContent.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={generatedContent.imageUrl}
                      alt="Generated"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="default" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-fuchsia-400" />
                Templates
              </h3>

              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPrompt(template.prompt);
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition ${
                      selectedTemplate?.id === template.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      <Badge variant="secondary">
                        <Zap className="w-3 h-3 mr-1" />
                        {template.credits}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/60 truncate">{template.prompt}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Creations */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Recent
              </h3>

              <div className="text-center py-8 text-white/40">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Your creations will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
