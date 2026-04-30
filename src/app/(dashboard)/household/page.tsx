"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserPlus,
  Mail, 
  Trash2, 
  User,
  Plus,
  X,
  AlertCircle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COMMON_INTOLERANCES } from "@/lib/constants";

const initialMembers = [
  { id: "1", name: "Andrej (Vy)", role: "owner", type: "registered", email: "andrej@priklad.sk" },
  { id: "2", name: "Lucka", role: "member", type: "registered", email: "lucka@priklad.sk" },
  { id: "3", name: "Malý Peťko", role: "member", type: "virtual", preferences: "Alergia na arašidy" },
];

export default function HouseholdPage() {
  const [members, setMembers] = useState(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"email" | "manual">("email");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="pb-12 space-y-6">
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center justify-between py-4 px-2 -mx-2 mb-2">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Moja Rodina</h2>
        {/* Desktop only button */}
        <button 
          onClick={() => setShowInviteModal(true)}
          className="hidden sm:flex bg-sage-500 text-sage-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all items-center gap-2 hover:bg-sage-600"
        >
          <UserPlus size={18} />
          Pridať člena
        </button>
      </header>

      {/* Mobile Floating Action Button (Circle FAB with UserPlus icon) */}
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
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            <span className="w-2 h-2 bg-amber-400 rounded-full opacity-60"></span>
            <span className="w-2 h-2 bg-amber-400 rounded-full opacity-30"></span>
          </div>
        </div>
      </div>

      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
         <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Spoločné obmedzenia</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold">Bez lepku</span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold">Alergia na arašidy</span>
          </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Zoznam členov</h3>
        <div className="space-y-3">
          {members.map((member: any) => (
            <div key={member.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${member.type === 'registered' ? 'bg-sage-100 text-sage-600' : 'bg-blue-100 text-blue-600'}`}>
                  {member.type === 'registered' ? <User size={24} /> : <Users size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800">{member.name}</h4>
                    {member.role === 'owner' && (
                      <span className="px-1.5 py-0.5 bg-sage-100 text-sage-700 text-[8px] font-bold uppercase rounded-md">Správca</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium">{member.type === 'registered' ? member.email : member.preferences}</p>
                </div>
              </div>
              {member.role !== 'owner' && (
                <button className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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

              <form className="space-y-5">
                {inviteType === 'email' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Emailová adresa</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="email" placeholder="rodina@priklad.sk" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 outline-none text-gray-800 font-medium" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Meno člena</label>
                      <input type="text" placeholder="napr. Stará mama" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none text-gray-800 font-medium" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Alergie</label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_INTOLERANCES.map((item) => (
                          <button key={item} type="button" onClick={() => toggleTag(item)} className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${selectedTags.includes(item) ? 'bg-sage-600 border-sage-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <button 
                  type="button"
                  className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all hover:bg-sage-600 mt-4"
                >
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
