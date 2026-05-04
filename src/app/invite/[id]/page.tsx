"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChefHat, Users, Check, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { getInvitationDetailsAction, acceptInvitationAction } from "@/app/actions/recipes";

export default function InvitePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchInviteDetails();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      const result = await getInvitationDetailsAction(id as string);
      
      if (!result.success) {
        setError(result.error || "Nepodarilo sa načítať pozvánku.");
      } else if (!result.invitation) {
        setError("Táto pozvánka je neplatná alebo už bola použitá.");
      } else {
        setInvitation(result.invitation);
      }
    } catch (err: any) {
      console.error("Invite Fetch Error:", err);
      setError("Chyba pri načítaní pozvánky.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push(`/register?returnTo=/invite/${id}`);
      return;
    }

    try {
      setIsJoining(true);
      const result = await acceptInvitationAction(
        id as string, 
        user.id, 
        user.user_metadata?.full_name || user.user_metadata?.name || null
      );

      if (result.success) {
        router.push("/household");
      } else {
        alert(result.error || "Nepodarilo sa pripojiť k domácnosti.");
      }
    } catch (err: any) {
      console.error("Join Error:", err);
      alert("Chyba pri pripájaní.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-sage-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Pripravujem vašu pozvánku...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ups! Niečo nie je v poriadku</h1>
        <p className="text-gray-500 mb-8 max-w-sm">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/dashboard" className="px-8 py-4 bg-sage-500 text-white rounded-2xl font-bold shadow-lg hover:bg-sage-600 transition-all">
            Ísť do aplikácie
          </Link>
          <Link href="/" className="px-8 py-2 text-gray-400 font-bold hover:text-gray-600 transition-all">
            Domovská stránka
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-sage-100/50 overflow-hidden p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-sage-500 rounded-[28px] flex items-center justify-center text-white shadow-xl">
              <ChefHat size={48} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-sage-600">
              <Users size={20} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
          Pozvánka do domácnosti
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          Boli ste pozvaní pripojiť sa k domácnosti:
        </p>

        <div className="bg-sage-50 rounded-2xl p-6 mb-10 border border-sage-100">
          <h2 className="text-2xl font-black text-sage-700">
            {invitation?.households?.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-sage-600/70 text-xs font-bold uppercase tracking-widest">
            <Check size={14} /> Spoločné varenie a recepty
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-5 bg-sage-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-sage-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Pripájam sa...
              </>
            ) : (
              <>
                {user ? "Prijať pozvánku" : "Zaregistrovať sa a prijať"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
          
          <p className="text-gray-400 text-xs font-medium px-6">
            Prijatím pozvánky súhlasíte so zdieľaním vašich stravovacích preferencií s ostatnými členmi tejto domácnosti.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm font-medium">
        Powered by <span className="font-bold text-gray-500">ČoUvarím.sk</span>
      </p>
    </div>
  );
}
