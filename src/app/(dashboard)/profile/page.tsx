"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Save, 
  AlertCircle, 
  Check,
  ChefHat,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COMMON_INTOLERANCES, DIETARY_PREFERENCES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    preferences: {
      intolerances: [] as string[],
      diet: [] as string[]
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            preferences: profileData.preferences || { intolerances: [], diet: [] }
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const toggleIntolerance = (tag: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        intolerances: prev.preferences.intolerances.includes(tag)
          ? prev.preferences.intolerances.filter(t => t !== tag)
          : [...prev.preferences.intolerances, tag]
      }
    }));
  };

  const toggleDiet = (tag: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        diet: prev.preferences.diet.includes(tag)
          ? prev.preferences.diet.filter(t => t !== tag)
          : [...prev.preferences.diet, tag]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        preferences: profile.preferences,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      alert("Chyba pri ukladaní: " + error.message);
    } else {
      setShowSuccess(true);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sage-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-6 relative">
      {/* Native-feel Header */}
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center justify-between py-4 px-2 -mx-2 mb-2">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Nastavenia</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-sage-500 text-sage-50 px-5 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 hover:bg-sage-600"
        >
          {saving ? <div className="w-4 h-4 border-2 border-sage-50/30 border-t-sage-50 rounded-full animate-spin" /> : <Check size={18} />}
          Uložiť
        </button>
      </header>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-50 bg-sage-500 text-sage-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-sage-400/50"
          >
            <Check size={20} />
            <span className="font-bold">Nastavenia boli uložené</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Basic Info Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-sage-50 text-sage-600 rounded-lg flex items-center justify-center">
              <User size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Osobné údaje</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Meno a priezvisko</label>
              <input 
                type="text" 
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Vaše meno"
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-sage-400 outline-none transition-all text-gray-800"
              />
            </div>
            <div className="space-y-1.5 opacity-60">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Prihlasovací email</label>
              <input 
                type="text" 
                value={user?.email || ""} 
                disabled
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-transparent outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Intolerances Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Moje intolerancie</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {COMMON_INTOLERANCES.map((item) => {
              const isSelected = profile.preferences.intolerances.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleIntolerance(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-sage-500 border-sage-500 text-sage-50 shadow-md' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-sage-200'
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        {/* Diet Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <ChefHat size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Stravovacie návyky</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {DIETARY_PREFERENCES.map((item) => {
              const isSelected = profile.preferences.diet.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleDiet(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-sage-600 border-sage-600 text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-sage-200'
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        {/* Logout Section */}
        <section className="pt-8 pb-12">
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-white text-red-400 rounded-2xl font-medium flex items-center justify-center gap-2 active:bg-red-50 transition-all border border-gray-100 shadow-sm"
          >
            <LogOut size={18} />
            Odhlásiť sa
          </button>
          <p className="text-center text-gray-300 text-[10px] mt-6 tracking-widest uppercase font-bold">
            ČoUvarím.sk • v1.0.0
          </p>
        </section>
      </div>
    </div>
  );
}
