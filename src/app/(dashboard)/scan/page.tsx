"use client";

import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Loader2, 
  Sparkles, 
  Utensils, 
  ChefHat, 
  X, 
  ArrowRight,
  Save,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Users,
  User
} from "lucide-react";
import { saveRecipeAction, analyzeIngredientsImageAction } from "@/app/actions/recipes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ScanSkeleton } from "@/components/Skeletons";

interface Recipe {
  title: string;
  description: string;
  ingredients: { item: string; amount: string; unit: string; owned: boolean }[];
  instructions: string[];
  prep_time: string;
  cook_time: string;
  difficulty: "Jednoduchá" | "Stredná" | "Náročná";
  calories: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanSkeleton />}>
      <ScanContent />
    </Suspense>
  );
}

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const householdParam = searchParams.get("household");
  
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [useHousehold, setUseHousehold] = useState(householdParam === "true" || householdParam === null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality for OCR
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64 = reader.result as string;
        
        // Compress if larger than 1MB
        if (base64.length > 1000000) {
          base64 = await compressImage(base64);
        }
        
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeAndGenerate = async () => {
    if (!image) return;
    
    setLoading(true);
    setRecipe(null);
    
    try {
      const base64Data = image.split(",")[1];
      const result = await analyzeIngredientsImageAction(base64Data, useHousehold);
      
      if (result.success) {
        setRecipe(result.data);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Chyba pri analýze:", error);
      alert("Nepodarilo sa rozpoznať suroviny. Skúste to prosím znova s lepším svetlom.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipe) return;
    setIsSaving(true);
    try {
      const result = await saveRecipeAction(recipe);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          router.push("/recipes");
        }, 1500);
      } else {
        alert("Chyba pri ukladaní: " + result.error);
      }
    } catch (error) {
      alert("Nepodarilo sa uložiť recept.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="sticky top-0 z-40 bg-[#F8F5F2] flex items-center gap-4 py-4 px-4 -mx-4 mb-6 border-b border-gray-100/50 shadow-sm">
        <Link 
          href="/generate"
          className="w-12 h-12 bg-white rounded-2xl shadow-md border border-gray-100 text-gray-400 hover:text-gray-600 active:scale-90 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex-1">Skener</h2>
      </header>

      <section className="bg-white p-6 sm:p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        {image ? (
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img src={image} alt="Suroviny" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setImage(null); setRecipe(null); }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-lg active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <button 
              onClick={analyzeAndGenerate}
              disabled={loading}
              className="w-full max-w-sm py-5 bg-sage-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sage-200 active:scale-95 transition-all hover:bg-sage-600 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Gemini skúma suroviny...
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  Zistiť čo uvariť
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="relative z-10 text-center space-y-8 py-4">
            <div className="w-24 h-24 bg-sage-50 text-sage-500 rounded-[30px] flex items-center justify-center mx-auto shadow-inner transform rotate-6">
              <Utensils size={48} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-gray-800 leading-tight">
                Odfotiť nákup alebo chladničku
              </h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                Umelá inteligencia rozpozná suroviny a okamžite vám navrhne recept na mieru podľa toho, čo máte doma.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 px-6 py-2 bg-sage-50 text-sage-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-sage-100 mx-auto w-fit">
              {useHousehold ? <Users size={14} /> : <User size={14} />}
              Režim: {useHousehold ? "Rodina" : "Individuálne"}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="group cursor-pointer bg-sage-500 hover:bg-sage-600 transition-all p-6 rounded-3xl shadow-xl shadow-sage-200 flex flex-col items-center gap-3 border-2 border-sage-400"
              >
                <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Camera size={32} />
                </div>
                <span className="font-bold text-white uppercase text-[10px] tracking-widest">Odfotiť suroviny</span>
              </button>

              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="group cursor-pointer bg-white hover:bg-gray-50 transition-all p-6 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Vybrať z galérie</span>
              </button>

              {/* Camera Input */}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/heic,image/heif" 
                capture="environment"
                className="hidden" 
                ref={cameraInputRef} 
                onChange={handleImageUpload}
              />
              
              {/* Gallery Input */}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/heic,image/heif" 
                className="hidden" 
                ref={galleryInputRef} 
                onChange={handleImageUpload}
              />
            </div>
          </div>
        )}
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {recipe && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-8 sm:p-10 bg-sage-500 text-white space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1 pr-4">
                    <span className="bg-white/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                      AI Inšpirácia
                    </span>
                    <h3 className="text-3xl font-black leading-tight drop-shadow-md">{recipe.title}</h3>
                  </div>
                  <button 
                    onClick={handleSaveRecipe}
                    disabled={isSaving || saveSuccess}
                    className={`p-5 rounded-2xl shadow-2xl active:scale-90 transition-all flex items-center justify-center border-2 ${
                      saveSuccess 
                        ? 'bg-white text-green-600 border-white' 
                        : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                    }`}
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : (saveSuccess ? <CheckCircle2 size={28} /> : <Save size={28} />)}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest opacity-90">
                  <div className="bg-black/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Clock size={14} /> {recipe.prep_time}m
                  </div>
                  <div className="bg-black/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <ChefHat size={14} /> {recipe.difficulty}
                  </div>
                  <div className="bg-black/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Sparkles size={14} /> {recipe.calories} kcal
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-1 space-y-6">
                  <h4 className="text-lg font-black text-gray-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Zistené suroviny
                  </h4>
                  <div className="space-y-3">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="bg-gray-50/50 p-4 rounded-2xl flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-700">{ing.item}</span>
                        <span className="text-sage-600 font-black">{ing.amount} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <h4 className="text-lg font-black text-gray-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Navrhovaný postup
                  </h4>
                  <div className="space-y-6">
                    {recipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-5">
                        <div className="flex-shrink-0 w-8 h-8 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center font-black text-sm border border-sage-100">
                          {i + 1}
                        </div>
                        <p className="text-gray-600 leading-relaxed font-medium pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleSaveRecipe}
                  disabled={isSaving || saveSuccess}
                  className="flex-1 py-5 bg-sage-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-sage-200 active:scale-95 transition-all hover:bg-sage-600 flex items-center justify-center gap-3"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : (saveSuccess ? 'Uložené!' : 'Uložiť do kuchárky')}
                  {!saveSuccess && !isSaving && <ArrowRight size={20} />}
                </button>
                <button 
                  onClick={() => { setImage(null); setRecipe(null); }}
                  className="py-5 px-10 border-2 border-gray-100 text-gray-400 rounded-3xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Zrušiť
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
