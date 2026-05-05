"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Utensils, 
  Info,
  ChevronDown,
  ChefHat,
  X as CloseIcon,
  Loader2,
  Flame,
  Camera,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { updateRecipeAction } from "@/app/actions/recipes";

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("1");
  const [difficulty, setDifficulty] = useState("Stredná");
  const [ingredients, setIngredients] = useState([{ amount: "", unit: "g", name: "" }]);
  const [steps, setSteps] = useState([""]);
  const [image, setImage] = useState<string | null>(null);
  const [calories, setCalories] = useState<number>(0);
  const [nutrition, setNutrition] = useState({
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      setIsLoading(true);
      const { data: recipe, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error || !recipe) {
        alert("Recept sa nepodarilo nájsť.");
        router.push("/recipes");
        return;
      }

      // Populate states
      setName(recipe.title);
      setDesc(recipe.description || "");
      setPrepTime(recipe.prep_time?.toString().replace(/\D/g, "") || "");
      setCookTime(recipe.cook_time?.toString().replace(/\D/g, "") || "");
      setServings(recipe.servings?.toString() || "1");
      setDifficulty(recipe.difficulty);
      setCalories(recipe.calories || 0);
      setNutrition(recipe.nutrition || { protein: 0, carbs: 0, fat: 0 });
      setImage(recipe.image_url);
      
      if (Array.isArray(recipe.ingredients)) {
        setIngredients(recipe.ingredients.map((ing: any) => ({
          amount: ing.amount || "",
          unit: ing.unit || "g",
          name: ing.item || ing.name || ""
        })));
      }
      
      if (Array.isArray(recipe.instructions)) {
        setSteps(recipe.instructions);
      }

      setIsLoading(false);
    };

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId, router]);

  const addIngredient = () => {
    setIngredients([...ingredients, { amount: "", unit: "g", name: "" }]);
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngs = [...ingredients];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setIngredients(newIngs);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
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

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Prosím zadajte názov receptu.");
      return;
    }

    setIsSaving(true);
    try {
      const recipeData = {
        title: name,
        description: desc,
        prep_time: prepTime.toString().replace(/\D/g, ""),
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

      const result = await updateRecipeAction(recipeId, recipeData);

      if (result.success) {
        router.push(`/recipes?id=${recipeId}`);
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-sage-500 animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Načítavam recept...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-right-4 duration-500 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center gap-3 py-4 px-1 mb-6">
        <Link 
          href="/recipes"
          className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight flex-1 truncate">Upraviť recept</h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-sage-500 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:bg-sage-600"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        </button>
      </header>

      <div className="space-y-6">
        {/* Image Upload Section */}
        <section className="relative h-64 w-full bg-white rounded-2xl border-2 border-dashed border-sage-200 overflow-hidden group shadow-sm">
          {image ? (
            <>
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-all"
              >
                <CloseIcon size={20} />
              </button>
            </>
          ) : (
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors">
              <ChefHat size={64} className="text-sage-200" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </section>
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center">
              <Info size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Základné informácie</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Názov receptu</label>
            <input 
              type="text" 
              placeholder="napr. Domáci Segedínsky guláš"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all font-bold text-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Krátky popis</label>
            <textarea 
              placeholder="Stručne popíšte jedlo..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all text-gray-800 h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Príprava (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-500" size={16} />
                <input 
                  type="number" 
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full pl-10 pr-2 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all font-bold text-gray-800 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Varenie (min)</label>
              <div className="relative">
                <Flame className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                <input 
                  type="number" 
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full pl-10 pr-2 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all font-bold text-gray-800 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Porcie</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                <input 
                  type="number" 
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full pl-10 pr-2 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all font-bold text-gray-800 text-sm"
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
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
            </div>
          </div>

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

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center">
                <Plus size={18} />
              </div>
              <h3 className="font-bold text-gray-800">Suroviny</h3>
            </div>
            <button 
              onClick={addIngredient}
              className="text-sage-600 text-xs font-bold flex items-center gap-1 hover:bg-sage-50 px-2 py-1 rounded-2xl transition-colors"
            >
              <Plus size={14} /> Pridať surovinu
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                <input 
                  type="text" 
                  placeholder="250"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                  className="w-12 px-1 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none font-bold text-gray-800 text-center text-xs"
                />
                <select 
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                  className="w-12 px-0 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none font-bold text-sage-600 text-[10px] text-center appearance-none cursor-pointer"
                >
                  <option>g</option>
                  <option>kg</option>
                  <option>ml</option>
                  <option>l</option>
                  <option>ks</option>
                  <option>pl</option>
                  <option>čl</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Surovina..."
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  className="flex-1 min-w-0 px-3 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none font-medium text-gray-800 text-xs"
                />
                {ingredients.length > 1 && (
                  <button 
                    onClick={() => removeIngredient(index)}
                    className="p-3 text-red-300 hover:text-red-500 active:scale-90 transition-all flex-shrink-0"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center">
                <ChefHat size={18} />
              </div>
              <h3 className="font-bold text-gray-800">Postup</h3>
            </div>
            <button 
              onClick={addStep}
              className="text-sage-600 text-xs font-bold flex items-center gap-1 hover:bg-sage-50 px-2 py-1 rounded-2xl transition-colors"
            >
              <Plus size={14} /> Pridať krok
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-7 h-7 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[10px] mt-2 border border-gray-100">
                  {index + 1}
                </div>
                <textarea 
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder="Napíšte inštrukcie pre tento krok..."
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-sage-500 outline-none transition-all text-sm text-gray-700 min-h-[100px] resize-none"
                />
                {steps.length > 1 && (
                  <button 
                    onClick={() => removeStep(index)}
                    className="p-3 text-red-300 hover:text-red-500 active:scale-90 transition-all flex-shrink-0 mt-1"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
