"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  Search, 
  Users, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Play
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border-card bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Scoutly</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#preview" className="hover:text-foreground transition">Product</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-300 hover:text-foreground transition"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/95 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 transition duration-200"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6 animate-pulse-slow">
            <Zap className="w-3.5 h-3.5" />
            <span>Now Scanning YouTube for Growing Creators</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Find Growing YouTube Clients <br />
            <span className="accent-gradient-text">Before Other Editors Do</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop cold emailing random channels. Scoutly scans the fastest-growing creators, diagnoses their editing flaws, and generates hyper-targeted pitch hooks automatically.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition duration-200 flex items-center justify-center gap-2 group"
            >
              Start Finding Clients
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-400 hover:text-foreground bg-card hover:bg-slate-card border border-border-card rounded-2xl transition duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-primary fill-primary" />
              Watch 2m Demo
            </Link>
          </div>

          {/* Interactive UI Preview Mockup */}
          <div id="preview" className="glow-border border border-border-card rounded-2xl bg-card p-4 sm:p-6 shadow-2xl relative max-w-4xl mx-auto">
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-card mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-slate-400 bg-background border border-border-card px-4 py-1 rounded-lg">
                scoutly.app/dashboard/sprint/results
              </div>
              <div className="w-8" />
            </div>

            {/* Simulated UI layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Left filter widget */}
              <div className="bg-background border border-border-card rounded-xl p-4 space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sprint</div>
                <div className="p-3 bg-card rounded-lg border border-primary/20">
                  <div className="text-sm font-semibold text-foreground">Tech Creators Under 100k</div>
                  <div className="text-[10px] text-slate-400 mt-1">Niche: Tech | Velocity: Explosive</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">Filters Applied</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">10k-50k Subs</span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">Fast-cut style</span>
                  </div>
                </div>
              </div>

              {/* Center results card */}
              <div className="md:col-span-2 bg-background border border-border-card rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border-card">
                  <span className="text-xs font-semibold text-slate-400">Found Creators (3)</span>
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Growth Radar Active
                  </span>
                </div>

                {/* Creator row 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card border border-border-card rounded-xl gap-2 hover:border-primary/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">DT</div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">DevonTech</div>
                      <div className="text-[10px] text-slate-400">@devontech • 45.2K Subs</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">+38% Growth</span>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-semibold">2 Hook Faults</span>
                  </div>
                </div>

                {/* Creator row 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card border border-border-card rounded-xl gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">CC</div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">CodeCraft</div>
                      <div className="text-[10px] text-slate-400">@codecraft • 15.0K Subs</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">+75% Growth</span>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">No zoom transitions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/30 border-y border-border-card relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Built Specifically for Freelance Editors
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need to automate your outbound pipeline, audit channel retention issues, and close high-ticket monthly retainers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border-card p-6 rounded-2xl hover:border-primary/50 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Discovery Sprints</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Scan YouTube by niche, subscriber range, and velocity. Focus on creators who are actively growing and actually need editing bandwidth.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border-card p-6 rounded-2xl hover:border-primary/50 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Automated Retention Audits</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Identify color mismatches, intro drop-offs, pacing dead-space, and title-hook contradictions. Give them concrete value in your pitch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border-card p-6 rounded-2xl hover:border-primary/50 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Unified CRM Pipeline</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Organize leads from initial discovery through pitches, active negotiations, and signed monthly retainers. Monitor total pipeline value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Simple, Retainer-Friendly Pricing
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Start finding clients for free. Upgrade to Pro when you&apos;re ready to scale your outreach and run unlimited sprints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-card border border-border-card p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Hobby Scout</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-slate-400 text-sm">/ forever</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Run 2 discovery sprints/month</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> View up to 10 creators</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Simple lead tracking (CRM)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Manual pitch copy</li>
                </ul>
              </div>
              <Link 
                href="/signup" 
                className="w-full text-center py-3 px-4 rounded-xl text-sm font-semibold bg-background hover:bg-card border border-border-card text-foreground transition duration-200"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-card border-2 border-primary p-8 rounded-2xl flex flex-col justify-between relative">
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-bold">
                Most Popular
              </span>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Pro Scout</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-foreground">$49</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Unlimited discovery sprints</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Unlimited creators unlocked</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Advanced retention audits (10+ checks)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Custom AI pitch drafts builder</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Email notification alerts for matches</li>
                </ul>
              </div>
              <Link 
                href="/signup" 
                className="w-full text-center py-3 px-4 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition duration-200 shadow-lg shadow-primary/20"
              >
                Unlock Pro Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bottom banner */}
      <section className="py-20 border-t border-border-card bg-card/20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-foreground mb-6">
            Ready to Fill Your Editing Pipeline?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Get instant access to fast-growing channels and stand out with professional audits that creators actually open.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold bg-primary hover:bg-primary/95 text-white rounded-2xl transition duration-250 shadow-xl shadow-primary/20 hover:shadow-primary/30"
          >
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-card bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center font-bold text-white text-xs">
              S
            </div>
            <span className="font-bold text-foreground text-base">Scoutly</span>
          </div>
          <div>
            &copy; 2026 Scoutly Technologies Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
