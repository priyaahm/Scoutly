"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Calendar, 
  UserPlus, 
  Check, 
  Radio, 
  AlertTriangle,
  Trash2,
  ExternalLink,
  Zap
} from "lucide-react";
import { Creator, mockStore } from "@/app/mockData";
import { supabase } from "@/lib/supabase";
import { calculateRegionScore } from "@/lib/youtube";

function formatNumber(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`.replace('.0', '');
  }
  return num.toString();
}

function getCreatorRankScore(creator: Creator, subscribersFilter: string, regionFilter: string): number {
  if (creator.fitScore !== undefined) return creator.fitScore;

  const niche_confidence = creator.nicheConfidence ?? 70;
  const growth_score = creator.subGrowth ?? 12;
  const uploads30 = creator.uploadsLast30Days ?? 3;
  const region_score = creator.regionScore ?? 100;

  const nicheWeight = 0.40 * niche_confidence;

  const growthScale = Math.min(100, growth_score * 2);
  const growthWeight = 0.25 * growthScale;

  let freqScale = 0;
  if (uploads30 >= 9) freqScale = 100;
  else if (uploads30 >= 5) freqScale = 90;
  else if (uploads30 >= 3) freqScale = 75;
  else if (uploads30 >= 1) freqScale = 40;
  const freqWeight = 0.15 * freqScale;

  const subs = creator.subscribers;
  let subsMatchScore = 100;
  if (subscribersFilter !== "All") {
    let targetMin = 10000;
    let targetMax = 1000000;
    if (subscribersFilter === "10k-50k") { targetMin = 10000; targetMax = 50000; }
    else if (subscribersFilter === "50k-250k") { targetMin = 50000; targetMax = 250000; }
    else if (subscribersFilter === "250k-1M") { targetMin = 250000; targetMax = 1000000; }

    const inRange = subs >= targetMin && subs <= targetMax;
    if (!inRange) {
      const distance = subs < targetMin ? (targetMin - subs) : (subs - targetMax);
      const penalty = Math.min(90, (distance / targetMin) * 10);
      subsMatchScore = 100 - penalty;
    }
  }
  const subsWeight = 0.10 * subsMatchScore;

  const regionWeight = 0.10 * region_score;

  return Math.round(nicheWeight + growthWeight + freqWeight + subsWeight + regionWeight);
}

export default function SprintResults() {
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sprints and creators from Supabase or fallback
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Fetch Sprints
      let parsedSprints: any[] = [];
      let sprintsData: any[] | null = null;
      let sprintsError: any = null;

      if (session) {
        const res = await supabase
          .from("sprints")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        sprintsData = res.data;
        sprintsError = res.error;
      }

      if (session && sprintsError) {
        throw new Error(`Failed to load sprints: ${sprintsError.message}`);
      }

      if (sprintsData) {
        parsedSprints = sprintsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          date: new Date(s.created_at).toISOString().split("T")[0],
          niche: s.niche,
          subscribers: s.subscribers || "All",
          velocity: s.velocity || "All",
          edit_style: s.edit_style || "All",
          region: s.region || "Global",
          content_type: s.content_type || "Any",
          creatorsFoundCount: 0,
        }));
      } else {
        const mockSprints = mockStore.getSprints();
        parsedSprints = mockSprints.map((s: any) => ({
          id: s.id,
          name: s.name,
          date: s.date,
          niche: s.filters.niche,
          subscribers: s.filters.subscribers || "All",
          velocity: s.filters.velocity || "All",
          edit_style: s.filters.editStyle || "All",
          region: s.region || "Global",
          content_type: s.filters.contentType || "Any",
          creatorsFoundCount: s.creatorsFoundCount,
        }));
      }

      // 2. Fetch Leads & Creators
      let leadsData: any[] | null = null;
      let creatorsData: any[] | null = null;
      let creatorsError: any = null;

      if (session) {
        const resLeads = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", session.user.id);
        leadsData = resLeads.data;

        const resCreators = await supabase
          .from("creators")
          .select("*");
        creatorsData = resCreators.data;
        creatorsError = resCreators.error;
      }

      if (session && creatorsError) {
        throw new Error(`Failed to load creators: ${creatorsError.message}`);
      }

      let mappedCreators: Creator[] = [];
      if (session) {
        if (creatorsData) {
          mappedCreators = creatorsData.map((c: any) => {
            const matchedLead = leadsData?.find(l => l.creator_id === c.id);
            return {
              id: c.id,
              channelId: c.channel_id || "",
              name: c.channel_name,
              handle: c.handle,
              avatar: c.avatar,
              thumbnailUrl: c.thumbnail_url || "",
              subscribers: c.subscribers,
              subGrowth: c.growth_score,
              niche: c.niche,
              velocity: c.velocity || "Explosive",
              editStyle: c.edit_style || "Fast-cut",
              videoCount: c.video_count || 0,
              avgViews: c.average_views || 0,
              email: c.email,
              crmStatus: matchedLead ? matchedLead.status : "none",
              opportunityScore: c.opportunity_score,
              lastContacted: matchedLead ? (matchedLead.status === "lead" ? "Never" : new Date(matchedLead.created_at).toISOString().split("T")[0]) : "Never",
              editingPainPoints: c.editing_pain_points || [],
              suggestedPitch: c.suggested_pitch || "",
              latestVideos: c.latest_videos || [],
              primaryNiche: c.primary_niche,
              nicheConfidence: c.niche_confidence,
              contentType: c.content_type,
              regionScore: c.region_score,
              fitScore: c.fit_score,
              lastUploadDays: c.last_upload_days,
              uploadsLast30Days: c.uploads_last_30_days
            };
          });
        }
      } else {
        mappedCreators = mockStore.getCreators();
      }

      // Compute matches count client-side
      if (parsedSprints.length > 0) {
        parsedSprints = parsedSprints.map(s => {
          const matching = mappedCreators.filter(c => {
            let match = true;
            if (s.niche !== "All" && c.niche !== s.niche) match = false;
            if (s.edit_style !== "All" && c.editStyle !== s.edit_style) match = false;
            
            if (s.subscribers !== "All") {
              const subs = c.subscribers;
              if (s.subscribers === "10k-50k" && (subs < 10000 || subs > 50000)) match = false;
              if (s.subscribers === "50k-250k" && (subs < 50000 || subs > 250000)) match = false;
              if (s.subscribers === "250k-1M" && (subs < 250000 || subs > 1000000)) match = false;
            }

            if (s.velocity !== "All" && c.velocity !== s.velocity) match = false;
            if (s.content_type && s.content_type !== "Any" && c.contentType !== s.content_type) match = false;
            return match;
          });
          return {
            ...s,
            creatorsFoundCount: matching.length
          };
        });
      }

      setSprints(parsedSprints);
      setCreators(mappedCreators);

      if (parsedSprints.length > 0 && !selectedSprintId) {
        setSelectedSprintId(parsedSprints[0].id);
      }
    } catch (err: any) {
      console.error("Error loading results data:", err);
      setError(err.message || "Failed to load discovery results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rawSelectedSprint = sprints.find(s => s.id === selectedSprintId);
  const selectedSprint = rawSelectedSprint ? {
    ...rawSelectedSprint,
    region: rawSelectedSprint.region || "Global",
    filters: {
      niche: rawSelectedSprint.niche,
      subscribers: rawSelectedSprint.subscribers,
      velocity: rawSelectedSprint.velocity,
      editStyle: rawSelectedSprint.edit_style,
      contentType: rawSelectedSprint.content_type || "Any"
    }
  } : null;

  // Filter creators based on selected sprint criteria
  const getFilteredCreators = () => {
    if (!selectedSprint) return [];
    const filters = selectedSprint.filters;
    
    const filtered = creators.filter(c => {
      let match = true;
      if (filters.niche !== "All" && c.niche !== filters.niche) match = false;
      if (filters.editStyle !== "All" && c.editStyle !== filters.editStyle) match = false;
      
      // Subs
      if (filters.subscribers !== "All") {
        const subs = c.subscribers;
        if (filters.subscribers === "10k-50k" && (subs < 10000 || subs > 50000)) match = false;
        if (filters.subscribers === "50k-250k" && (subs < 50000 || subs > 250000)) match = false;
        if (filters.subscribers === "250k-1M" && (subs < 250000 || subs > 1000000)) match = false;
      }

      // Velocity
      if (filters.velocity !== "All" && c.velocity !== filters.velocity) match = false;

      // Content Type
      if (filters.contentType && filters.contentType !== "Any" && c.contentType !== filters.contentType) match = false;
      
      return match;
    });

    const uniqueCreators = Array.from(
      new Map(filtered.map(c => [c.channelId, c])).values()
    );

    // Sort descending by rank score (fitScore)
    uniqueCreators.sort((a, b) => 
      getCreatorRankScore(b, filters.subscribers, selectedSprint.region) - 
      getCreatorRankScore(a, filters.subscribers, selectedSprint.region)
    );

    return uniqueCreators;
  };

  const filteredCreators = getFilteredCreators();

  // Add creator to CRM
  const handleAddToCrm = async (creatorId: string, name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let success = false;
      if (session) {
        const { error } = await supabase
          .from("leads")
          .upsert({
            user_id: session.user.id,
            creator_id: creatorId,
            status: "lead"
          }, { onConflict: "user_id,creator_id" });

        if (!error) {
          success = true;
        } else {
          console.warn("Supabase track lead failed, falling back to mock store:", error.message);
        }
      }
      
      if (!success) {
        mockStore.updateCreatorCrmStatus(creatorId, "lead");
      }

      await loadData();
      setNotification(`${name} has been added to your CRM pipeline as a Lead!`);
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("new-notification", {
            detail: {
              message: `${name} has been added to your CRM pipeline as a Lead!`,
              type: "success"
            }
          })
        );
      }
    } catch (err) {
      console.error("Failed to add to CRM, falling back to mock store:", err);
      mockStore.updateCreatorCrmStatus(creatorId, "lead");
      await loadData();
      setNotification(`${name} has been added to your CRM pipeline as a Lead!`);
    }
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDeleteSprint = (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation();
    setSprintToDelete(sprintId);
  };

  const handleDeleteSprintConfirm = async () => {
    if (!sprintToDelete) return;
    const sprintId = sprintToDelete;
    setSprintToDelete(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let success = false;

      if (session) {
        const { error } = await supabase
          .from("sprints")
          .delete()
          .eq("id", sprintId);

        if (!error) {
          success = true;
        } else {
          console.warn("Supabase sprint delete failed, falling back to mock store:", error.message);
        }
      }

      mockStore.deleteSprint(sprintId);
      
      if (selectedSprintId === sprintId) {
        const remainingSprints = sprints.filter(s => s.id !== sprintId);
        if (remainingSprints.length > 0) {
          setSelectedSprintId(remainingSprints[0].id);
        } else {
          setSelectedSprintId("");
        }
      }

      await loadData();
      setNotification("Sprint deleted successfully!");
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("new-notification", {
            detail: {
              message: "Sprint deleted successfully!",
              type: "success"
            }
          })
        );
      }
    } catch (err: any) {
      console.error("Error deleting sprint:", err);
      mockStore.deleteSprint(sprintId);
      if (selectedSprintId === sprintId) {
        const remainingSprints = sprints.filter(s => s.id !== sprintId);
        if (remainingSprints.length > 0) {
          setSelectedSprintId(remainingSprints[0].id);
        } else {
          setSelectedSprintId("");
        }
      }
      await loadData();
      setNotification("Sprint deleted successfully!");
    }
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-2 border-primary text-foreground text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-green-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Discovery Results</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review matching channels for <span className="text-foreground font-semibold">{selectedSprint ? selectedSprint.region : "Global"}</span> and analyze their editing pain points to pitch.
          </p>
        </div>
        <Link 
          href="/dashboard/sprint/create" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-slate-card border border-border-card text-xs font-semibold text-foreground transition-all"
        >
          Run Another Scan
        </Link>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Sprints List Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sprint History</h2>
          <div className="space-y-2">
            {loading ? (
              // Sidebar Sprints Skeleton Loader
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-card/40 border border-border-card p-3.5 rounded-xl flex flex-col gap-2 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                  <div className="flex justify-between items-center mt-1">
                    <div className="h-3 bg-slate-850 rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-primary/10 rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))
            ) : sprints.map((s) => {
              const active = s.id === selectedSprintId;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSprintId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSprintId(s.id);
                    }
                  }}
                  className={`group relative w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active 
                      ? "bg-card border-primary/40 shadow-lg" 
                      : "bg-card/40 border-border-card hover:bg-card hover:border-border-muted"
                  }`}
                >
                  <div className="text-xs font-bold text-foreground truncate pr-6">{s.name}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 w-full">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {s.date}
                    </span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                      {s.creatorsFoundCount} match{s.creatorsFoundCount !== 1 && "es"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSprint(e, s.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer"
                    title="Delete Sprint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {!loading && sprints.length === 0 && (
              <div className="text-center p-6 bg-card border border-border-card rounded-xl text-slate-400 text-xs">
                No sprints run yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sprint details and matched creators */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <>
              {/* Sprint Filter Summary Skeleton */}
              <div className="bg-card border border-border-card rounded-2xl p-5 animate-pulse space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-border-card">
                  <div className="space-y-2 w-1/3">
                    <div className="h-5 bg-slate-800 rounded w-full animate-pulse" />
                    <div className="h-3 bg-slate-850 rounded w-2/3 animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-800 rounded-full w-16 animate-pulse" />
                    <div className="h-6 bg-slate-800 rounded-full w-16 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 bg-slate-850 rounded w-1/2 animate-pulse" />
              </div>

              {/* Creator Cards Skeleton */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identified Creators</h3>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border-card rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-full bg-slate-850 flex-shrink-0 animate-pulse" />
                      <div className="space-y-3.5 w-1/2">
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-slate-800 rounded w-1/3 animate-pulse" />
                          <div className="h-3 bg-slate-850 rounded w-1/4 animate-pulse" />
                        </div>
                        <div className="h-3 bg-slate-855 rounded w-3/4 animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-4 bg-slate-855 rounded w-20 animate-pulse" />
                          <div className="h-4 bg-slate-855 rounded w-20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="h-9 bg-slate-800 rounded-xl w-24 md:w-32 flex-shrink-0 self-end md:self-auto animate-pulse" />
                  </div>
                ))}
              </div>
            </>
          ) : error ? (
            <div className="bg-card border border-border-card rounded-2xl p-8 text-center max-w-md mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Failed to load sprint results</h3>
                <p className="text-xs text-slate-400 mt-2">{error}</p>
              </div>
              <button 
                onClick={loadData}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-xs font-semibold text-white rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : sprints.length === 0 ? (
            <div className="bg-card border border-border-card rounded-2xl p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto mt-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No Discovery Sprints Run Yet</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Start searching YouTube for creators in your niche. Filter by subscriber count, growth velocity, and editing styles.
              </p>
              <Link 
                href="/dashboard/sprint/create" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition-all shadow-md shadow-primary/15"
              >
                <Zap className="w-4 h-4" />
                Launch Your First Sprint
              </Link>
            </div>
          ) : selectedSprint ? (
            <>
              {/* Sprint Filter Summary Card */}
              <div className="bg-card border border-border-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-card">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedSprint.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Executed on {selectedSprint.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedSprint.region || "Global"} Region
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedSprint.filters.niche} Niche
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedSprint.filters.velocity} Growth
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedSprint.filters.editStyle} Style
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedSprint.filters.contentType === 'long-form' ? 'Long Form' : selectedSprint.filters.contentType === 'short-form' ? 'Shorts' : selectedSprint.filters.contentType === 'mixed' ? 'Mixed' : 'Any Format'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Audited database match count: <strong className="text-foreground font-semibold">{filteredCreators.length}</strong> channels</span>
                  <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-green-500" /> Database Live Synchronized</span>
                </div>
              </div>

              {/* Matched Creators Card List */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identified Creators</h3>
                
                {filteredCreators.map((creator) => {
                  const inCrm = creator.crmStatus !== 'none';
                  return (
                    <div 
                      key={creator.id} 
                      className="bg-card border border-border-card rounded-2xl p-5 hover:border-border-muted transition duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      {/* Creator Channel profile */}
                      <div className="flex items-center gap-4">
                        {creator.thumbnailUrl || (creator.avatar && (creator.avatar.startsWith("http://") || creator.avatar.startsWith("https://"))) ? (
                          <img 
                            src={creator.thumbnailUrl || creator.avatar} 
                            alt={creator.name} 
                            className="w-12 h-12 rounded-full object-cover border border-primary/30 flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                            {creator.avatar || creator.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-foreground">
                              {creator.name}
                            </h4>
                            <a 
                              href={`https://youtube.com/${creator.handle}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-slate-400 hover:text-primary font-mono transition duration-150 flex items-center gap-0.5"
                              title="Open YouTube Channel"
                            >
                              {creator.handle}
                              <ExternalLink className="w-3 h-3 text-slate-500 hover:text-primary" />
                            </a>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1.5">
                            <span>Subs: <strong className="text-foreground font-semibold">{formatNumber(creator.subscribers)}</strong></span>
                            <span className="text-slate-650">•</span>
                            <span>Avg Views: <strong className="text-foreground font-semibold">{formatNumber(creator.avgViews)}</strong></span>
                            <span className="text-slate-650">•</span>
                            <span>Videos: <strong className="text-foreground font-semibold">{formatNumber(creator.videoCount)}</strong></span>
                            <span className="text-slate-650">•</span>
                            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {creator.niche}
                            </span>
                            {creator.subGrowth > 0 && (
                              <>
                                <span className="text-slate-650">•</span>
                                <span className="text-green-400 font-medium flex items-center gap-0.5">
                                  <TrendingUp className="w-3 h-3" /> +{creator.subGrowth}%
                                </span>
                              </>
                            )}
                          </div>

                          {/* Qualification Metrics */}
                          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-slate-900/40 border border-border-card/50 rounded-xl p-2.5 text-[11px] w-full">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Fit Score</span>
                              <strong className="text-primary font-bold text-xs">{creator.fitScore ?? getCreatorRankScore(creator, selectedSprint.filters.subscribers, selectedSprint.region)}/100</strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Opportunity</span>
                              <strong className="text-primary font-bold text-xs">{creator.opportunityScore ?? 0}/100</strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Last Upload</span>
                              <strong className="text-foreground font-semibold">
                                {creator.lastUploadDays !== undefined 
                                  ? (creator.lastUploadDays === 0 ? "Today" : creator.lastUploadDays === 1 ? "Yesterday" : `${creator.lastUploadDays}d ago`)
                                  : "N/A"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Uploads (30d)</span>
                              <strong className="text-foreground font-semibold">{creator.uploadsLast30Days ?? 0}</strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Content Type</span>
                              <strong className="text-foreground font-semibold">
                                {creator.contentType === 'long-form' ? 'Long Form' : creator.contentType === 'short-form' ? 'Shorts' : 'Mixed'}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Region Match</span>
                              <strong className="text-foreground font-semibold">{creator.regionScore ?? 100}%</strong>
                            </div>
                          </div>

                          {/* Identified Flaws Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {creator.editingPainPoints.slice(0, 2).map((flaw, idx) => (
                              <span 
                                key={idx} 
                                className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-medium max-w-[200px] truncate"
                                title={flaw}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                                {flaw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto border-t border-border-card pt-4 md:border-t-0 md:pt-0 justify-end">
                        <Link 
                          href={`/dashboard/creator/${creator.id}`}
                          className="px-4 py-2 rounded-xl border border-border-card hover:bg-slate-card text-xs font-semibold text-foreground transition duration-200"
                        >
                          View Analysis
                        </Link>

                        {inCrm ? (
                          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/20 text-xs font-semibold text-green-400 cursor-default select-none">
                            <Check className="w-3.5 h-3.5" />
                            <span>In CRM Board</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCrm(creator.id, creator.name)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition duration-200"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Track Lead</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredCreators.length === 0 && (
                  <div className="bg-card border border-border-card rounded-2xl p-8 text-center text-slate-400 text-sm space-y-3">
                    <p>No creators matched these filters in this database scan.</p>
                    <Link href="/dashboard/sprint/create" className="text-primary hover:underline font-semibold text-xs block">
                      Edit Sprint Filters &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-card border border-border-card rounded-2xl p-8 text-center text-slate-400 text-sm">
              Please select a sprint from the history sidebar or launch a new scan.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sprintToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border-card rounded-2xl max-w-sm w-full p-6 shadow-2xl scale-in duration-200 animate-in fade-in zoom-in-95 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete scan sprint?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to delete this scan sprint? This action cannot be undone and this search result history will be permanently deleted.
              </p>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setSprintToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border-card hover:bg-slate-card text-xs font-semibold text-foreground transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSprintConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-200 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
