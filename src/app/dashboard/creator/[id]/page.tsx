"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  TrendingUp, 
  Mail, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  DollarSign, 
  Briefcase, 
  Video, 
  Eye, 
  ExternalLink 
} from "lucide-react";
import { Creator, mockStore } from "@/app/mockData";
import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreatorDetail({ params }: PageProps) {
  const { id } = use(params);
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [crmStatus, setCrmStatus] = useState<Creator['crmStatus']>("none");
  const [pitchContent, setPitchContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load creator details on mount/id change
  const loadCreatorData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let dbCreator: any = null;
      let leadData: any = null;
      let profileData: any = null;

      if (session) {
        // 1. Fetch Creator
        const resCreator = await supabase
          .from("creators")
          .select("*")
          .eq("id", id)
          .single();
        dbCreator = resCreator.data;

        if (dbCreator) {
          // 2. Fetch Lead status
          const resLead = await supabase
            .from("leads")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("creator_id", id)
            .maybeSingle();
          leadData = resLead.data;

          // 3. Fetch User pitch template
          const resProfile = await supabase
            .from("profiles")
            .select("pitch_template")
            .eq("id", session.user.id)
            .single();
          profileData = resProfile.data;
        }
      }

      const defaultCreator = mockStore.getCreatorById(id);
      
      if (!dbCreator && !defaultCreator) return;

      const finalCreator = dbCreator ? {
        id: dbCreator.id,
        channelId: dbCreator.channel_id || "",
        name: dbCreator.channel_name,
        handle: dbCreator.handle,
        avatar: dbCreator.avatar || dbCreator.channel_name.substring(0, 2).toUpperCase(),
        thumbnailUrl: dbCreator.thumbnail_url || "",
        subscribers: dbCreator.subscribers,
        subGrowth: dbCreator.growth_score,
        niche: dbCreator.niche,
        velocity: dbCreator.velocity || "Explosive",
        editStyle: dbCreator.edit_style || "Fast-cut",
        videoCount: dbCreator.video_count || 0,
        avgViews: dbCreator.average_views || 0,
        email: dbCreator.email,
        crmStatus: leadData ? (leadData.status as Creator['crmStatus']) : 'none',
        opportunityScore: dbCreator.opportunity_score || 0,
        lastContacted: leadData ? (leadData.status === "lead" ? "Never" : new Date(leadData.created_at).toISOString().split("T")[0]) : "Never",
        editingPainPoints: dbCreator.editing_pain_points || [],
        suggestedPitch: dbCreator.suggested_pitch || "",
        latestVideos: dbCreator.latest_videos || [],
        primaryNiche: dbCreator.primary_niche,
        nicheConfidence: dbCreator.niche_confidence,
        contentType: dbCreator.content_type,
        regionScore: dbCreator.region_score,
        fitScore: dbCreator.fit_score,
        lastUploadDays: dbCreator.last_upload_days,
        uploadsLast30Days: dbCreator.uploads_last_30_days
      } : defaultCreator!;

      const matchedStatus = dbCreator ? (leadData ? leadData.status as Creator['crmStatus'] : 'none') : finalCreator.crmStatus;

      setCreator(finalCreator);
      setCrmStatus(matchedStatus);

      // Compile personalized pitch
      const defaultSettings = mockStore.getSettings();
      const template = profileData?.pitch_template || defaultSettings.pitchTemplate;
      
      const latestVideoTitle = finalCreator.latestVideos?.[0]?.title || "recent uploads";
      const compiled = template
        .replace(/{CreatorName}/g, finalCreator.name)
        .replace(/{VideoTitle}/g, latestVideoTitle)
        .replace(/{ChannelHandle}/g, finalCreator.handle);
        
      setPitchContent(compiled);
    } catch (err) {
      console.error("Error loading creator detail:", err);
      // Fallback load
      const defaultCreator = mockStore.getCreatorById(id);
      if (defaultCreator) {
        setCreator(defaultCreator);
        setCrmStatus(defaultCreator.crmStatus);
        const defaultSettings = mockStore.getSettings();
        const template = defaultSettings.pitchTemplate;
        const latestVideoTitle = defaultCreator.latestVideos?.[0]?.title || "recent uploads";
        const compiled = template
          .replace(/{CreatorName}/g, defaultCreator.name)
          .replace(/{VideoTitle}/g, latestVideoTitle)
          .replace(/{ChannelHandle}/g, defaultCreator.handle);
        setPitchContent(compiled);
      }
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [id]);

  if (!creator) {
    return (
      <div className="text-center p-12 bg-card border border-border-card rounded-2xl text-slate-400">
        Creator not found or loading... <Link href="/dashboard/sprint/results" className="text-primary hover:underline">Return to Results</Link>
      </div>
    );
  }

  // Update CRM Status
  const handleUpdatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let success = false;

      if (session) {
        // Update lead status
        let updateErr = null;
        if (crmStatus === "none") {
          const { error } = await supabase
            .from("leads")
            .delete()
            .eq("user_id", session.user.id)
            .eq("creator_id", creator.id);
          updateErr = error;
        } else {
          const { error } = await supabase
            .from("leads")
            .upsert({
              user_id: session.user.id,
              creator_id: creator.id,
              status: crmStatus
            }, { onConflict: "user_id,creator_id" });
          updateErr = error;
        }

        if (!updateErr) {
          success = true;
        } else {
          console.warn("Supabase lead pipeline update failed, falling back to mock store:", updateErr?.message);
        }
      }

      if (!success) {
        mockStore.updateCreatorCrmStatus(creator.id, crmStatus);
      }

      await loadCreatorData();
      setNotification("CRM Pipeline status updated successfully!");
      
      // Dispatch browser notifications
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("new-notification", {
            detail: {
              message: `CRM status for ${creator.name} updated to ${crmStatus === 'none' ? 'Not Tracked' : crmStatus}.`,
              type: "success"
            }
          })
        );
      }
    } catch (err: any) {
      console.error("Failed to update pipeline, falling back to mock store:", err);
      mockStore.updateCreatorCrmStatus(creator.id, crmStatus);
      await loadCreatorData();
      setNotification("CRM Pipeline status updated successfully!");
    }
    
    setTimeout(() => setNotification(null), 3000);
  };

  // Copy Pitch to clipboard
  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split uploads into Long Form and Shorts based on duration
  const getDurationSecs = (dStr: string): number => {
    const parts = dStr.split(":").map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const shorts = (creator.latestVideos || []).filter(v => getDurationSecs(v.duration) < 90);
  const longForm = (creator.latestVideos || []).filter(v => getDurationSecs(v.duration) >= 90);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-2 border-primary text-foreground text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-green-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <Link 
          href="/dashboard/sprint/results" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-foreground transition duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </Link>
      </div>

      {/* Creator Profile Header Card */}
      <div className="bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden">
        {/* Accent glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {creator.thumbnailUrl || (creator.avatar && (creator.avatar.startsWith("http://") || creator.avatar.startsWith("https://"))) ? (
              <img 
                src={creator.thumbnailUrl || creator.avatar} 
                alt={creator.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" 
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center font-bold text-primary text-xl">
                {creator.avatar || creator.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{creator.name}</h1>
                <span className="text-xs text-slate-400 font-mono">{creator.handle}</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                  {creator.niche} Niche
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {creator.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <a 
              href={`https://youtube.com/${creator.handle}`} 
              target="_blank" 
              rel="noreferrer" 
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-background border border-border-card hover:bg-slate-card text-xs font-semibold text-foreground transition duration-200"
            >
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <polygon points="10 15 15 12 10 9" fill="currentColor" />
              </svg>
              <span>Channel Page</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border-card p-4 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscribers</div>
          <div className="text-2xl font-extrabold text-foreground mt-1.5">
            {creator.subscribers.toLocaleString()}
          </div>
          <div className="text-[10px] text-green-400 mt-1 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +{creator.subGrowth}% velocity
          </div>
        </div>

        <div className="bg-card border border-border-card p-4 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Views</div>
          <div className="text-2xl font-extrabold text-foreground mt-1.5">
            {creator.avgViews.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Per recent upload
          </div>
        </div>

        <div className="bg-card border border-border-card p-4 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Videos Published</div>
          <div className="text-2xl font-extrabold text-foreground mt-1.5">
            {creator.videoCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Video className="w-3 h-3" /> Total library count
          </div>
        </div>

        <div className="bg-card border border-border-card p-4 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity Score</div>
          <div className="text-2xl font-extrabold text-primary mt-1.5">
            {creator.opportunityScore ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Target qualification rating
          </div>
        </div>
      </div>

      {/* Deep Audit & Pipeline Status Sync Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Audit & Videos) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identified Flaws Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Audited Editing Pain Points
            </h3>
            <div className="space-y-4">
              {creator.editingPainPoints.map((flaw, idx) => (
                <div key={idx} className="p-4 bg-background border border-border-card rounded-xl flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-foreground">{flaw}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Videos list partitioned */}
          <div className="bg-card border border-border-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Upload Audits</h3>
              <p className="text-xs text-slate-400 mt-1">Uploaded videos categorized by format</p>
            </div>

            {/* Long Form Videos Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Long Form Videos ({longForm.length})</h4>
              {longForm.length === 0 ? (
                <div className="text-xs text-slate-500 bg-background/50 border border-border-card/50 rounded-xl p-4 text-center">
                  No long form videos detected in recent uploads.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {longForm.map((video) => (
                    <a 
                      key={video.id} 
                      href={video.url || `https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background border border-border-card rounded-xl overflow-hidden hover:border-border-muted transition block group"
                    >
                      <div className="h-32 bg-card border-b border-border-card flex items-center justify-center relative">
                        <div className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center text-foreground group-hover:scale-110 transition duration-200">
                          ▶
                        </div>
                        <span className="absolute bottom-2 right-2 bg-background/90 text-[10px] text-foreground px-1.5 py-0.5 rounded font-mono border border-border-card">
                          {video.duration}
                        </span>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition">{video.title}</h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{video.views} views • {video.published}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Shorts Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shorts ({shorts.length})</h4>
              {shorts.length === 0 ? (
                <div className="text-xs text-slate-500 bg-background/50 border border-border-card/50 rounded-xl p-4 text-center">
                  No shorts detected in recent uploads.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shorts.map((video) => (
                    <a 
                      key={video.id} 
                      href={video.url || `https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background border border-border-card rounded-xl overflow-hidden hover:border-border-muted transition block group"
                    >
                      <div className="h-32 bg-card border-b border-border-card flex items-center justify-center relative">
                        <div className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center text-foreground group-hover:scale-110 transition duration-200">
                          ⚡
                        </div>
                        <span className="absolute bottom-2 right-2 bg-background/90 text-[10px] text-foreground px-1.5 py-0.5 rounded font-mono border border-border-card">
                          {video.duration}
                        </span>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition">{video.title}</h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{video.views} views • {video.published}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Pipeline Control & Pitch Generator) */}
        <div className="space-y-6">
          {/* Pipeline Controller */}
          <div className="bg-card border border-border-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              CRM Pipeline Control
            </h3>
            
            <form onSubmit={handleUpdatePipeline} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</label>
                <select
                  value={crmStatus}
                  onChange={(e) => setCrmStatus(e.target.value as Creator['crmStatus'])}
                  className="block w-full px-3 py-2 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
                >
                  <option value="none">Not Tracked (No Pipeline)</option>
                  <option value="lead">Lead Identified</option>
                  <option value="pitched">Outreach Sent / Pitched</option>
                  <option value="negotiating">In Negotiations</option>
                  <option value="signed">Active Retainer Signed</option>
                </select>
              </div>


              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition duration-200"
                >
                  Update Pipeline Status
                </button>
              </div>
            </form>
          </div>

          {/* Pitch Generator */}
          <div className="bg-card border border-border-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Personalized Pitch Draft
              </h3>
              <button 
                onClick={handleCopyPitch}
                className="p-1.5 rounded bg-background hover:bg-slate-card border border-border-card text-slate-400 hover:text-foreground transition"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <textarea
              value={pitchContent}
              onChange={(e) => setPitchContent(e.target.value)}
              rows={10}
              className="w-full p-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs font-mono resize-none leading-relaxed"
            />
            
            <div className="mt-3 text-[10px] text-slate-400">
              Personalized based on settings pitch template. Copy and customize details before sending to <strong className="text-foreground">{creator.email}</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
