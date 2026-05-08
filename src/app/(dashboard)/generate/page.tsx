"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Camera, 
  PenLine, 
  ArrowRight,
  ChevronLeft,
  ChefHat,
  Clock,
  Flame,
  Utensils,
  Dices,
  Search,
  Zap,
  AlertCircle,
  Dna,
  Wheat,
  Droplet,
  Send,
  MessageSquare,
  RefreshCw,
  Plus,
  Loader2,
  Check,
  Users,
  User,
  Share2,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { generateRecipeAction, saveRecipeAction, getOrCreateHouseholdAction } from "@/app/actions/recipes";
import { supabase } from "@/lib/supabase";

const LOADING_MESSAGES = [
  "Prehľadávam vašu chladničku...",
  "Brúsim kuchárske nože...",
  "Vyháňam mačku z kuchynskej linky...",
  "Miešam tajné ingrediencie...",
  "Pýtam sa babky na recept...",
  "Ladím chute...",
  "Prekladám z kuchárčiny do ľudštiny...",
  "Zháňam čerstvé bylinky...",
  "Zapínam virtuálnu rúru...",
  "Kontrolujem, či máme dosť soli..."
];

export default function GeneratePage() {
  const [step, setStep] = useState<"hub" | "ai_dish" | "ai_ingredients" | "loading" | "result" | "error">("hub");
  const [inputText, setInputText] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [lastActionType, setLastActionType] = useState<"dish" | "ingredients" | "random" | "refine" | null>(null);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [useHousehold, setUseHousehold] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  const [userGoals, setUserGoals] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .single();
        if (data?.preferences?.goals) {
          setUserGoals(data.preferences.goals);
        }
      }
    };
    fetchGoals();
  }, []);

  useEffect(() => {
    if (isLoading || isRefining) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isRefining]);

  const handleGenerate = async (type: "dish" | "ingredients" | "random" | "refine") => {
    setRefineError(null);
    if (type === "refine") {
      setIsRefining(true);
      try {
        const result = await generateRecipeAction(refineText, "refine", generatedRecipe);
        if (result.success) {
          setGeneratedRecipe(result.recipe);
          setRefineText("");
        } else {
          setRefineError(result.error || "AI je momentálne preťažená. Skúste to o chvíľu.");
        }
      } catch (err) {
        setRefineError("Nepodarilo sa spojiť so serverom.");
      }
      setIsRefining(false);
    } else {
      setLastActionType(type);
      setStep("loading");
      setIsLoading(true);
      const result = await generateRecipeAction(inputText, type, null, useHousehold);
      if (result.success) {
        setGeneratedRecipe(result.recipe);
        setStep("result");
      } else {
        setStep("error");
      }
      setIsLoading(false);
    }
  };

  const handleSaveToCollection = async () => {
    if (!generatedRecipe) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const recipeData = {
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        prep_time: generatedRecipe.prep_time,
        difficulty: generatedRecipe.difficulty,
        calories: generatedRecipe.calories,
        nutrition: {
          protein: generatedRecipe.nutrition.protein.value,
          carbs: generatedRecipe.nutrition.carbs.value,
          fat: generatedRecipe.nutrition.fat.value
        },
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        image_url: generatedRecipe.image_url,
        user_id: user?.id,
        household_id: useHousehold ? (await getOrCreateHouseholdAction(true)).household?.id : null
      };

      const result = await saveRecipeAction(recipeData);
      if (result.success) {
        setSaveSuccess(true);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Chyba pri ukladaní.");
    }
    setIsSaving(false);
  };

  const calculatePercent = (value: number, goal: any) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(Math.round((value / goal) * 100), 100);
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {step === "hub" && (
          <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-4xl mx-auto">
            <header className={`sticky md:static top-0 z-40 bg-[#F8F5F2] py-4 px-4 -mx-4 mb-2 flex flex-col gap-1 transition-all duration-300 ${
              scrolled ? 'shadow-md border-b border-gray-100 md:shadow-none md:border-none' : ''
            }`}>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight leading-tight">Vymyslime niečo!</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Vyberte si spôsob, ako vytvoriť recept</p>
            </header>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 mb-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                <h2 className="text-lg font-bold text-gray-700">Pre koho varíme?</h2>
              </div>
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                <button 
                  onClick={() => setUseHousehold(false)} 
                  className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !useHousehold 
                      ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <User size={14} />
                  Len pre mňa
                </button>
                <button 
                  onClick={() => setUseHousehold(true)} 
                  className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    useHousehold 
                      ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Users size={14} />
                  Celá domácnosť
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link href={`/scan?household=${useHousehold}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 group transition-all active:scale-[0.98]">
                <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">Skener</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Odfote a my vymyslíme recept</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-sage-500 transition-colors" />
              </Link>

              <Link href="/recipes/new" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 group transition-all active:scale-[0.98]">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PenLine size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">Vlastný recept</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Manuálny zápis postupu</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-sage-500 transition-colors" />
              </Link>

              <button onClick={() => setStep("ai_ingredients")} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 group transition-all text-left active:scale-[0.98]">
                <div className="w-14 h-14 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChefHat size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">Mám tieto suroviny</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Zadajte zoznam surovín</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-sage-500 transition-colors" />
              </button>

              <button onClick={() => setStep("ai_dish")} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 group transition-all text-left active:scale-[0.98]">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">Mám chuť na...</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Nechajte AI navrhnúť jedlo podľa nálady</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-sage-500 transition-colors" />
              </button>

              <button onClick={() => handleGenerate("random")} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 group transition-all text-left active:scale-[0.98]">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Dices size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">Prekvap ma</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Náhodný výber z obľúbených receptov</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-sage-500 transition-colors" />
              </button>
            </div>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-12">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-sage-100 border-t-sage-500 rounded-full animate-spin" />
              <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sage-500 animate-bounce" size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">{isRefining ? "Upravujem recept..." : "Už sa to varí..."}</h2>
              <p className="text-sage-600 font-bold text-lg animate-pulse h-12 flex items-center justify-center leading-tight">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </div>
          </motion.div>
        )}

        {step === "result" && generatedRecipe && !isRefining && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-transparent min-h-full max-w-4xl mx-auto">
            {/* Solid Header on top */}
            <header className="sticky md:static top-0 z-50 bg-[#F8F5F2]/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none flex items-center justify-between py-4">
              <button 
                onClick={() => setStep("hub")} 
                className="w-10 h-10 bg-white/50 text-gray-500 rounded-xl active:scale-90 transition-all flex items-center justify-center border border-white/50 shadow-sm"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <h2 className="text-gray-800 font-bold text-base">Detail receptu</h2>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-white/50 text-gray-400 rounded-xl active:scale-90 transition-all flex items-center justify-center border border-white/50 shadow-sm">
                  <Share2 size={18} />
                </button>
                <button className="w-10 h-10 bg-white/50 text-gray-400 rounded-xl active:scale-90 transition-all flex items-center justify-center border border-white/50 shadow-sm">
                  <Edit3 size={18} />
                </button>
              </div>
            </header>

            <div className="relative">
              {/* Hero Image - True Full Bleed */}
              <div className="w-full h-64 md:h-96 relative bg-sage-50 rounded-[32px] overflow-hidden md:mt-4 shadow-sm border border-black/5">
                <img 
                  src={generatedRecipe.image_url} 
                  alt={generatedRecipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                   <span className="bg-sage-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">AI Inšpirácia</span>
                   <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">{generatedRecipe.title}</h3>
                </div>
              </div>

              <div className="py-8 space-y-8 max-w-4xl mx-auto">
                <p className="text-gray-500 text-sm italic leading-relaxed text-center px-6">
                  "{generatedRecipe.description}"
                </p>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Príprava</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-2">
                       <Clock size={16} className="text-sage-500" />
                       {generatedRecipe.prep_time}
                    </p>
                  </div>
                  <div className="space-y-1 text-center border-l border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Náročnosť</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-2">
                       <Utensils size={16} className="text-blue-500" />
                       {generatedRecipe.difficulty}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                  <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Flame size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Kalórie</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {generatedRecipe.calories} <span className="text-xs font-medium text-gray-400 tracking-normal">kcal</span>
                      </p>
                      {userGoals?.calories > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${calculatePercent(generatedRecipe.calories, userGoals.calories)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-l border-gray-200/50 pl-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Dna size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Bielkoviny</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {generatedRecipe.nutrition.protein.value} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.protein > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${calculatePercent(generatedRecipe.nutrition.protein.value, userGoals.protein)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-orange-500">
                        <Wheat size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sacharidy</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {generatedRecipe.nutrition.carbs.value} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.carbs > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${calculatePercent(generatedRecipe.nutrition.carbs.value, userGoals.carbs)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-l border-gray-200/50 pl-4">
                      <div className="flex items-center gap-2 text-rose-600">
                        <Droplet size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tuky</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {generatedRecipe.nutrition.fat.value} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.fat > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${calculatePercent(generatedRecipe.nutrition.fat.value, userGoals.fat)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6 pt-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Ingrediencie
                  </h4>
                  <div className="space-y-3">
                    {generatedRecipe.ingredients.map((ing: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50/30 p-5 rounded-2xl border border-gray-100/50 hover:bg-white transition-colors">
                        <span className="font-medium text-gray-700">{ing.item}</span>
                        <span className="text-sage-600 font-bold">{ing.amount} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Postup
                  </h4>
                  <div className="space-y-6">
                    {generatedRecipe.instructions.map((step: string, i: number) => (
                      <div key={i} className="flex gap-5">
                        <div className="w-7 h-7 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xs border border-sage-100">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveToCollection}
                  disabled={isSaving || saveSuccess}
                  className={`w-full py-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-10 ${
                    saveSuccess ? "bg-green-500 text-white" : "bg-sage-500 text-sage-50 hover:bg-sage-600"
                  } disabled:opacity-70`}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : saveSuccess ? (
                    <Check size={20} />
                  ) : (
                    <ChefHat size={20} />
                  )}
                  {isSaving ? "Ukladám..." : saveSuccess ? "Uložené!" : "Uložiť do zbierky"}
                </button>
              </div>
            </div>

            {/* Chat/Refine bar fixed at bottom */}
            <div className="fixed bottom-24 left-0 right-0 z-[100] px-4 sm:absolute sm:bottom-6">
              <AnimatePresence>
                {refineError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 mx-auto w-max mb-2"
                  >
                    <AlertCircle size={14} />
                    {refineError}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl border border-sage-100 shadow-2xl flex items-center gap-3 pr-2 ring-1 ring-black/5 max-w-xl mx-auto">
                <div className="w-10 h-10 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <input 
                  type="text" 
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  placeholder="Chcete niečo zmeniť?"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700 font-medium placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate("refine")}
                />
                <button 
                  onClick={() => handleGenerate("refine")} 
                  disabled={!refineText.trim()} 
                  className="w-10 h-10 bg-sage-500 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30" 
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "ai_ingredients" && (
          <motion.div key="ai_ingredients" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <header className="flex items-center gap-4">
              <button onClick={() => setStep("hub")} className="w-12 h-12 bg-white rounded-2xl shadow-md border border-gray-100 text-gray-600 active:scale-90 transition-all flex items-center justify-center">
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Čo máte v kuchyni?</h2>
            </header>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Zoznam surovín</p>
              <textarea 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                placeholder="Napr. kura, ryža, mrkva, cibuľa..." 
                className="w-full h-40 bg-gray-50 rounded-2xl p-5 text-lg outline-none focus:bg-white focus:ring-4 focus:ring-sage-500/10 border border-transparent focus:border-sage-500 transition-all resize-none text-gray-800 font-medium" 
              />
              <button onClick={() => handleGenerate("ingredients")} className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-sage-600">
                <Zap size={20} />
                Vymyslieť recept
              </button>
            </div>
          </motion.div>
        )}

        {step === "ai_dish" && (
          <motion.div key="ai_dish" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <header className="flex items-center gap-4">
              <button onClick={() => setStep("hub")} className="w-12 h-12 bg-white rounded-2xl shadow-md border border-gray-100 text-gray-600 active:scale-90 transition-all flex items-center justify-center">
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Na čo máte chuť?</h2>
            </header>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Zadajte chuť alebo jedlo</p>
              <input 
                type="text"
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                placeholder="Napr. Segedínsky guláš..." 
                className="w-full px-5 py-5 bg-gray-50 rounded-2xl text-lg outline-none focus:bg-white focus:ring-4 focus:ring-sage-500/10 border border-transparent focus:border-sage-500 transition-all text-gray-800 font-medium" 
              />
              <button onClick={() => handleGenerate("dish")} className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-sage-600">
                <ChefHat size={20} />
                Zobraziť recept
              </button>
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
               <Zap size={48} className="text-red-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Ups, kuchár stratil wi-fi!</h2>
              <p className="text-gray-400 font-medium leading-relaxed">Nepodarilo sa nám spojiť so serverom. Skontrolujte pripojenie.</p>
            </div>
            <button 
              onClick={() => lastActionType && handleGenerate(lastActionType)} 
              disabled={isLoading}
              className="w-full py-5 bg-gray-800 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm disabled:opacity-70"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} /> 
              Skúsiť znova
            </button>
            <button 
              onClick={() => setStep("hub")}
              className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              Späť na začiatok
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
