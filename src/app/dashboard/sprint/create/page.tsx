"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Radio, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mockStore } from "@/app/mockData";

export default function CreateSprint() {
  const router = useRouter();
  const savingRef = React.useRef(false);
  const [sprintName, setSprintName] = useState("");
  const [niche, setNiche] = useState("Tech");
  const [subscribers, setSubscribers] = useState("10k-50k");
  const [velocity, setVelocity] = useState("Explosive");
  const [editStyle, setEditStyle] = useState("Fast-cut");
  const [targetRegion, setTargetRegion] = useState("Global");
  const [contentType, setContentType] = useState("Any");
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const scanSteps = [
    "Connecting to YouTube API scanner...",
    "Filtering channels by niche and subscriber range...",
    "Measuring 30-day subscriber & view growth velocity...",
    "Auditing video editing style markers...",
    "Identifying visual flaws & retention hook risks...",
    "Finalizing sprint report..."
  ];

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scanning) return;
    setScanning(true);
    setScanStep(0);
    setErrorMsg("");

    let fetchedCreators: any[] = [];
    let apiSuccess = false;
    let apiErrorMsg = "";
    let excludeChannelIds: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (session) {
        const { data } = await supabase
          .from("creators")
          .select("channel_id")
          .gte("created_at", thirtyDaysAgo.toISOString());
        excludeChannelIds = (data || []).map(c => c.channel_id).filter(Boolean);
      } else {
        const mockCreators = mockStore.getCreators();
        excludeChannelIds = mockCreators.filter(c => {
          if (c.id.startsWith("cr-")) {
            const ts = parseInt(c.id.split("-")[1]);
            if (!isNaN(ts)) return ts >= thirtyDaysAgo.getTime();
          }
          return false;
        }).map(c => c.channelId).filter(Boolean);
      }
    } catch (dbErr) {
      console.warn("Failed to load discovered channels list, defaulting to empty:", dbErr);
    }

    try {
      const response = await fetch("/api/sprint/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sprintName,
          niche,
          subscribers,
          velocity,
          editStyle,
          region: targetRegion,
          excludeChannelIds,
          contentType
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchedCreators = data.creators || [];
        apiSuccess = true;
      } else {
        apiErrorMsg = data.error || "Failed to scan creators";
      }
    } catch (err: any) {
      apiErrorMsg = err.message || "Network error occurred during scan";
    }

    // Run the scanning progress steps
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= scanSteps.length) {
        clearInterval(interval);
        
        if (!apiSuccess) {
          setScanning(false);
          setErrorMsg(apiErrorMsg || "Failed to scan matching creators from YouTube.");
          return;
        }

        if (savingRef.current) return;
        savingRef.current = true;

        // Save the sprint using Supabase or local mockStore fallback
        const saveSprint = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            let success = false;
            
            if (session) {
              // 1. Save Sprint Record
              const sprintInsertPayload: any = {
                user_id: session.user.id,
                name: sprintName || `${niche} Sprint`,
                niche: niche,
                subscribers: subscribers,
                velocity: velocity,
                edit_style: editStyle,
                region: targetRegion,
                content_type: contentType
              };

              let { data: newSprint, error: sprintError } = await supabase
                .from("sprints")
                .insert(sprintInsertPayload)
                .select("id")
                .single();

              // If DDL column not found, retry without region and content_type fields
              if (sprintError && (sprintError.code === "PGRST204" || sprintError.message.includes("region") || sprintError.message.includes("content_type"))) {
                console.warn("Supabase 'region' or 'content_type' column not found in database. Retrying insert without them.");
                delete sprintInsertPayload.region;
                delete sprintInsertPayload.content_type;
                const retryResult = await supabase
                  .from("sprints")
                  .insert(sprintInsertPayload)
                  .select("id")
                  .single();
                newSprint = retryResult.data;
                sprintError = retryResult.error;
              }

              if (!sprintError && newSprint) {
                success = true;
                
                // 2. Save Creators to Supabase Creators table
                const uniqueCreators = Array.from(
                  new Map(fetchedCreators.map(c => [c.channel_id, c])).values()
                );
                for (const creator of uniqueCreators) {
                  if (!creator.channel_id) continue;

                  const { data: existing } = await supabase
                    .from("creators")
                    .select("id")
                    .eq("channel_id", creator.channel_id)
                    .maybeSingle();

                  const creatorPayload = {
                    channel_id: creator.channel_id,
                    channel_name: creator.channel_name,
                    handle: creator.handle,
                    avatar: creator.avatar,
                    thumbnail_url: creator.thumbnail_url,
                    niche: creator.niche,
                    subscribers: creator.subscribers,
                    average_views: creator.average_views,
                    growth_score: creator.growth_score,
                    opportunity_score: creator.opportunity_score,
                    email: creator.email,
                    velocity: creator.velocity,
                    edit_style: creator.edit_style,
                    video_count: creator.video_count,
                    suggested_pitch: creator.suggested_pitch,
                    editing_pain_points: creator.editing_pain_points,
                    latest_videos: creator.latest_videos,
                    primary_niche: creator.primary_niche,
                    niche_confidence: creator.niche_confidence,
                    content_type: creator.content_type,
                    region_score: creator.region_score,
                    fit_score: creator.fit_score,
                    last_upload_days: creator.last_upload_days,
                    uploads_last_30_days: creator.uploads_last_30_days
                  };

                  if (existing) {
                    console.log(`[Sprint Scan] Creator ${creator.channel_name} (${creator.channel_id}) already exists in DB. Updating record.`);
                    let { error: updateErr } = await supabase
                      .from("creators")
                      .update(creatorPayload)
                      .eq("id", existing.id);
                    
                    if (updateErr && (updateErr.code === "PGRST204" || updateErr.message.includes("primary_niche") || updateErr.message.includes("niche_confidence") || updateErr.message.includes("content_type") || updateErr.message.includes("region_score") || updateErr.message.includes("fit_score") || updateErr.message.includes("last_upload_days") || updateErr.message.includes("uploads_last_30_days"))) {
                      console.warn("New creator columns not found in DB. Retrying update without new fields.");
                      const fallbackPayload = { ...creatorPayload };
                      delete (fallbackPayload as any).primary_niche;
                      delete (fallbackPayload as any).niche_confidence;
                      delete (fallbackPayload as any).content_type;
                      delete (fallbackPayload as any).region_score;
                      delete (fallbackPayload as any).fit_score;
                      delete (fallbackPayload as any).last_upload_days;
                      delete (fallbackPayload as any).uploads_last_30_days;
                      await supabase.from("creators").update(fallbackPayload).eq("id", existing.id);
                    }
                  } else {
                    console.log(`[Sprint Scan] Creator ${creator.channel_name} (${creator.channel_id}) does not exist in DB. Inserting new record.`);
                    let { error: insertErr } = await supabase
                      .from("creators")
                      .insert(creatorPayload);

                    if (insertErr && (insertErr.code === "PGRST204" || insertErr.message.includes("primary_niche") || insertErr.message.includes("niche_confidence") || insertErr.message.includes("content_type") || insertErr.message.includes("region_score") || insertErr.message.includes("fit_score") || insertErr.message.includes("last_upload_days") || insertErr.message.includes("uploads_last_30_days"))) {
                      console.warn("New creator columns not found in DB. Retrying insert without new fields.");
                      const fallbackPayload = { ...creatorPayload };
                      delete (fallbackPayload as any).primary_niche;
                      delete (fallbackPayload as any).niche_confidence;
                      delete (fallbackPayload as any).content_type;
                      delete (fallbackPayload as any).region_score;
                      delete (fallbackPayload as any).fit_score;
                      delete (fallbackPayload as any).last_upload_days;
                      delete (fallbackPayload as any).uploads_last_30_days;
                      await supabase.from("creators").insert(fallbackPayload);
                    }
                  }
                }
              } else {
                console.warn("Supabase sprint save failed, falling back to mock store:", sprintError?.message);
              }
            }
            
            // Sync mockStore fallback list
            const localCreators = mockStore.getCreators();
            const updatedCreators = [...localCreators];
            const uniqueLocalCreators = Array.from(
              new Map(fetchedCreators.map(c => [c.channel_id, c])).values()
            );
            for (const creator of uniqueLocalCreators) {
              if (!creator.channel_id) continue;

              const mappedCreator = {
                channelId: creator.channel_id,
                name: creator.channel_name,
                handle: creator.handle,
                avatar: creator.avatar,
                thumbnailUrl: creator.thumbnail_url,
                niche: creator.niche,
                subscribers: creator.subscribers,
                subGrowth: creator.growth_score,
                velocity: creator.velocity || "Explosive",
                editStyle: creator.edit_style || "Fast-cut",
                videoCount: creator.video_count || 0,
                avgViews: creator.average_views || 0,
                email: creator.email,
                crmStatus: "none" as const,
                opportunityScore: creator.opportunity_score,
                lastContacted: "Never",
                editingPainPoints: creator.editing_pain_points || [],
                suggestedPitch: creator.suggested_pitch || "",
                latestVideos: creator.latest_videos || [],
                primaryNiche: creator.primary_niche,
                nicheConfidence: creator.niche_confidence,
                contentType: creator.content_type,
                regionScore: creator.region_score,
                fitScore: creator.fit_score,
                lastUploadDays: creator.last_upload_days,
                uploadsLast30Days: creator.uploads_last_30_days
              };

              const idx = updatedCreators.findIndex(c => c.channelId === creator.channel_id);
              if (idx >= 0) {
                console.log(`[Sprint Scan Local] Creator ${creator.channel_name} (${creator.channel_id}) already exists locally. Updating.`);
                updatedCreators[idx] = {
                  ...updatedCreators[idx],
                  ...mappedCreator,
                  id: updatedCreators[idx].id,
                  crmStatus: updatedCreators[idx].crmStatus
                };
              } else {
                console.log(`[Sprint Scan Local] Creator ${creator.channel_name} (${creator.channel_id}) does not exist locally. Inserting.`);
                updatedCreators.push({
                  id: `cr-${Date.now()}-${Math.random()}`,
                  ...mappedCreator
                } as any);
              }
            }
            mockStore.saveCreators(updatedCreators);

            mockStore.createSprint(sprintName, {
              niche,
              subscribers,
              velocity,
              editStyle,
              contentType
            }, targetRegion);
            
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("new-notification", {
                  detail: {
                    message: `Discovery Sprint '${sprintName || `${niche} Sprint`}' completed. Found ${fetchedCreators.length} creators.`,
                    type: "success"
                  }
                })
              );
            }
          } catch (err) {
            console.error("Failed to save sprint, falling back to mock store:", err);
          }
        };

        saveSprint().then(() => {
          setTimeout(() => {
            router.push("/dashboard/sprint/results");
          }, 400);
        });
      } else {
        setScanStep(currentStep);
      }
    }, 600);
  };

  if (scanning) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
        <div className="relative">
          {/* Outer glowing scanning ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center animate-spin relative z-10">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-foreground">Scanner Executing</h2>
          <p className="text-sm text-slate-400 font-medium h-5">
            {scanSteps[scanStep]}
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-64 h-1.5 bg-card rounded-full overflow-hidden border border-border-card">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out" 
            style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Launch a Discovery Sprint</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure filters to scan for YouTube channels matching your editing niche and client profiles.
        </p>
      </div>

      <form onSubmit={handleLaunch} className="bg-card border border-border-card rounded-2xl p-6 space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}
        {/* Sprint Name */}
        <div className="space-y-2">
          <label htmlFor="sprint-name" className="block text-sm font-semibold text-foreground">
            Sprint Name
          </label>
          <input
            type="text"
            id="sprint-name"
            required
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
            placeholder="e.g., Gaming Channels Under 100k (Cinematic style)"
          />
        </div>

        {/* Target Region */}
        <div className="space-y-2">
          <label htmlFor="target-region" className="block text-sm font-semibold text-foreground">
            Target Region
          </label>
          <select
            id="target-region"
            value={targetRegion}
            onChange={(e) => setTargetRegion(e.target.value)}
            className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
          >
            <option value="Global">Global (No filtering)</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Poland">Poland</option>
            <option value="India">India</option>
          </select>
        </div>

        {/* Niche & Subs grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Niche */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">YouTube Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
            >
              <option value="Tech">Tech / Gadgets</option>
              <option value="Gaming">Gaming Essays</option>
              <option value="Finance">Finance / Money</option>
              <option value="Essay">Video Essays</option>
              <option value="Lifestyle">Vlogs & Lifestyle</option>
              <option value="Travel & Tourism">Travel & Tourism</option>
              <option value="Fitness">Fitness</option>
              <option value="All">All Niches</option>
            </select>
          </div>

          {/* Subs Range */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Subscriber Range</label>
            <select
              value={subscribers}
              onChange={(e) => setSubscribers(e.target.value)}
              className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
            >
              <option value="10k-50k">10K - 50K (Micro growth)</option>
              <option value="50k-250k">50K - 250K (Mid scale)</option>
              <option value="250k-1M">250K - 1M (Establishment)</option>
              <option value="All">All Sizes</option>
            </select>
          </div>
        </div>

        {/* Growth Velocity & Edit Style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Growth Velocity */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Growth Velocity</label>
            <select
              value={velocity}
              onChange={(e) => setVelocity(e.target.value)}
              className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
            >
              <option value="Explosive">Explosive (&gt;30% monthly growth)</option>
              <option value="Rapid">Rapid (15% - 30% monthly growth)</option>
              <option value="Steady">Steady (5% - 15% monthly growth)</option>
              <option value="All">Any Velocity</option>
            </select>
          </div>

          {/* Edit Style Target */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Identified Edit Style</label>
            <select
              value={editStyle}
              onChange={(e) => setEditStyle(e.target.value)}
              className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
            >
              <option value="Fast-cut">Fast-cut / TikTok style</option>
              <option value="Cinematic">Cinematic Documentary</option>
              <option value="Text-heavy">Text-heavy Info explaining</option>
              <option value="Minimalist">Minimalist / Warm Vlogging</option>
              <option value="All">Any Edit Style</option>
            </select>
          </div>
        </div>

        {/* Content Type Filter */}
        <div className="space-y-2">
          <label htmlFor="content-type" className="block text-sm font-semibold text-foreground">
            Target Content Type
          </label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="block w-full px-4 py-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200 text-sm"
          >
            <option value="Any">Any Format (Long form or Shorts)</option>
            <option value="long-form">Long Form Creator (Avg duration &gt; 5m)</option>
            <option value="short-form">Shorts Creator (Avg duration &lt; 90s)</option>
            <option value="mixed">Mixed Content Creator (Both formats)</option>
          </select>
        </div>

        {/* Scanner notice */}
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-foreground block">Sprint Insights:</span>
            Our algorithm detects editing style templates based on cut frequency, audio loudness gaps, and video metadata patterns to identify retention pain points.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-card">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-border-card hover:bg-slate-card text-sm font-semibold text-foreground transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-sm font-semibold text-white transition duration-200 shadow-lg shadow-primary/25"
          >
            <Zap className="w-4 h-4" />
            Launch Scanner
          </button>
        </div>
      </form>
    </div>
  );
}
