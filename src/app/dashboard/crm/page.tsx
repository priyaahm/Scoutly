"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink,
  Calendar
} from "lucide-react";
import { Creator, mockStore } from "@/app/mockData";
import { supabase } from "@/lib/supabase";

type ColumnId = 'lead' | 'pitched' | 'negotiating' | 'signed';

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  bgBorder: string;
}

export default function CrmPipeline() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<ColumnId | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    setDraggedOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, nextStatus: ColumnId) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const creatorId = e.dataTransfer.getData("text/plain");
    if (!creatorId) return;

    const creator = creators.find(c => c.id === creatorId);
    if (creator && creator.crmStatus !== nextStatus) {
      await moveCard(creatorId, creator.name, nextStatus);
    }
  };

  const columns: Column[] = [
    { id: 'lead', title: 'Leads Locked', color: 'text-slate-400 bg-slate-500/10', bgBorder: 'border-border-card' },
    { id: 'pitched', title: 'Outreach Sent', color: 'text-amber-500 bg-amber-500/10', bgBorder: 'border-amber-500/20' },
    { id: 'negotiating', title: 'Negotiating', color: 'text-purple-500 bg-purple-500/10', bgBorder: 'border-purple-500/20' },
    { id: 'signed', title: 'Signed Contract', color: 'text-green-500 bg-green-500/10', bgBorder: 'border-green-500/20' }
  ];

  const loadCreators = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let leadsData: any[] | null = null;
      let leadsError: any = null;

      if (session) {
        const res = await supabase
          .from("leads")
          .select("*, creators(*)")
          .eq("user_id", session.user.id);
        leadsData = res.data;
        leadsError = res.error;
      }

      if (leadsData && !leadsError) {
        const mapped: Creator[] = leadsData
          .filter((l: any) => l.status !== "none" && l.creators)
          .map((l: any) => {
            const c = l.creators;
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
              crmStatus: l.status,
              opportunityScore: c.opportunity_score,
              lastContacted: l.status === "lead" ? "Never" : new Date(l.created_at).toISOString().split("T")[0],
              editingPainPoints: c.editing_pain_points || [],
              suggestedPitch: c.suggested_pitch || "",
              latestVideos: c.latest_videos || [],
              lastUploadDays: c.last_upload_days,
              uploadsLast30Days: c.uploads_last_30_days
            };
          });
        setCreators(mapped);
      } else {
        // Fallback to local storage crm creators
        const mockCreators = mockStore.getCreators();
        setCreators(mockCreators.filter(c => c.crmStatus !== "none"));
      }
    } catch (err) {
      console.error("Error loading CRM pipeline:", err);
      const mockCreators = mockStore.getCreators();
      setCreators(mockCreators.filter(c => c.crmStatus !== "none"));
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  // Calculate totals
  const totalLeadsCount = creators.length;
  const avgOpportunityScore = creators.length > 0 
    ? Math.round(creators.reduce((sum, c) => sum + (c.opportunityScore ?? 0), 0) / creators.length)
    : 0;

  // Transition creator to another column
  const moveCard = async (creatorId: string, name: string, nextStatus: ColumnId | 'none') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let success = false;

      if (session) {
        if (nextStatus === 'none') {
          const { error } = await supabase
            .from("leads")
            .delete()
            .eq("user_id", session.user.id)
            .eq("creator_id", creatorId);
          
          if (!error) success = true;
          else console.warn("Supabase lead delete failed, falling back to mock store:", error.message);
        } else {
          const { error } = await supabase
            .from("leads")
            .upsert({
              user_id: session.user.id,
              creator_id: creatorId,
              status: nextStatus
            }, { onConflict: "user_id,creator_id" });

          if (!error) success = true;
          else console.warn("Supabase lead upsert failed, falling back to mock store:", error.message);
        }
      }

      if (!success) {
        mockStore.updateCreatorCrmStatus(creatorId, nextStatus);
      }

      await loadCreators();

      let notifMsg = "";
      if (nextStatus === 'none') {
        notifMsg = `Removed ${name} from CRM pipeline.`;
      } else {
        const colName = columns.find(col => col.id === nextStatus)?.title;
        notifMsg = `Moved ${name} to ${colName}.`;
      }

      setNotification(notifMsg);
      
      // Emit global layout notification
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("new-notification", {
            detail: {
              message: notifMsg,
              type: nextStatus === 'none' ? "info" : "success"
            }
          })
        );
      }
    } catch (err) {
      console.error("Failed to move card:", err);
      mockStore.updateCreatorCrmStatus(creatorId, nextStatus);
      await loadCreators();
    }

    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  // Get next column ID
  const getNextColumn = (current: ColumnId): ColumnId | 'none' => {
    if (current === 'lead') return 'pitched';
    if (current === 'pitched') return 'negotiating';
    if (current === 'negotiating') return 'signed';
    return 'none';
  };

  // Get previous column ID
  const getPrevColumn = (current: ColumnId): ColumnId | 'none' => {
    if (current === 'signed') return 'negotiating';
    if (current === 'negotiating') return 'pitched';
    if (current === 'pitched') return 'lead';
    return 'none';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-2 border-primary text-foreground text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Mini Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">CRM Client Board</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track conversation milestones and manage your monthly retainer contract pipeline.
          </p>
        </div>

        {/* Board Stats */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-card border border-border-card rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</div>
            <div className="text-lg font-extrabold text-foreground mt-0.5">{totalLeadsCount} channels</div>
          </div>
          <div className="px-4 py-2 bg-card border border-primary/20 rounded-xl">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Avg Opportunity Score</div>
            <div className="text-lg font-extrabold text-green-500 mt-0.5">{avgOpportunityScore}/100</div>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const colCreators = creators.filter(c => c.crmStatus === col.id);
          
          return (
            <div key={col.id} className="space-y-4">
              {/* Column title and header count */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                    {colCreators.length}
                  </span>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {col.title}
                  </h3>
                </div>
              </div>

              {/* Column Cards Container */}
              <div 
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragEnter={(e) => handleDragEnter(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-3 bg-card/40 border ${col.bgBorder} rounded-2xl space-y-3 min-h-[450px] transition-all duration-300 ${
                  draggedOverColumn === col.id ? "bg-primary/5 border-primary/40 scale-[1.01]" : ""
                }`}
              >
                {colCreators.map((creator) => {
                  const prev = getPrevColumn(col.id);
                  const next = getNextColumn(col.id);

                  return (
                    <div 
                      key={creator.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, creator.id)}
                      className="bg-card border border-border-card rounded-xl p-4 hover:border-border-muted hover:shadow-lg cursor-grab active:cursor-grabbing transition duration-200 space-y-3.5 group relative"
                    >
                      {/* Name / Handle */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link 
                            href={`/dashboard/creator/${creator.id}`}
                            className="text-xs font-bold text-foreground hover:text-primary transition flex items-center gap-1"
                          >
                            {creator.name}
                            <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-mono">{creator.handle}</span>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                          {creator.niche}
                        </span>
                      </div>

                      {/* Financial / Date Stats */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          {creator.opportunityScore}/100 Opp
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          {creator.lastContacted === 'Never' ? 'Not contacted' : `Last: ${creator.lastContacted}`}
                        </span>
                      </div>

                      {/* Card Progression Buttons */}
                      <div className="flex items-center justify-between border-t border-border-card pt-3 text-[10px] text-slate-400">
                        {/* Remove from pipeline button */}
                        <button
                          onClick={() => moveCard(creator.id, creator.name, 'none')}
                          className="hover:text-red-400 transition"
                          title="Remove from CRM"
                        >
                          Remove
                        </button>

                        {/* Progression arrows */}
                        <div className="flex items-center gap-1.5">
                          {prev !== 'none' && (
                            <button
                              onClick={() => moveCard(creator.id, creator.name, prev as ColumnId)}
                              className="p-1 rounded bg-background hover:bg-slate-card border border-border-card hover:text-foreground transition"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {next !== 'none' && (
                            <button
                              onClick={() => moveCard(creator.id, creator.name, next as ColumnId)}
                              className="p-1 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary hover:text-foreground transition"
                              title="Move forward"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCreators.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-card rounded-xl text-slate-500 text-xs p-4 text-center">
                    <span>No prospects</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
