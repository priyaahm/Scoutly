"use client";

import React, { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Link as LinkIcon, 
  DollarSign, 
  FileText, 
  CheckCircle
} from "lucide-react";
import { EditorSettings, mockStore } from "@/app/mockData";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const [settings, setSettings] = useState<EditorSettings | null>(null);
  
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [retainerRate, setRetainerRate] = useState(0);
  const [pitchTemplate, setPitchTemplate] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        let profileData: any = null;
        if (session) {
          const res = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          profileData = res.data;
        }

        const defaultSettings = mockStore.getSettings();

        const currentName = profileData?.full_name || defaultSettings.name;
        let template = profileData?.pitch_template || defaultSettings.pitchTemplate;
        if (template && template.endsWith("\nAlex") && currentName) {
          const namePart = currentName.split(" ")[0];
          if (namePart !== "Alex") {
            template = template.substring(0, template.length - 4) + namePart;
          }
        }

        const mappedSettings = {
          name: currentName,
          email: profileData?.email || defaultSettings.email,
          portfolio: profileData?.portfolio ?? defaultSettings.portfolio,
          avatar: profileData?.avatar || defaultSettings.avatar,
          hourlyRate: profileData?.hourly_rate ?? defaultSettings.hourlyRate,
          retainerRate: profileData?.retainer_rate ?? defaultSettings.retainerRate,
          pitchTemplate: template,
        };

        setSettings(mappedSettings);
        setName(mappedSettings.name);
        setEmail(mappedSettings.email);
        setPortfolio(mappedSettings.portfolio);
        setHourlyRate(mappedSettings.hourlyRate);
        setRetainerRate(mappedSettings.retainerRate);
        setPitchTemplate(mappedSettings.pitchTemplate);
      } catch (err) {
        console.error("Failed to load settings from Supabase, loading from mock store:", err);
        const defaultSettings = mockStore.getSettings();
        
        const currentName = defaultSettings.name;
        let template = defaultSettings.pitchTemplate;
        if (template && template.endsWith("\nAlex") && currentName) {
          const namePart = currentName.split(" ")[0];
          if (namePart !== "Alex") {
            template = template.substring(0, template.length - 4) + namePart;
          }
        }

        setSettings({
          ...defaultSettings,
          pitchTemplate: template
        });
        setName(defaultSettings.name);
        setEmail(defaultSettings.email);
        setPortfolio(defaultSettings.portfolio);
        setHourlyRate(defaultSettings.hourlyRate);
        setRetainerRate(defaultSettings.retainerRate);
        setPitchTemplate(template);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const updated: EditorSettings = {
      name,
      email,
      portfolio,
      avatar: initials || "AR",
      hourlyRate,
      retainerRate,
      pitchTemplate
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let success = false;
      
      if (session) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: name,
            email,
            portfolio,
            avatar: initials || "AR",
            hourly_rate: hourlyRate,
            retainer_rate: retainerRate,
            pitch_template: pitchTemplate
          })
          .eq("id", session.user.id);

        if (!error) {
          success = true;
        } else {
          console.warn("Supabase profile update failed, falling back to mock store:", error.message);
        }
      }

      // Always save to mockStore settings fallback to keep them synchronized
      mockStore.saveSettings(updated);

      setSettings(updated);

      // Trigger page re-draw/dispatch event so layout sidebar picks up changes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("new-notification", {
            detail: {
              message: "Settings updated successfully!",
              type: "success"
            }
          })
        );
      }

      setNotification("Settings updated successfully! Layout updated.");
    } catch (err: any) {
      setNotification("Error: " + err.message);
    }

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-2 border-primary text-foreground text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your outbound portfolio, outreach templates, and billing rates.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Profile & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border-card pb-2">
              Editor Profile Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-border-card rounded-xl bg-background text-foreground text-xs focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-border-card rounded-xl bg-background text-foreground text-xs focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Portfolio Link</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border-card rounded-xl bg-background text-foreground text-xs focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Pricing Config Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border-card pb-2">
              Billing & Rates Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Target Hourly Rate ($)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 border border-border-card rounded-xl bg-background text-foreground text-xs focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Target Monthly Retainer ($)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    value={retainerRate}
                    onChange={(e) => setRetainerRate(Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 border border-border-card rounded-xl bg-background text-foreground text-xs focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form: Pitch Template */}
        <div className="space-y-6">
          {/* Pitch Template Card */}
          <div className="bg-card border border-border-card rounded-2xl p-6 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border-card pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Default Pitch Template
              </h3>

              <div className="space-y-1.5">
                <textarea
                  value={pitchTemplate}
                  onChange={(e) => setPitchTemplate(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-border-card rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs font-mono resize-none leading-relaxed"
                />
              </div>

              {/* Dynamic tag explanation */}
              <div className="p-3 bg-background border border-border-card rounded-xl space-y-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-foreground">Dynamic variables supported:</span>
                <div className="grid grid-cols-1 gap-1">
                  <div><code className="text-primary">{`{CreatorName}`}</code> - Channel owner name</div>
                  <div><code className="text-primary">{`{VideoTitle}`}</code> - Target video headline</div>
                  <div><code className="text-primary">{`{ChannelHandle}`}</code> - YouTube @handle</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-border-card flex justify-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition duration-200 shadow-md shadow-primary/20"
              >
                Save All Settings
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
