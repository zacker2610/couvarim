"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error.message);
        router.push("/login?error=auth_failed");
        return;
      }

      if (data.session) {
        console.log("✅ Session found, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        // If no session yet, maybe it's still processing or we need to wait
        console.log("Waiting for session...");
        
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            console.log("✅ Signed in event, redirecting to dashboard");
            router.push("/dashboard");
            subscription.unsubscribe();
          }
        });
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-sage-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sage-700 font-medium animate-pulse">Dokončujem prihlásenie...</p>
    </div>
  );
}
