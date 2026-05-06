"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
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
  ChefHat,
  Share2,
  LogOut
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
  getHouseholdSharedRecipesAction,
  leaveHouseholdAction
} from "@/app/actions/recipes";
import { supabase } from "@/lib/supabase";
import { HouseholdSkeleton } from "@/components/Skeletons";

export default function HouseholdPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharedRecipes, setSharedRecipes] = useState<any[]>([]);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<any | null>(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [inviteType, setInviteType] = useState<"email" | "manual" | "link">("email");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [dislikeInput, setDislikeInput] = useState("");

  // Fetchers for SWR
  const householdFetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    const result = await getOrCreateHouseholdAction(false);
    return result.success ? result.household : null;
  };

  const membersFetcher = async (householdId: string) => {
    const result = await getHouseholdMembersAction(householdId);
    return result.success ? result.members : [];
  };

  const recipesFetcher = async (householdId: string) => {
    const result = await getHouseholdSharedRecipesAction(householdId);
    return result.success ? result.recipes : [];
  };

  // SWR Hooks
  const { data: swrHousehold, isLoading: hLoading } = useSWR("household-data", householdFetcher);
  const { data: swrMembers, isLoading: mLoading } = useSWR(
    swrHousehold ? `members-${swrHousehold.id}` : null,
    () => membersFetcher(swrHousehold!.id)
  );
  const { data: swrRecipes, isLoading: rLoading } = useSWR(
    swrHousehold ? `shared-recipes-${swrHousehold.id}` : null,
    () => recipesFetcher(swrHousehold!.id)
  );

  useEffect(() => {
    if (swrHousehold) setHousehold(swrHousehold);
  }, [swrHousehold]);

  useEffect(() => {
    if (swrMembers) setMembers(swrMembers);
  }, [swrMembers]);

  useEffect(() => {
    if (swrRecipes) setSharedRecipes(swrRecipes);
  }, [swrRecipes]);

  const isOwner = household?.owner_id === currentUser?.id;

  const handleOpenEdit = (member: any) => {
    // Only owner can edit, and only manual members (or own registered profile preferences? No, registered users manage their own).
    // The user said: "editovat manualne clenov ktori nieus registrovani"
    if (!isOwner || member.user_id) return;

    setEditingMember(member);
    const prefs = member.preferences;
    setInviteType("manual");
    setNewMemberName(member.display_name || "");
    setSelectedTags(prefs?.intolerances || []);
    setSelectedDietTags(prefs?.diet || []);
    setDislikedIngredients(prefs?.disliked_ingredients || []);
    setShowInviteModal(true);
  };

  const handleAddOrUpdateMember = async () => {
    if (!isOwner && household) return; // Only owner can add members to existing household

    let currentHousehold = household;
    
    // Create household on demand if it doesn't exist
    if (!currentHousehold) {
      setIsSubmitting(true);
      const hResult = await getOrCreateHouseholdAction(true);
      if (hResult.success && hResult.household) {
        currentHousehold = hResult.household;
        setHousehold(hResult.household);
      } else {
        alert("Nepodarilo sa vytvoriť domácnosť: " + hResult.error);
        setIsSubmitting(false);
        return;
      }
    }

    if (inviteType === "manual" && !newMemberName) {
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);
    
    if (editingMember) {
      const result = await updateHouseholdMemberAction(editingMember.id, {
        name: newMemberName,
        intolerances: selectedTags,
        diet: selectedDietTags,
        disliked_ingredients: dislikedIngredients
      });

      if (result.success) {
        mutate("household-data");
        mutate(`members-${household?.id}`);
        mutate(`shared-recipes-${household?.id}`);
        handleCloseModal();
      } else {
        console.error(result.error);
      }
    } else {
      const result = await addHouseholdMemberAction(currentHousehold.id, {
        type: inviteType,
        name: newMemberName,
        email: newMemberEmail,
        intolerances: selectedTags,
        diet: selectedDietTags,
        disliked_ingredients: dislikedIngredients
      });

      if (result.success && result.member) {
        if (inviteType === 'link') {
          const baseUrl = window.location.origin;
          const inviteUrl = `${baseUrl}/invite/${result.member.id}`;
          setGeneratedLink(inviteUrl);
          
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'Pozvánka do ČoUvarím.sk',
                text: `Ahoj! Pozývam ťa do našej spoločnej domácnosti v aplikácii ČoUvarím.sk. Pridaj sa tu:`,
                url: inviteUrl
              });
            } catch (err) {}
          }
          mutate("household-data");
        mutate(`members-${household?.id}`);
        mutate(`shared-recipes-${household?.id}`);
          setIsSubmitting(false);
          return;
        }
        mutate("household-data");
        mutate(`members-${household?.id}`);
        mutate(`shared-recipes-${household?.id}`);
        handleCloseModal();
      } else {
        console.error(result?.error || "Neznáma chyba");
      }
    }
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setEditingMember(null);
    setInviteType("email");
    setNewMemberName("");
    setNewMemberEmail("");
    setSelectedTags([]);
    setSelectedDietTags([]);
    setDislikedIngredients([]);
    setDislikeInput("");
    setGeneratedLink(null);
    setIsSubmitting(false);
  };

  const handleRemoveMember = async () => {
    if (!deleteConfirmMember || !isOwner || !household) return;
    
    const memberId = deleteConfirmMember.id;
    
    // Optimistic UI Update
    const updatedMembers = members.filter(m => m.id !== memberId);
    setMembers(updatedMembers);
    mutate(`members-${household.id}`, updatedMembers, false);
    setDeleteConfirmMember(null);

    const result = await removeHouseholdMemberAction(memberId);
    if (!result.success) {
      alert("Nepodarilo sa odstrániť člena.");
      mutate(`members-${household.id}`); // Rollback
    }
  };


  const activeMembers = members.filter(m => m.status !== 'pending');
  const pendingMembers = members.filter(m => m.status === 'pending' && (m.invitation_email || m.user_id === null));
  
  const getMemberName = (member: any) => {
    if (member.user_id) {
      return member.profiles?.full_name || member.display_name || "Registrovaný používateľ";
    }
    return member.display_name || "Člen domácnosti";
  };

  const isAlone = !household || (activeMembers.length <= 1 && pendingMembers.length === 0);

  const allConstraints = Array.from(new Set(
    activeMembers.flatMap(m => {
      const prefs = m.user_id ? m.profiles?.preferences : m.preferences;
      return [
        ...(prefs?.intolerances || []),
        ...(prefs?.disliked_ingredients || [])
      ];
    })
  ));

  // Show skeleton ONLY if we have no household data at all and we are loading
  if (hLoading && !swrHousehold) {
    return <HouseholdSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center justify-between py-4 px-4 -mx-4 mb-2">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {isAlone ? "Spoločná Domácnosť" : (household?.name || "Moja Domácnosť")}
        </h2>
        
        {/* Only Owner can invite new members */}
        {isOwner && !isAlone && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="hidden sm:flex bg-sage-500 text-sage-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all items-center gap-2 hover:bg-sage-600"
          >
            <UserPlus size={18} />
            Pridať člena
          </button>
        )}

      </header>

      {/* Floating Action Buttons for Mobile */}
      {isOwner && !isAlone && (
        <button 
          onClick={() => setShowInviteModal(true)}
          className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-sage-500 text-sage-50 rounded-full z-40 flex items-center justify-center active:scale-90 transition-all shadow-[0_15px_30px_-5px_rgba(77,96,71,0.5)] hover:bg-sage-600"
        >
          <UserPlus size={28} strokeWidth={2.5} />
        </button>
      )}


      {isAlone ? (
        <div className="space-y-8 py-8">
          <div className="bg-white rounded-[32px] p-10 text-center space-y-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-full -ml-12 -mb-12 opacity-50" />
            
            <div className="relative z-10 space-y-6">
              <div className="w-24 h-24 bg-sage-100 text-sage-600 rounded-[28px] flex items-center justify-center mx-auto shadow-inner transform rotate-3">
                <Users size={48} />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-gray-800 leading-tight">
                  Varte a plánujte <br />
                  <span className="text-sage-500">spolu s ostatnými</span>
                </h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  Zdieľajte recepty, spoznajte chute celej rodiny a majte prehľad o tom, kto čo (ne)má rád.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="w-full py-5 bg-sage-500 text-white rounded-2xl font-bold shadow-xl shadow-sage-200 active:scale-95 transition-all hover:bg-sage-600 flex items-center justify-center gap-3"
                >
                  <UserPlus size={20} />
                  Pozvať prvého člena
                </button>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  ALEBO POČKAJTE NA POZVÁNKU OD INÉHO
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h4 className="font-bold text-gray-800 text-sm leading-tight">Spoločné alergie</h4>
              <p className="text-gray-400 text-[10px] leading-relaxed">Automaticky vynecháme suroviny, ktoré niekomu škodia.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Share2 size={20} />
              </div>
              <h4 className="font-bold text-gray-800 text-sm leading-tight">Zdieľané recepty</h4>
              <p className="text-gray-400 text-[10px] leading-relaxed">Majte jednu spoločnú kuchárku pre celú domácnosť.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Členovia domácnosti</h3>
                  <p className="text-gray-400 text-xs font-medium">Celkový počet v domácnosti</p>
                </div>
              </div>
              <div className="text-3xl font-black text-sage-600 mr-2">{activeMembers.length}</div>
            </div>
          </div>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={18} />
                  </div>
                  <h3 className="font-bold text-gray-800">Spoločné obmedzenia</h3>
                </div>
                {allConstraints.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-2xl uppercase tracking-wider">
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
                  Vaša domácnosť nemá žiadne nahlásené obmedzenia.
                </div>
              )}
          </section>

          <section className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Aktívni členovia</h3>
              <div className="space-y-3">
                {activeMembers.map((member: any) => {
                  const prefs = member.user_id ? member.profiles?.preferences : member.preferences;
                  const summary = [
                    ...(prefs?.diet || []),
                    ...(prefs?.intolerances || []),
                    ...(prefs?.disliked_ingredients || [])
                  ];

                  return (
                    <div key={member.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          member.user_id ? 'bg-sage-100 text-sage-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {member.user_id ? <User size={24} /> : <Users size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">
                              {getMemberName(member)}
                              {member.user_id === currentUser?.id && " (Vy)"}
                            </h4>
                            {member.role === 'owner' && (
                              <span className="px-1.5 py-0.5 bg-sage-100 text-sage-700 text-[8px] font-bold uppercase rounded-2xl">Správca</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-[11px] font-medium leading-tight max-w-[200px] truncate">
                            {summary.join(", ") || "Bez obmedzení"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Only Owner can edit MANUAL members */}
                        {isOwner && !member.user_id && (
                          <button 
                            onClick={() => handleOpenEdit(member)}
                            className="p-2.5 text-gray-300 hover:text-sage-500 hover:bg-sage-50 rounded-2xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        {/* Only Owner can remove OTHER members */}
                        {isOwner && member.user_id !== currentUser?.id && (
                          <button 
                            onClick={() => setDeleteConfirmMember(member)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {pendingMembers.length > 0 && isOwner && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Čakajú na prijatie</h3>
                <div className="space-y-3 opacity-80">
                  {pendingMembers.map((member: any) => {
                    const prefs = member.preferences;
                    const summary = [
                      ...(prefs?.diet || []),
                      ...(prefs?.intolerances || []),
                      ...(prefs?.disliked_ingredients || [])
                    ];

                    return (
                      <div key={member.id} className="bg-white/70 p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
                            <Mail size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-500 italic">
                                {member.invitation_email || "Pozvaný člen"}
                              </h4>
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold uppercase rounded-2xl flex items-center gap-1">
                                <Clock size={8} /> Pozvánka odoslaná
                              </span>
                            </div>
                            <p className="text-gray-400 text-[11px] font-medium leading-tight max-w-[200px] truncate">
                              {summary.join(", ") || "Bez obmedzení"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setDeleteConfirmMember(member)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight">Nástenka domácnosti</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Spoločné recepty a odporúčania</p>
                </div>
              <div className="px-3 py-1 bg-sage-50 text-sage-600 rounded-full text-[10px] font-bold border border-sage-100">
                {sharedRecipes.length} RECEPTOV
              </div>
            </div>

            {sharedRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200 shadow-sm">
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
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-sage-50 flex-shrink-0">
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
                        <h4 className="font-bold text-gray-800 line-clamp-2 group-hover:text-sage-600 transition-colors text-sm h-10">{recipe.title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          Odporúča: <span className="text-sage-600 font-bold">{recipe.profiles?.full_name || "Člen domácnosti"}</span>
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
        </>
      )}

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
              className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl z-50 overflow-hidden mb-[env(safe-area-inset-bottom)] sm:mb-0"
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
                  <button onClick={() => setInviteType("email")} className={`flex-1 py-3 text-[10px] font-bold rounded-2xl transition-all ${inviteType === 'email' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Email</button>
                  <button onClick={() => setInviteType("link")} className={`flex-1 py-3 text-[10px] font-bold rounded-2xl transition-all ${inviteType === 'link' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Odkaz</button>
                  <button onClick={() => setInviteType("manual")} className={`flex-1 py-3 text-[10px] font-bold rounded-2xl transition-all ${inviteType === 'manual' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}>Manuálne</button>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAddOrUpdateMember(); }} className="space-y-5">
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
                ) : inviteType === 'link' ? (
                  <div className="py-8 text-center space-y-6">
                    {generatedLink ? (
                      <>
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Check size={32} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-800 text-lg">Odkaz je hotový!</h4>
                          <p className="text-xs text-gray-400 px-6">
                            Skopírujte ho nižšie alebo použite tlačidlo zdieľať.
                          </p>
                        </div>
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                          <input 
                            readOnly 
                            value={generatedLink} 
                            className="flex-1 bg-transparent border-none outline-none px-3 text-[10px] font-medium text-gray-500 truncate"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedLink);
                              alert("Odkaz bol skopírovaný!");
                            }}
                            className="px-4 py-2 bg-white text-sage-600 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all border border-gray-100"
                          >
                            Kopírovať
                          </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Pozvánka do ČoUvarím.sk',
                                text: `Ahoj! Pozývam ťa do našej spoločnej domácnosti v aplikácii ČoUvarím.sk. Pridaj sa tu:`,
                                url: generatedLink
                              });
                            }
                          }}
                          className="w-full py-4 bg-sage-50 text-sage-600 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs"
                        >
                          <Share2 size={16} /> Zdieľať znova
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-sage-50 text-sage-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Share2 size={32} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-800">Rýchle zdieľanie</h4>
                          <p className="text-xs text-gray-400 px-6">
                            Vygenerujeme unikátny odkaz, ktorý môžete poslať cez WhatsApp, Messenger alebo SMS.
                          </p>
                        </div>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all hover:bg-sage-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                          Vygenerovať odkaz
                        </button>
                      </>
                    )}
                  </div>
                ) : (
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
                            onClick={() => {
                              setSelectedDietTags(prev => 
                                prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]
                              );
                            }} 
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
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]
                              );
                            }} 
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${selectedTags.includes(item) ? 'bg-sage-600 border-sage-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all hover:bg-sage-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                      {editingMember ? "Uložiť zmeny" : "Pridať člena"}
                    </button>
                  </div>
                )}
              </form>
              <div className="h-8" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Custom Member Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmMember(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Odstrániť člena?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed px-4">
                    Naozaj chcete odstrániť člena <span className="font-bold text-gray-700">"{getMemberName(deleteConfirmMember)}"</span> z vašej domácnosti?
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleRemoveMember}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
                  >
                    Odstrániť člena
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmMember(null)}
                    className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 active:scale-95 transition-all"
                  >
                    Zrušiť
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
