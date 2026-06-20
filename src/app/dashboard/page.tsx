"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Search, 
  Users, 
  ListFilter, 
  Zap, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  Sparkles,
  BarChart3
} from "lucide-react";
import { EditorSettings, Creator, mockStore } from "../mockData";
import { supabase } from "@/lib/supabase";

export default function DashboardOverview() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [settings, setSettings] = useState<EditorSettings | null>(null);
  const [sprintCount, setSprintCount] = useState(0);
  const [sprintNiches, setSprintNiches] = useState("No sprints yet");
  const [newCreatorsCount, setNewCreatorsCount] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [inPipeline, setInPipeline] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [activeRetainers, setActiveRetainers] = useState(0);
  const [pipelineByStage, setPipelineByStage] = useState({
    lead: 0,
    pitched: 0,
    negotiating: 0,
    signed: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Fetch User Settings/Profile
        let profile: any = null;
        if (session) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          profile = data;
        }

        if (profile) {
          setSettings({
            name: profile.full_name || "Alex Reed",
            email: profile.email || "alex@reededit.io",
            avatar: profile.avatar || "AR",
            portfolio: profile.portfolio ?? "",
            hourlyRate: profile.hourly_rate ?? 0,
            retainerRate: profile.retainer_rate ?? 0,
            pitchTemplate: profile.pitch_template || "",
          });
        } else {
          setSettings(mockStore.getSettings());
        }

        // Fetch Sprints Count and Niches
        let fetchedSprints: any[] = [];
        let countSprintsError: any = null;
        if (session) {
          const { data, error } = await supabase
            .from("sprints")
            .select("*")
            .eq("user_id", session.user.id);
          fetchedSprints = data || [];
          countSprintsError = error;
        }

        if (countSprintsError || !session) {
          const mockSprints = mockStore.getSprints();
          setSprintCount(mockSprints.length);
          const activeNiches = Array.from(new Set(mockSprints.map(s => s.filters.niche))).filter(Boolean).slice(0, 3).join(", ");
          setSprintNiches(activeNiches ? `Niches: ${activeNiches}` : "No sprints yet");
        } else {
          setSprintCount(fetchedSprints.length);
          const activeNiches = Array.from(new Set(fetchedSprints.map((s: any) => s.niche))).filter(Boolean).slice(0, 3).join(", ");
          setSprintNiches(activeNiches ? `Niches: ${activeNiches}` : "No sprints yet");
        }

        // Fetch Leads to calculate CRM stats
        let leadsData: any[] | null = null;
        if (session) {
          const { data } = await supabase
            .from("leads")
            .select("*, creators(*)")
            .eq("user_id", session.user.id);
          leadsData = data;
        }

        let activeLeads: any[] = [];
        let stageValues = { lead: 0, pitched: 0, negotiating: 0, signed: 0 };
        if (leadsData) {
          activeLeads = leadsData.filter(l => l.status !== "none");
          setInPipeline(activeLeads.length);
          
          const avgOpp = activeLeads.length > 0
            ? Math.round(activeLeads.reduce((sum, l) => sum + (l.creators?.opportunity_score || 0), 0) / activeLeads.length)
            : 0;
          setPipelineValue(avgOpp);

          const signedCount = activeLeads.filter(l => l.status === "signed").length;
          setActiveRetainers(signedCount);

          activeLeads.forEach(l => {
            const status = l.status as keyof typeof stageValues;
            if (stageValues[status] !== undefined) {
              stageValues[status]++;
            }
          });
        } else {
          const mockCreators = mockStore.getCreators();
          activeLeads = mockCreators.filter(c => c.crmStatus !== "none");
          setInPipeline(activeLeads.length);
          
          const avgOpp = activeLeads.length > 0
            ? Math.round(activeLeads.reduce((sum, c) => sum + (c.opportunityScore ?? 0), 0) / activeLeads.length)
            : 0;
          setPipelineValue(avgOpp);

          const signedCount = activeLeads.filter(c => c.crmStatus === "signed").length;
          setActiveRetainers(signedCount);

          activeLeads.forEach(c => {
            const status = c.crmStatus as keyof typeof stageValues;
            if (stageValues[status] !== undefined) {
              stageValues[status]++;
            }
          });
        }
        setPipelineByStage(stageValues);

        // Fetch Total Creators Scanned and calculate weekly additions
        let countCreators: number | null = null;
        let recentCreators: any[] | null = null;
        let allCreators: any[] = [];
        if (session) {
          const { data } = await supabase
            .from("creators")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) {
            allCreators = data;
            countCreators = data.length;
            recentCreators = data.slice(0, 4);
          }
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        let newThisWeek = 0;

        if (session && allCreators.length > 0) {
          setTotalLeads(countCreators || 0);
          newThisWeek = allCreators.filter(c => new Date(c.created_at) >= sevenDaysAgo).length;
        } else {
          const mockCreators = mockStore.getCreators();
          setTotalLeads(mockCreators.length);
          newThisWeek = mockCreators.filter(c => {
            if (c.id.startsWith("cr-")) {
              const ts = parseInt(c.id.split("-")[1]);
              if (!isNaN(ts)) return ts >= sevenDaysAgo.getTime();
            }
            return false;
          }).length;
        }
        setNewCreatorsCount(newThisWeek);

        if (recentCreators) {
          const mappedCreators = recentCreators.map((c: any) => {
            const matchedLead = leadsData?.find(l => l.creator_id === c.id);
            return {
              id: c.id,
              channelId: c.channel_id || "",
              name: c.channel_name,
              handle: c.handle,
              avatar: c.avatar || c.channel_name.substring(0, 2).toUpperCase(),
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
              lastUploadDays: c.last_upload_days,
              uploadsLast30Days: c.uploads_last_30_days
            };
          });
          setCreators(mappedCreators);
        } else {
          setCreators(mockStore.getCreators().slice(0, 4));
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome & Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {settings?.name || "Alex"}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Your discovery scanner is running. You have {totalLeads} creators unlocked, with {inPipeline} in your active pipeline.
          </p>
        </div>
        <Link 
          href="/dashboard/sprint/create" 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold text-white transition-all shadow-md shadow-primary/10"
        >
          <Zap className="w-4 h-4" />
          Launch New Sprint
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-card border border-border-card p-5 rounded-2xl flex flex-col justify-between hover:border-border-muted transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sprints</span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary"><ListFilter className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-foreground">{sprintCount}</div>
            <div className="text-xs text-slate-400 mt-1">{sprintNiches}</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-card border border-border-card p-5 rounded-2xl flex flex-col justify-between hover:border-border-muted transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Creators Scanned</span>
            <span className="p-1.5 rounded-lg bg-green-500/10 text-green-400"><Search className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-foreground">{totalLeads}</div>
            <div className="text-xs text-green-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +{newCreatorsCount} new this week
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-card border border-border-card p-5 rounded-2xl flex flex-col justify-between hover:border-border-muted transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Opportunity Score</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-foreground">
              {pipelineValue}/100
            </div>
            <div className="text-xs text-slate-400 mt-1">{inPipeline} active prospects tracked</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-card border border-border-card p-5 rounded-2xl flex flex-col justify-between hover:border-border-muted transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed Contracts</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-foreground">
              {activeRetainers} signed
            </div>
            <div className="text-xs text-slate-400 mt-1">Retainer targets completed</div>
          </div>
        </div>
      </div>

      {/* Main Analytics + Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analytics Chart & Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Pipeline Stages Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Number of channels tracked at each CRM pipeline stage</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-500" />
            </div>

            {/* Custom SVG Bar Chart of Real CRM Stages */}
            <div className="h-48 w-full flex items-end justify-between gap-4 pt-4 relative">
              {/* Y Axis Guide Lines */}
              <div className="absolute inset-x-0 bottom-0 border-b border-border-card" />
              <div className="absolute inset-x-0 bottom-16 border-b border-border-card border-dashed" />
              <div className="absolute inset-x-0 bottom-32 border-b border-border-card border-dashed" />

              {/* Data Bars */}
              {[
                { stage: "Leads Locked", val: pipelineByStage.lead, color: "bg-slate-400" },
                { stage: "Outreach Sent", val: pipelineByStage.pitched, color: "bg-amber-500" },
                { stage: "Negotiating", val: pipelineByStage.negotiating, color: "bg-purple-500" },
                { stage: "Signed Retainers", val: pipelineByStage.signed, color: "bg-primary" }
              ].map((item, idx) => {
                const maxVal = Math.max(pipelineByStage.lead, pipelineByStage.pitched, pipelineByStage.negotiating, pipelineByStage.signed, 1);
                const heightPercent = Math.min(Math.max((item.val / maxVal) * 100, 10), 100);
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative z-10 group">
                    {/* Tooltip value */}
                    <div className="absolute -top-6 bg-background border border-border-card text-[10px] text-foreground px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-200">
                      {item.val} channel{item.val !== 1 && "s"}
                    </div>
                    
                    {/* Visual Bar */}
                    <div 
                      className={`w-full max-w-[65px] rounded-t-lg ${item.color} opacity-80 group-hover:opacity-100 transition duration-300`} 
                      style={{ height: `${heightPercent}%` }} 
                    />
                    
                    <span className="text-[10px] font-semibold text-slate-500 text-center truncate w-full" title={item.stage}>{item.stage}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-foreground mb-4">Quick Outbound Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/dashboard/sprint/create" 
                className="p-4 bg-background border border-border-card hover:border-primary/40 rounded-xl flex flex-col gap-2 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Zap className="w-4 h-4" /></div>
                <div className="text-xs font-semibold text-foreground">Discovery Sprint</div>
                <p className="text-[10px] text-slate-400">Launch YouTube channel analysis</p>
              </Link>
              <Link 
                href="/dashboard/crm" 
                className="p-4 bg-background border border-border-card hover:border-primary/40 rounded-xl flex flex-col gap-2 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><Users className="w-4 h-4" /></div>
                <div className="text-xs font-semibold text-foreground">CRM Pipeline</div>
                <p className="text-[10px] text-slate-400">Track and progress warm leads</p>
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="p-4 bg-background border border-border-card hover:border-primary/40 rounded-xl flex flex-col gap-2 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><MessageSquare className="w-4 h-4" /></div>
                <div className="text-xs font-semibold text-foreground">Pitch Templates</div>
                <p className="text-[10px] text-slate-400">Customize emails for outreach</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Creator Alerts */}
        <div className="space-y-6">
          <div className="bg-card border border-border-card rounded-2xl p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-foreground">Recent Discovery Scans</h3>
                <Link href="/dashboard/sprint/results" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Lead rows */}
              <div className="space-y-3">
                {creators.slice(0, 4).map((c) => (
                  <Link 
                    key={c.id} 
                    href={`/dashboard/creator/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border-card hover:border-primary/40 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.avatar && (c.avatar.startsWith("http://") || c.avatar.startsWith("https://")) ? (
                        <img 
                          src={c.avatar} 
                          alt={c.name} 
                          className="w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {c.avatar}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.handle} • {c.niche}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                        +{c.subGrowth}%
                      </span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {c.subscribers >= 100000 ? `${(c.subscribers/1000).toFixed(0)}k` : `${(c.subscribers/1000).toFixed(0)}k`} subs
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 p-3 bg-primary/5 border border-primary/10 rounded-xl flex gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <span className="font-semibold text-foreground block">Outbound Tip:</span>
                Creators with explosive velocity are 3x more likely to buy retainer services to keep up with upload demand.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
