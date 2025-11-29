import Link from 'next/link';
import { Button } from '@parallel/ui';
import {
  Sparkles,
  Heart,
  Music,
  Video,
  Image,
  MessageCircle,
  Globe,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Parallel</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-white/70 hover:text-white transition">
                Features
              </Link>
              <Link href="#pricing" className="text-white/70 hover:text-white transition">
                Pricing
              </Link>
              <Link href="#worlds" className="text-white/70 hover:text-white transition">
                Worlds
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button variant="glow">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80">#1 AI Companion App of 2025</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your{' '}
              <span className="gradient-text">AI Multiverse</span>
              <br />
              Awaits
            </h1>

            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Create AI companions, explore immersive worlds, and generate stunning content.
              Music, videos, images — all powered by the most advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="xl" variant="glow" className="w-full sm:w-auto">
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/40">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border-2 border-slate-900"
                    />
                  ))}
                </div>
                <span>10M+ Users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">4.9 Rating</span>
              </div>
            </div>
          </div>

          {/* Hero image/preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-violet-500 mx-auto mb-4" />
                  <p className="text-white/60">App Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need in <span className="gradient-text">One App</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Parallel combines AI companions, immersive worlds, and a powerful creator studio
              into one seamless experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature cards */}
            {[
              {
                icon: Heart,
                title: 'AI Companions',
                description:
                  'Create personalized AI partners, friends, mentors, and more. Each with unique personalities that learn and grow with you.',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: Globe,
                title: 'Parallel Worlds',
                description:
                  'Explore themed universes from Cyber Tokyo to Monte Carlo. Immerse yourself in rich, interactive environments.',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: Music,
                title: 'AI Music Studio',
                description:
                  'Generate original songs, covers, and beats in any style. Create viral TikTok sounds in seconds.',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                icon: Video,
                title: 'Video Generator',
                description:
                  'Create stunning AI videos, reels, and aesthetic edits. Perfect for social media content.',
                color: 'from-orange-500 to-amber-500',
              },
              {
                icon: Image,
                title: 'Image Creator',
                description:
                  'Generate beautiful portraits, scenes, memes, and art. Unlimited creative possibilities.',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Zap,
                title: 'Daily Rewards',
                description:
                  'Unlock new content, outfits, voices, and worlds daily. Keep your streak for bonus rewards.',
                color: 'from-yellow-500 to-orange-500',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worlds Preview */}
      <section id="worlds" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Explore <span className="gradient-text">Parallel Worlds</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Step into beautifully crafted universes. Each world offers unique experiences,
              stories, and adventures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Cyber Tokyo', theme: 'cyber', color: 'from-cyan-500 to-blue-600' },
              { name: 'Monte Carlo', theme: 'luxury', color: 'from-amber-500 to-orange-600' },
              { name: 'Space Station', theme: 'space', color: 'from-purple-500 to-violet-600' },
              { name: 'Tropical Paradise', theme: 'tropical', color: 'from-green-500 to-emerald-600' },
            ].map((world, i) => (
              <div
                key={i}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${world.color} opacity-80 group-hover:opacity-90 transition`}
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{world.name}</h3>
                    <p className="text-white/80 text-sm capitalize">{world.theme}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free tier */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-white/60 mb-4">Get started with basics</p>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 AI Companion', '3 Worlds', '50 Credits/month', 'Basic Chat'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </div>

            {/* Pro tier */}
            <div className="p-6 rounded-2xl border-2 border-violet-500 bg-gradient-to-b from-violet-500/10 to-transparent relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-white/60 mb-4">For serious creators</p>
              <div className="text-4xl font-bold mb-6">
                $19.99<span className="text-lg text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited Companions',
                  'All Worlds',
                  '2000 Credits/month',
                  'Voice Messages',
                  'HD Generations',
                  'Priority Support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="w-5 h-5 text-violet-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="glow" className="w-full">
                Subscribe Now
              </Button>
            </div>

            {/* Studio tier */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold mb-2">Studio</h3>
              <p className="text-white/60 mb-4">For professionals</p>
              <div className="text-4xl font-bold mb-6">
                $99.99<span className="text-lg text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  'Unlimited Credits',
                  '4K Generations',
                  'API Access',
                  'Custom Personas',
                  'White-label Options',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="premium" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 border border-white/10">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Enter Your <span className="gradient-text">Parallel Universe</span>?
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              Join millions of users creating, connecting, and exploring with AI.
              Start free today.
            </p>
            <Link href="/signup">
              <Button size="xl" variant="glow">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Parallel</span>
            </div>

            <div className="flex gap-8 text-white/60">
              <Link href="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <Link href="/support" className="hover:text-white transition">
                Support
              </Link>
              <Link href="/blog" className="hover:text-white transition">
                Blog
              </Link>
            </div>

            <div className="text-white/40 text-sm">
              © 2025 Parallel. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
