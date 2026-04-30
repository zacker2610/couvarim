"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus,
  Mail, 
  Trash2, 
  User,
  Plus,
  X,
  AlertCircle,
  Check,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COMMON_INTOLERANCES } from "@/lib/constants";
import { 
  getOrCreateHouseholdAction, 
  getHouseholdMembersAction,
  addHouseholdMemberAction,
  removeHouseholdMemberAction
} from "@/app/actions/recipes";

export default function HouseholdPage() {
  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"email" | "manual">("email");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const hResult = await getOrCreateHouseholdAction();
    if (hResult.success && hResult.household) {
      setHousehold(hResult.household);
      const mResult = await getHouseholdMembersAction(hResult.household.id);
      if (mResult.success && mResult.members) {
        setMembers(mResult.members);
      }
    }
    setIsLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddMember = async () => {
    if (!household) return;
    if (inviteType === "manual" && !newMemberName) return;
    if (inviteType === "email" && !newMemberEmail) return;

    setIsSubmitting(true);
    const result = await addHouseholdMemberAction(household.id, {
      type: inviteType,
      name: newMemberName,
      email: newMemberEmail,
      intolerances: selectedTags
    });

    if (result.success) {
      await fetchData();
      setShowInviteModal(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setSelectedTags([]);
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Naozaj chcete odstrániť tohto člena?")) return;
    
    const result = await removeHouseholdMemberAction(memberId);
    if (result.success) {
      setMembers(members.filter(m => m.id !== memberId));
    } else {
      alert(result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-sage-500 animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Načítavam vašu rodinu...</p>
      </div>
    );
  }

  // Calculate common intolerances from both virtual and registered members
  const allIntolerances = Array.from(new Set(
    members.flatMap(m => {
      const virtualIntolerances = m.preferences?.intolerances || [];
      const registeredIntolerances = m.profiles?.preferences?.intolerances || [];
      return [...virtualIntolerances, ...registeredIntolerances];
    })
  ));

  return (
    <div className="pb-12 space-y-6">
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center justify-between py-4 px-2 -mx-2 mb-2">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {household?.name || "Moja Rodina"}
        </h2>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="hidden sm:flex bg-sage-500 text-sage-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all items-center gap-2 hover:bg-sage-600"
        >
          <UserPlus size={18} />
          Pridať člena
        </button>
      </header>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowInviteModal(true)}
        className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-sage-500 text-sage-50 rounded-full z-40 flex items-center justify-center active:scale-90 transition-all shadow-[0_15px_30px_-5px_rgba(77,96,71,0.5)] hover:bg-sage-600"
      >
        <UserPlus size={28} strokeWidth={2.5} />
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-sage-600 mb-1">
            <Users size={16} />
            <span className="font-bold text-[10px] uppercase tracking-wider">Členovia</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{members.length}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertCircle size={16} />
            <span className="font-bold text-[10px] uppercase tracking-wider">Obmedzenia</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {allIntolerances.map((_, i) => (
              <span key={i} className="w-2 h-2 bg-amber-400 rounded-full" style={{ opacity: 1 - (i * 0.2) }}></span>
            ))}
            {allIntolerances.length === 0 && <span className="text-[10px] text-gray-400 font-bold uppercase">Žiadne</span>}
          </div>
        </div>
      </div>

      {allIntolerances.length > 0 && (
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <h3 className="font-bold text-gray-800">Spoločné obmedzenia</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {allIntolerances.map(item => (
                <span key={item} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold">{item}</span>
              ))}
            </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Zoznam členov</h3>
        <div className="space-y-3">
          {members.map((member: any) => (
            <div key={member.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${member.user_id ? 'bg-sage-100 text-sage-600' : 'bg-blue-100 text-blue-600'}`}>
                  {member.user_id ? <User size={24} /> : <Users size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800">
                      {member.user_id ? (member.profiles?.full_name || "Registrovaný používateľ") : member.display_name}
                      {member.user_id === household?.owner_id && " (Vy)"}
                    </h4>
                    {member.role === 'owner' && (
                      <span className="px-1.5 py-0.5 bg-sage-100 text-sage-700 text-[8px] font-bold uppercase rounded-md">Správca</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium">
                    {member.user_id ? "Registrovaný člen" : (member.preferences?.intolerances?.join(", ") || "Bez obmedzení")}
                  </p>
                </div>
              </div>
              {member.role !== 'owner' && (
                <button 
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Responsive Modal / Bottom Sheet */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 shadow-2xl z-50 overflow-hidden mb-[env(safe-area-inset-bottom)] sm:mb-0"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Pridať člena</h3>
                <button onClick={() => setShowInviteModal(false)} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
                <button onClick={() => setInviteType("email")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${inviteType === 'email' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Email</button>
                <button onClick={() => setInviteType("manual")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${inviteType === 'manual' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Manuálne</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} className="space-y-5">
                {inviteType === 'email' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Emailová adresa</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="rodina@priklad.sk" 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 outline-none text-gray-800 font-medium" 
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Meno člena</label>
                      <input 
                        type="text" 
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="napr. Stará mama" 
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none text-gray-800 font-medium" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Alergie</label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_INTOLERANCES.map((item) => (
                          <button 
                            key={item} 
                            type="button" 
                            onClick={() => toggleTag(item)} 
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${selectedTags.includes(item) ? 'bg-sage-600 border-sage-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all hover:bg-sage-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                  {inviteType === 'email' ? 'Odoslať pozvánku' : 'Pridať do skupiny'}
                </button>
              </form>
              <div className="h-16 sm:hidden" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
