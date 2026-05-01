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
  Loader2,
  Pencil,
  Clock,
  Flame,
  Utensils,
  ChevronRight,
  ChefHat
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { COMMON_INTOLERANCES, DIETARY_PREFERENCES } from "@/lib/constants";
import { 
  getOrCreateHouseholdAction, 
  getHouseholdMembersAction,
  addHouseholdMemberAction,
  removeHouseholdMemberAction,
  updateHouseholdMemberAction,
  getHouseholdSharedRecipesAction
} from "@/app/actions/recipes";

export default function HouseholdPage() {
  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharedRecipes, setSharedRecipes] = useState<any[]>([]);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [inviteType, setInviteType] = useState<"email" | "manual">("email");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [dislikeInput, setDislikeInput] = useState("");

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
      } else if (!mResult.success) {
        console.error("Chyba pri načítaní členov: " + mResult.error);
      }

      // Fetch shared recipes
      const rResult = await getHouseholdSharedRecipesAction(hResult.household.id);
      if (rResult.success && rResult.recipes) {
        setSharedRecipes(rResult.recipes);
      }
    } else if (!hResult.success) {
      console.error("Chyba pri inicializácii domácnosti: " + hResult.error);
    }
    setIsLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? (prev as string[]).filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleDietTag = (tag: string) => {
    setSelectedDietTags(prev => 
      prev.includes(tag) ? (prev as string[]).filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addDislikedIngredient = () => {
    const tag = dislikeInput.trim();
    if (tag && !dislikedIngredients.includes(tag)) {
      setDislikedIngredients(prev => [...prev, tag]);
    }
    setDislikeInput("");
  };

  const removeDislikedIngredient = (tag: string) => {
    setDislikedIngredients(prev => prev.filter(t => t !== tag));
  };

  const handleOpenEdit = (member: any) => {
    setEditingMember(member);
    setInviteType(member.user_id ? "email" : "manual");
    setNewMemberName(member.display_name || "");
    setNewMemberEmail(member.profiles?.email || ""); 
    setSelectedTags(member.preferences?.intolerances || []);
    setSelectedDietTags(member.preferences?.diet || []);
    setDislikedIngredients(member.preferences?.disliked_ingredients || []);
    setShowInviteModal(true);
  };

  const handleAddOrUpdateMember = async () => {
    if (!household) {
      console.error("Chyba: Domácnosť nebola nájdená.");
      return;
    }
    if (inviteType === "manual" && !newMemberName) return;
    
    setIsSubmitting(true);
    
    if (editingMember) {
      const result = await updateHouseholdMemberAction(editingMember.id, {
        name: newMemberName,
        intolerances: selectedTags,
        diet: selectedDietTags,
        disliked_ingredients: dislikedIngredients
      });

      if (result.success) {
        await fetchData();
        handleCloseModal();
      } else {
        console.error(result.error);
      }
    } else {
      const result = await addHouseholdMemberAction(household.id, {
        type: inviteType,
        name: newMemberName,
        email: newMemberEmail,
        intolerances: selectedTags,
        diet: selectedDietTags,
        disliked_ingredients: dislikedIngredients
      });

      if (result.success) {
        await fetchData();
        handleCloseModal();
      } else {
        console.error(result.error);
      }
    }
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setEditingMember(null);
    setNewMemberName("");
    setNewMemberEmail("");
    setSelectedTags([]);
    setSelectedDietTags([]);
    setDislikedIngredients([]);
    setDislikeInput("");
  };

  const handleRemoveMember = async (memberId: string) => {
    // Odstránený confirm na žiadosť používateľa
    const result = await removeHouseholdMemberAction(memberId);
    if (result.success) {
      setMembers(members.filter(m => m.id !== memberId));
    } else {
      console.error(result.error);
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

  const allConstraints = Array.from(new Set(
    members.flatMap(m => {
      const prefs = m.user_id ? m.profiles?.preferences : m.preferences;
      return [
        ...(prefs?.intolerances || []),
        ...(prefs?.disliked_ingredients || [])
      ];
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

      <button 
        onClick={() => setShowInviteModal(true)}
        className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-sage-500 text-sage-50 rounded-full z-40 flex items-center justify-center active:scale-90 transition-all shadow-[0_15px_30px_-5px_rgba(77,96,71,0.5)] hover:bg-sage-600"
      >
        <UserPlus size={28} strokeWidth={2.5} />
      </button>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Členovia rodiny</h3>
              <p className="text-gray-400 text-xs font-medium">Celkový počet v domácnosti</p>
            </div>
          </div>
          <div className="text-3xl font-black text-sage-600 mr-2">{members.length}</div>
        </div>
      </div>

      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <h3 className="font-bold text-gray-800">Spoločné obmedzenia</h3>
            </div>
            {allConstraints.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">
                {allConstraints.length} Aktívne
              </span>
            )}
          </div>
          
          {allConstraints.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allConstraints.map(item => (
                <span key={item} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold transition-all hover:scale-105">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="py-2 text-gray-400 text-sm font-medium flex items-center gap-2">
              <Check size={16} className="text-sage-500" />
              Vaša rodina nemá žiadne nahlásené obmedzenia.
            </div>
          )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Zoznam členov</h3>
        <div className="space-y-3">
          {members.map((member: any) => {
            const prefs = member.user_id ? member.profiles?.preferences : member.preferences;
            const summary = [
              ...(prefs?.diet || []),
              ...(prefs?.intolerances || []),
              ...(prefs?.disliked_ingredients || [])
            ];

            return (
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
                    <p className="text-gray-400 text-[11px] font-medium leading-tight max-w-[200px] truncate">
                      {summary.join(", ") || "Bez obmedzení"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {member.user_id !== household?.owner_id && (
                    <button 
                      onClick={() => handleOpenEdit(member)}
                      className="p-2.5 text-gray-300 hover:text-sage-500 hover:bg-sage-50 rounded-xl transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  {member.role !== 'owner' && (
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Spoločné recepty - Rodinná nástenka */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">Rodinná nástenka</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Spoločné recepty a odporúčania</p>
            </div>
          <div className="px-3 py-1 bg-sage-50 text-sage-600 rounded-full text-[10px] font-bold border border-sage-100">
            {sharedRecipes.length} RECEPTOV
          </div>
        </div>

        {sharedRecipes.length === 0 ? (
          <div className="bg-white rounded-[24px] p-10 text-center border border-dashed border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChefHat size={32} />
            </div>
            <p className="text-gray-400 text-sm font-medium px-8">
              Zatiaľ tu nie sú žiadne spoločné recepty. Zazdielajte nejaký zo svojej kuchárky!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedRecipes.map((recipe) => (
              <Link 
                key={recipe.id} 
                href={`/recipes?id=${recipe.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 hover:border-sage-200 transition-all active:scale-[0.98]"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-sage-50 flex-shrink-0">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage-200">
                      <ChefHat size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-sage-600 transition-colors text-sm">{recipe.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      Odporúča: <span className="text-sage-600 font-bold">{recipe.profiles?.full_name || "Člen rodiny"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-sage-400" /> {recipe.prep_time}m</span>
                    <span className="flex items-center gap-1"><Flame size={12} className="text-amber-400" /> {recipe.calories} kcal</span>
                  </div>
                </div>
                <div className="flex items-center text-gray-300 group-hover:text-sage-500 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
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
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {editingMember ? 'Upraviť člena' : 'Pridať člena'}
                </h3>
                <button onClick={handleCloseModal} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-colors">
                  <X size={20} />
                </button>
              </div>

              {!editingMember && (
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
                  <button onClick={() => setInviteType("email")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${inviteType === 'email' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Email</button>
                  <button onClick={() => setInviteType("manual")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${inviteType === 'manual' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Manuálne</button>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAddOrUpdateMember(); }} className="space-y-5">
                {inviteType === 'email' && !editingMember ? (
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
                  <div className="max-h-[55vh] overflow-y-auto pr-1 -mr-1 space-y-6">
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
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Štýl stravovania</label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_PREFERENCES.map((item) => (
                          <button 
                            key={item} 
                            type="button" 
                            onClick={() => toggleDietTag(item)} 
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${selectedDietTags.includes(item) ? 'bg-sage-600 border-sage-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Alergie a obmedzenia</label>
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

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Čo nemá rád / Čo mi nechutí</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {dislikedIngredients.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-gray-200">
                            {tag}
                            <button type="button" onClick={() => removeDislikedIngredient(tag)} className="p-0.5 hover:bg-gray-200 rounded-md">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={dislikeInput}
                          onChange={(e) => {
                            if (e.target.value.endsWith(" ")) {
                              addDislikedIngredient();
                            } else {
                              setDislikeInput(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addDislikedIngredient();
                            }
                          }}
                          placeholder="Napíšte a dajte medzeru..."
                          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 outline-none text-gray-800 text-sm"
                        />
                        <button 
                          type="button"
                          onClick={addDislikedIngredient}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-sage-500 text-white rounded-xl flex items-center justify-center"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
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
                  {editingMember ? 'Uložiť zmeny' : (inviteType === 'email' ? 'Odoslať pozvánku' : 'Pridať do skupiny')}
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
