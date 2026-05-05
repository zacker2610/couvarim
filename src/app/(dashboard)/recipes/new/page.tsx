"use client";

import React, { useState, useRef } from "react";
import { 
  ChevronLeft, 
  Camera, 
  Plus, 
  Trash2, 
  Clock, 
  Utensils, 
  ChevronRight,
  ChefHat,
  X,
  FileJson,
  Check,
  AlertCircle,
  Flame,
  Sparkles,
  Wand2,
  Loader2,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { saveRecipeAction, parseRecipeTextAction, scanRecipeImageAction } from "@/app/actions/recipes";
import { supabase } from "@/lib/supabase";

export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("30");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("1");
  const [difficulty, setDifficulty] = useState("Jednoduchá");
  
  const [ingredients, setIngredients] = useState([
    { amount: "", unit: "g", name: "" }
  ]);
  
  const [steps, setSteps] = useState([""]);
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [calories, setCalories] = useState<number>(0);
  const [nutrition, setNutrition] = useState({
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const applyImportedData = (data: any) => {
    if (data.title) setName(data.title);
    if (data.description) setDesc(data.description);
    if (data.prep_time) {
      const val = data.prep_time.toString().replace(/\D/g, "");
      if (val) setTime(val);
    }
    if (data.cook_time) {
      const val = data.cook_time.toString().replace(/\D/g, "");
      if (val) setCookTime(val);
    }
    if (data.servings) {
      setServings(data.servings.toString().replace(/\D/g, "") || "1");
    }
    
    if (data.difficulty) {
      const diff = data.difficulty.toLowerCase();
      if (diff.includes("jednoduch")) setDifficulty("Jednoduchá");
      else if (diff.includes("stredn")) setDifficulty("Stredná");
      else if (diff.includes("náročn") || diff.includes("narocn")) setDifficulty("Náročná");
    }
    if (Array.isArray(data.ingredients)) {
      setIngredients(data.ingredients.map((ing: any) => ({
        amount: ing.amount?.toString() || "",
        unit: ing.unit?.toLowerCase() || "g",
        name: ing.item || ing.name || ""
      })));
    }
    if (Array.isArray(data.instructions)) {
      setSteps(data.instructions.map((s: string) => s.replace(/\[cite: \d+\]/g, "").trim()));
    } else if (Array.isArray(data.steps)) {
      setSteps(data.steps.map((s: string) => s.replace(/\[cite: \d+\]/g, "").trim()));
    }
    if (data.calories) setCalories(Number(data.calories));
    if (data.nutrition) {
      setNutrition({
        protein: Number(data.nutrition.protein?.value || data.nutrition.protein || 0),
        carbs: Number(data.nutrition.carbs?.value || data.nutrition.carbs || 0),
        fat: Number(data.nutrition.fat?.value || data.nutrition.fat || 0)
      });
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { amount: "", unit: "g", name: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...ingredients];
    (newIngredients[index] as any)[field] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
        
        // Compress to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (base64.length > 500000) { // If larger than ~500KB, compress
          const compressed = await compressImage(base64);
          setImage(compressed);
        } else {
          setImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartImport = async () => {
    if (!jsonInput.trim()) return;
    setIsParsing(true);
    setImportError(null);
    try {
      let data: any;
      try {
        const cleanedJson = jsonInput.replace(/```json/g, "").replace(/```/g, "").trim();
        data = JSON.parse(cleanedJson);
      } catch (e) {
        const result = await parseRecipeTextAction(jsonInput);
        if (result.success) data = result.data;
        else throw new Error(result.error);
      }
      
      applyImportedData(data);
      setIsImportModalOpen(false);
      setJsonInput("");
    } catch (err: any) {
      setImportError(err.message || "Nepodarilo sa spracovať text.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleScanRecipe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setImportError(null);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await scanRecipeImageAction(base64);
        
        if (result.success) {
          applyImportedData(result.data);
          setIsImportModalOpen(false);
        } else {
          setImportError(result.error || "Nepodarilo sa prečítať recept.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImportError("Chyba pri spracovaní fotky.");
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      alert("Zadajte prosím názov receptu.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const recipeData = {
        title: name,
        description: desc,
        prep_time: time.toString().replace(/\D/g, ""),
        cook_time: cookTime.toString().replace(/\D/g, ""),
        servings: parseInt(servings) || 1,
        difficulty: difficulty,
        ingredients: ingredients.map(ing => ({
          item: ing.name,
          amount: ing.amount,
          unit: ing.unit
        })),
        instructions: steps.filter(s => s.trim() !== ""),
        image_url: image,
        calories: calories,
        nutrition: nutrition
      };

      const result = await saveRecipeAction(recipeData);
      if (result.success) {
        router.push(`/recipes?id=${result.recipe.id}`);
        router.refresh();
      } else {
        alert("Chyba pri ukladaní: " + result.error);
      }
    } catch (err: any) {
      alert("Vyskytla sa nečakaná chyba pri ukladaní: " + (err?.message || JSON.stringify(err)));
      console.error("Save error:", err);
    }
    setIsSaving(false);
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center gap-4 py-4 px-1 mb-6">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 bg-white rounded-2xl shadow-md border border-gray-100 text-gray-400 hover:text-gray-600 active:scale-90 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex-1">Nový recept</h2>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="w-12 h-12 bg-sage-500 text-white rounded-2xl shadow-md active:scale-90 transition-all flex items-center justify-center"
        >
          <Sparkles size={22} strokeWidth={2.5} />
        </button>
      </header>

      <div className="space-y-8">
        {/* Image Upload Section */}
        <section className="relative h-64 w-full bg-white rounded-2xl border-2 border-dashed border-sage-200 overflow-hidden group">
          {image ? (
            <>
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors">
              <Camera size={64} className="text-sage-200" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Názov receptu</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="napr. Domáca sviečková..."
              className="w-full px-6 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 focus:ring-4 focus:ring-sage-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Krátky popis</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Stručne popíšte jedlo..."
              className="w-full px-6 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 focus:ring-4 focus:ring-sage-500/10 transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Príprava</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500" size={18} />
                <input 
                  type="number" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="30"
                  className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">min</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Varenie</label>
              <div className="relative">
                <Flame className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                <input 
                  type="number" 
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="45"
                  className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">min</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Porcie</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input 
                  type="number" 
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="1"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 transition-all text-center"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Náročnosť</label>
            <div className="relative">
              <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500" size={18} />
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 appearance-none transition-all"
              >
                <option>Jednoduchá</option>
                <option>Stredná</option>
                <option>Náročná</option>
              </select>
            </div>
          </div>

          {/* New Nutrition section */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-0.5 text-center block">Kcal</label>
              <input 
                type="number" 
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-1 py-3 rounded-2xl bg-white border-transparent focus:border-sage-500 outline-none shadow-sm text-xs font-bold text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-0.5 text-center block">Bielk.</label>
              <input 
                type="number" 
                value={nutrition.protein}
                onChange={(e) => setNutrition(prev => ({ ...prev, protein: Number(e.target.value) }))}
                className="w-full px-1 py-3 rounded-2xl bg-white border-transparent focus:border-sage-500 outline-none shadow-sm text-xs font-bold text-center text-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-0.5 text-center block">Sach.</label>
              <input 
                type="number" 
                value={nutrition.carbs}
                onChange={(e) => setNutrition(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                className="w-full px-1 py-3 rounded-2xl bg-white border-transparent focus:border-sage-500 outline-none shadow-sm text-xs font-bold text-center text-amber-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-0.5 text-center block">Tuky</label>
              <input 
                type="number" 
                value={nutrition.fat}
                onChange={(e) => setNutrition(prev => ({ ...prev, fat: Number(e.target.value) }))}
                className="w-full px-1 py-3 rounded-2xl bg-white border-transparent focus:border-sage-500 outline-none shadow-sm text-xs font-bold text-center text-rose-500"
              />
            </div>
          </div>
        </section>

        {/* Ingredients Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Suroviny</h3>
            <button 
              onClick={addIngredient}
              className="flex items-center gap-1.5 text-sage-600 text-xs font-bold hover:text-sage-700 active:scale-95 transition-all"
            >
              <Plus size={14} /> Pridať surovinu
            </button>
          </div>
          
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                <input 
                  type="text" 
                  placeholder="250"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                  className="w-16 px-2 py-3.5 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-bold text-gray-800 text-center text-sm"
                />
                <select 
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                  className="w-16 px-1 py-3.5 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-bold text-sage-600 text-[10px] text-center appearance-none cursor-pointer"
                >
                  <option>g</option>
                  <option>kg</option>
                  <option>ml</option>
                  <option>l</option>
                  <option>ks</option>
                  <option>čl</option>
                  <option>pl</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Názov suroviny..."
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  className="flex-1 min-w-0 px-3 py-3.5 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 text-sm"
                />
                {ingredients.length > 1 && (
                  <button 
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Steps Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Postup prípravy</h3>
            <button 
              onClick={addStep}
              className="flex items-center gap-1.5 text-sage-600 text-xs font-bold hover:text-sage-700 active:scale-95 transition-all"
            >
              <Plus size={14} /> Pridať krok
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 animate-in fade-in slide-in-from-right-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-sage-500 text-sage-50 rounded-lg flex items-center justify-center text-xs font-bold shadow-md">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && <div className="w-0.5 flex-1 bg-sage-100 rounded-full" />}
                </div>
                <div className="flex-1 pb-4 flex gap-2">
                  <textarea 
                    placeholder={`Krok ${index + 1}: Čo urobíme ako prvé?`}
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-5 py-4 rounded-2xl bg-white border border-transparent focus:border-sage-500 outline-none shadow-sm font-medium text-gray-800 resize-none transition-all"
                  />
                  {steps.length > 1 && (
                    <button 
                      onClick={() => removeStep(index)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-sage-600 disabled:opacity-70"
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ChefHat size={24} />
          )}
          {isSaving ? "Ukladám..." : "Uložiť do mojej kuchárky"}
        </button>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-xl bg-[#F8F5F2] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Wand2 className="text-sage-500" />
                    Inteligentný import
                  </h3>
                  <button onClick={() => setIsImportModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 leading-relaxed">
                  Vložte sem akýkoľvek text receptu (napr. z blogu, chatu alebo poznámok). AI automaticky rozpozná suroviny aj postup a vyplní formulár.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => scanInputRef.current?.click()}
                      disabled={isScanning || isParsing}
                      className="w-full py-8 bg-white border-2 border-dashed border-sage-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-sage-50 transition-all active:scale-95 group disabled:opacity-50"
                    >
                      <div className="w-14 h-14 bg-sage-100 text-sage-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {isScanning ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-black text-sage-700 uppercase tracking-widest">Odfotiť recept</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Papier, kniha alebo poznámky</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={scanInputRef}
                        onChange={handleScanRecipe}
                      />
                    </button>
                  </div>

                  <div className="relative py-2 flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Alebo vložte text</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <textarea 
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Prilepte sem text receptu (napr. z blogu)..."
                    disabled={isParsing || isScanning}
                    className="w-full h-40 p-6 rounded-2xl bg-white border border-gray-100 text-sm outline-none focus:ring-4 focus:ring-sage-500/10 transition-all resize-none shadow-inner disabled:opacity-50 font-medium"
                  />
                  
                  {importError && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
                      <AlertCircle size={16} />
                      {importError}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold border border-gray-200 active:scale-95 transition-all"
                  >
                    Zrušiť
                  </button>
                  <button 
                    onClick={handleSmartImport}
                    disabled={isParsing || !jsonInput.trim()}
                    className="flex-1 py-4 bg-sage-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        AI spracováva...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Importovať recept
                      </>
                    )}
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
