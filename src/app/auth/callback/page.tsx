"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth callback session fetch error:", error.message);
          router.push("/login");
          return;
        }

        if (session) {
          // Verify and upsert user profile in public.profiles
          const fullName = session.user.user_metadata.full_name || 
                           session.user.user_metadata.name || 
                           session.user.email?.split("@")[0] || 
                           "User";
          const avatar = fullName.substring(0, 2).toUpperCase();
          
          try {
            await supabase.from("profiles").upsert({
              id: session.user.id,
              email: session.user.email || "",
              full_name: fullName,
              avatar: avatar,
              hourly_rate: 0,
              retainer_rate: 0,
            });
          } catch (profileErr) {
            console.error("Failed to upsert profile in callback, continuing:", profileErr);
          }

          router.push("/dashboard");
        } else {
          // If no session is returned immediately, wait a bit in case Supabase is parsing URL hash
          const timeout = setTimeout(async () => {
            const { data: { session: secondCheck } } = await supabase.auth.getSession();
            if (secondCheck) {
              const fullName = secondCheck.user.user_metadata.full_name || 
                               secondCheck.user.user_metadata.name || 
                               secondCheck.user.email?.split("@")[0] || 
                               "User";
              const avatar = fullName.substring(0, 2).toUpperCase();
              
              try {
                await supabase.from("profiles").upsert({
                  id: secondCheck.user.id,
                  email: secondCheck.user.email || "",
                  full_name: fullName,
                  avatar: avatar,
                  hourly_rate: 0,
                  retainer_rate: 0,
                });
              } catch (profileErr) {
                console.error("Failed to upsert profile in second check, continuing:", profileErr);
              }

              router.push("/dashboard");
            } else {
              router.push("/login");
            }
          }, 1500);

          return () => clearTimeout(timeout);
        }
      } catch (err) {
        console.error("Callback unexpected error:", err);
        router.push("/login");
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Completing sign-in...</p>
      </div>
    </div>
  );
}
