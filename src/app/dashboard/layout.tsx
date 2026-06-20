"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  PlusCircle, 
  ListFilter, 
  Users, 
  Bell
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { mockStore } from "@/app/mockData";

interface NotificationItem {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning";
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "welcome",
    message: "Welcome to Scoutly! Customize your pitch templates in Settings.",
    time: "Just now",
    read: false,
    type: "info"
  },
  {
    id: "preset-sprint",
    message: "Tech Discovery Sprint 'Tech Creators Under 100k' completed.",
    time: "1 hour ago",
    read: true,
    type: "success"
  },
  {
    id: "preset-crm",
    message: "DevonTech tracked as a lead in your CRM board.",
    time: "2 hours ago",
    read: true,
    type: "success"
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize notifications from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("scoutly_notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
        localStorage.setItem("scoutly_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    }
  }, []);

  // Save notifications helper
  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("scoutly_notifications", JSON.stringify(updated));
    }
  };

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const { message, type } = e.detail || { message: "", type: "info" };
      if (!message) return;

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        message,
        time: "Just now",
        read: false,
        type: type || "info"
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem("scoutly_notifications", JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener("new-notification" as any, handleNewNotification);
    return () => {
      window.removeEventListener("new-notification" as any, handleNewNotification);
    };
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const toggleNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    saveNotifications(updated);
  };

  // Search Modal states & effect
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const allCreators = mockStore.getCreators();
    if (searchQuery.trim() === "") {
      setSearchResults(allCreators.slice(0, 3));
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = allCreators.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.niche.toLowerCase().includes(q)
      );
      setSearchResults(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const checkSession = async (active = true) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const mockLoggedIn = typeof window !== "undefined" && localStorage.getItem("scoutly_mock_logged_in") === "true";

      if (!session && !mockLoggedIn) {
        if (active) {
          router.push("/login");
        }
        return;
      }

      let profileData: any = null;
      let profileError: any = null;

      if (session) {
        const res = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        profileData = res.data;
        profileError = res.error;

        // Sync local settings with session details if there is an email mismatch or it is the default
        const localSettings = mockStore.getSettings();
        if (session.user.email && localSettings.email !== session.user.email) {
          const newName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split("@")[0].split(/[._\-+]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "User";
          const newAvatar = newName.substring(0, 2).toUpperCase() || "US";
          mockStore.saveSettings({
            name: newName,
            email: session.user.email,
            avatar: newAvatar,
            portfolio: localSettings.portfolio || "",
            hourlyRate: localSettings.hourlyRate || 65,
            retainerRate: localSettings.retainerRate || 2500,
            pitchTemplate: localSettings.pitchTemplate || `Hey {CreatorName}!\n\nI really enjoyed your recent video '{VideoTitle}'. I've been following {ChannelHandle} and absolutely love your content.\n\nI noticed a small optimization that could boost retention by 15-20% in your first 30 seconds. I've put together a quick mockup edit of that section to show you what I mean.\n\nLet me know if you'd like to chat about upgrading your future edits!\n\nBest,\n${newName}`
          });
        }
      }

      if (active) {
        if (profileData && !profileError) {
          setProfile(profileData);
        } else {
          const localSettings = mockStore.getSettings();
          setProfile({
            email: localSettings.email || (session?.user?.email) || "alex@reededit.io",
            full_name: localSettings.name || "Alex Reed",
            avatar: localSettings.avatar || "AR",
            portfolio: localSettings.portfolio,
            hourly_rate: localSettings.hourlyRate,
            retainer_rate: localSettings.retainerRate,
            pitch_template: localSettings.pitchTemplate,
          });
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Session verification error:", err);
      if (active) {
        const localSettings = mockStore.getSettings();
        setProfile({
          email: localSettings.email || "alex@reededit.io",
          full_name: localSettings.name || "Alex Reed",
          avatar: localSettings.avatar || "AR",
        });
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    checkSession(active);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        if (active) {
          setProfile(null);
          router.push("/login");
        }
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (active) {
          checkSession(active);
        }
      }
    });

    const handleStorageUpdate = () => {
      checkSession(active);
    };
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [router]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("scoutly_mock_logged_in");
    }
    router.push("/login");
  };

  const settings = profile ? {
    name: profile.full_name || "Alex Reed",
    email: profile.email || "alex@reededit.io",
    avatar: profile.avatar || "AR",
    portfolio: profile.portfolio ?? "",
    hourlyRate: profile.hourly_rate ?? 0,
    retainerRate: profile.retainer_rate ?? 0,
    pitchTemplate: profile.pitch_template || "",
  } : null;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Create Sprint",
      href: "/dashboard/sprint/create",
      icon: PlusCircle,
    },
    {
      name: "Sprint Results",
      href: "/dashboard/sprint/results",
      icon: ListFilter,
    },
    {
      name: "CRM Pipeline",
      href: "/dashboard/crm",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Helper to determine active route
  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  // Helper to get Page Title
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    if (pathname === "/dashboard/sprint/create") return "Create Discovery Sprint";
    if (pathname === "/dashboard/sprint/results") return "Sprint Results";
    if (pathname.includes("/dashboard/creator/")) return "Creator Profile Analysis";
    if (pathname === "/dashboard/crm") return "CRM Lead Board";
    if (pathname === "/dashboard/settings") return "Editor Settings";
    return "Scoutly";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground animate-fadeIn">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border-card bg-background z-30 transition-all duration-300">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground flex items-center">
              Scoutly
            </span>
          </div>

          {/* Quick search button */}
          <div className="px-4 mt-6">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card hover:bg-slate-card border border-border-card text-left text-slate-400 text-xs transition duration-200 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search creators...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-card bg-background px-1.5 font-mono text-[10px] font-medium text-slate-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-card text-primary border-l-2 border-primary pl-2.5"
                      : "text-slate-400 hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors ${
                      active ? "text-primary" : "text-slate-400 group-hover:text-foreground"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Profile & Log out */}
          <div className="flex-shrink-0 flex border-t border-border-card p-4">
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
                  {settings?.avatar || "AR"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {settings?.name || "Alex Reed"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {settings?.email || "alex@reededit.io"}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200 text-left cursor-pointer"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Logout Profile
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Menu Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background border-r border-border-card pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>

            <div className="flex items-center flex-shrink-0 px-6 gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Scoutly</span>
            </div>

            <nav className="mt-8 flex-1 px-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-card text-primary border-l-2 border-primary pl-2.5"
                        : "text-slate-400 hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <item.icon className={`mr-4 h-5 w-5 ${active ? "text-primary" : "text-slate-400 group-hover:text-foreground"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-shrink-0 flex border-t border-border-card p-4">
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
                    {settings?.avatar || "AR"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {settings?.name || "Alex Reed"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {settings?.email || "alex@reededit.io"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200 text-left cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden md:pl-64">
        {/* Top Header */}
        <header className="h-14 border-b border-border-card bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-foreground hover:bg-card focus:outline-none"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            
            {/* Breadcrumb / Page Title */}
            <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-wide">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Sprint Ticker */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border-card text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-400">Scanner:</span>
              <span className="text-foreground font-medium">Ready</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-foreground hover:bg-card transition relative cursor-pointer"
              >
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                <Bell className="w-4 h-4" />
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border-card rounded-2xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-border-card">
                      <span className="text-xs font-bold text-foreground">Notifications</span>
                      <div className="flex gap-2">
                        {notifications.some(n => !n.read) && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-[10px] text-slate-400 hover:text-red-400 hover:underline font-semibold cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-border-card">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => toggleNotificationRead(n.id)}
                          className={`p-3 text-xs transition duration-150 cursor-pointer flex gap-2.5 ${n.read ? 'opacity-60 hover:opacity-100' : 'bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {n.type === 'success' ? (
                              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                            ) : n.type === 'warning' ? (
                              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-foreground leading-relaxed font-medium">{n.message}</p>
                            <span className="text-[10px] text-slate-500 font-semibold block">{n.time}</span>
                          </div>
                        </div>
                      ))}

                      {notifications.length === 0 && (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Inner page view container */}
        <main className="flex-grow overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background transition-colors duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery("");
            }}
          />
          <div className="bg-card border border-border-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-card">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search creators by name, handle, or niche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-foreground text-sm placeholder-slate-400 focus:outline-none focus:ring-0"
              />
              <button 
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                }}
                className="text-xs text-slate-500 hover:text-foreground border border-border-card bg-background px-1.5 py-0.5 rounded cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              <div className="text-[10px] font-bold text-slate-500 px-3 py-1 uppercase tracking-wider">
                {searchQuery ? "Search Results" : "Suggested Creators"}
              </div>
              <div className="space-y-1 mt-1">
                {searchResults.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/creator/${c.id}`}
                    onClick={() => {
                      setShowSearchModal(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-card/60 transition group cursor-pointer"
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
                          {c.avatar || c.name.substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.handle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                      {c.niche}
                    </span>
                  </Link>
                ))}

                {searchResults.length === 0 && (
                  <div className="text-center p-6 text-xs text-slate-500">
                    No creators found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
