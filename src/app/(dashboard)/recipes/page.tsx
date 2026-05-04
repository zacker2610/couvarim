"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Users,
  Filter, 
  Clock, 
  Utensils, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Plus,
  Loader2,
  ChefHat,
  Check,
  Pencil,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Share2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { deleteRecipeAction, toggleRecipeShareAction } from "@/app/actions/recipes";
import Link from "next/link";

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-sage-500 animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Pripravujem vašu kuchárku...</p>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}

function RecipesContent() {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmRecipe, setDeleteConfirmRecipe] = useState<any | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [userPantry, setUserPantry] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const recipeIdFromUrl = searchParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch profile (goals and pantry)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("preferences, pantry")
          .eq("id", user.id)
          .single();
        
        if (profileData?.preferences?.goals) {
          setUserGoals(profileData.preferences.goals);
        }
        
        if (profileData?.pantry) {
          setUserPantry((profileData.pantry as string[]).map(p => p.toLowerCase()));
        }

        // Fetch recipes
        const { data: dbRecipes, error } = await supabase
          .from("recipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && dbRecipes) {
          setRecipes(dbRecipes);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle URL ID parameter
  useEffect(() => {
    if (recipeIdFromUrl && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === recipeIdFromUrl);
      if (recipe) {
        handleOpenRecipe(recipe);
      }
    }
  }, [recipeIdFromUrl, recipes]);

  const handleOpenRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setView("detail");
    setActiveMenuId(null);
  };

  const handleToggleShare = async (recipe: any) => {
    const shouldShare = !recipe.household_id;
    const result = await toggleRecipeShareAction(recipe.id, shouldShare);
    if (result.success && result.recipe) {
      setRecipes(recipes.map((r: any) => 
        r.id === recipe.id ? { ...r, household_id: result.recipe.household_id } : r
      ));
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe({ ...selectedRecipe, household_id: result.recipe.household_id });
      }
    } else {
      console.error(result.error);
    }
    setActiveMenuId(null);
  };

  const handleExternalShare = (recipe?: any) => {
    const targetRecipe = recipe || selectedRecipe;
    if (!targetRecipe) return;
    
    const ingredientsText = targetRecipe.ingredients
      .map((ing: any) => `- ${ing.item}: ${ing.amount} ${ing.unit}`)
      .join("\n");
      
    const instructionsText = targetRecipe.instructions
      .map((inst: string, i: number) => `${i + 1}. ${inst}`)
      .join("\n");
      
    const text = `👨‍🍳 Recept: ${targetRecipe.title}\n\n📝 Popis: ${targetRecipe.description}\n\n🛒 Ingrediencie:\n${ingredientsText}\n\n🥣 Postup:\n${instructionsText}\n\nPoslané z ČoUvarím.sk`;
    
    if (navigator.share) {
      navigator.share({
        title: targetRecipe.title,
        text: text,
      }).catch(console.error);
    } else {
      const mailUrl = `mailto:?subject=${encodeURIComponent(targetRecipe.title)}&body=${encodeURIComponent(text)}`;
      window.open(mailUrl, "_blank");
    }
    setActiveMenuId(null);
  };

  const handleDeleteRecipe = async () => {
    if (!deleteConfirmRecipe) return;
    
    const id = deleteConfirmRecipe.id;
    const result = await deleteRecipeAction(id);
    if (result.success) {
      setRecipes(recipes.filter(r => r.id !== id));
      setDeleteConfirmRecipe(null);
    } else {
      console.error(result.error);
    }
    setActiveMenuId(null);
  };

  const calculatePercent = (value: number, goal: any) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(Math.round((value / goal) * 100), 100);
  };

  const filteredRecipes = recipes.filter((recipe: any) => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenShareModal = () => {
    if (!selectedRecipe) return;
    
    // Initialize checked ingredients ONLY when opening the modal
    const createdAt = new Date(selectedRecipe.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const isFresh = hoursSinceCreation <= 24;

    const initialChecked = selectedRecipe.ingredients
      ?.filter((ing: any) => {
        const name = ing.item.toLowerCase();
        const isInPantry = userPantry.some(p => name.includes(p) || p.includes(name));
        const isOwned = isFresh && ing.owned;
        return isInPantry || isOwned || name.includes("voda") || name.includes("soľ") || name.includes("korenie");
      })
      .map((ing: any) => ing.item) || [];
    
    setCheckedIngredients(initialChecked);
    setShowShareModal(true);
  };

  const handleShareShoppingList = () => {
    if (!selectedRecipe) return;
    
    // Only share ingredients that are NOT checked
    const missingIngredients = selectedRecipe.ingredients
      .filter((ing: any) => !checkedIngredients.includes(ing.item))
      .map((ing: any) => `- ${ing.item}: ${ing.amount} ${ing.unit}`)
      .join("\n");
      
    if (missingIngredients.length === 0) {
      alert("Všetky suroviny máte označené ako dostupné! 🎉");
      return;
    }
    
    const text = `🛒 Nákupný zoznam pre: ${selectedRecipe.title}\n\n${missingIngredients}\n\nPoslané z ČoUvarím.sk 👨‍🍳`;
    
    if (navigator.share) {
      navigator.share({
        title: `Nákupný zoznam - ${selectedRecipe.title}`,
        text: text,
      }).catch(console.error);
    } else {
      const mailUrl = `mailto:?subject=${encodeURIComponent(`Nákupný zoznam - ${selectedRecipe.title}`)}&body=${encodeURIComponent(text)}`;
      window.open(mailUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-sage-500 animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Načítavam vašu kuchárku...</p>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-6">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md py-4 px-2 -mx-2 mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Moje recepty</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Zbierka vašich jedál</p>
              </div>
              <Link href="/recipes/new" className="p-3 bg-sage-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                <Plus size={24} />
              </Link>
            </header>

            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sage-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Hľadať recept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white border border-transparent focus:border-sage-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sage-500/10 transition-all shadow-sm text-gray-700 font-medium"
                />
              </div>
              <button className="p-4 bg-white text-gray-400 rounded-2xl border border-transparent hover:border-sage-100 hover:text-sage-600 transition-all shadow-sm active:scale-95">
                <Filter size={20} />
              </button>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center space-y-6 border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-sage-50 text-sage-500 rounded-2xl flex items-center justify-center mx-auto">
                   <Utensils size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {searchQuery ? "Nenašli sa žiadne recepty" : "Vaša kuchárka je prázdna"}
                  </h3>
                  <p className="text-gray-400 text-sm font-medium">
                    {searchQuery ? `Pre výraz "${searchQuery}" sme nič nenašli.` : "Pridajte svoj prvý recept manuálne alebo si ho nechajte vygenerovať od AI."}
                  </p>
                </div>
                {!searchQuery && (
                  <Link href="/generate" className="inline-block px-8 py-4 bg-sage-500 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                    Vytvoriť prvý recept
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    onClick={() => handleOpenRecipe(recipe)}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all duration-300 relative cursor-pointer hover:shadow-md hover:border-sage-200"
                  >
                    <div className="relative h-60 overflow-hidden bg-sage-50">
                      {/* Floating More Options Button */}
                      <div className="absolute top-4 right-4 z-20">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === recipe.id ? null : recipe.id);
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur-md text-gray-400 rounded-2xl flex items-center justify-center hover:text-sage-500 transition-all active:scale-90 shadow-sm border border-white/50"
                        >
                          <MoreVertical size={18} />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === recipe.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2"
                            >
                              <Link 
                                href={`/recipes/edit/${recipe.id}`}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-gray-600 hover:bg-sage-50 hover:text-sage-600 flex items-center gap-2 transition-colors"
                              >
                                <Pencil size={14} /> Upraviť
                              </Link>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleShare(recipe);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm font-bold flex items-center gap-2 transition-colors border-t border-gray-50 ${recipe.household_id ? 'text-amber-600 hover:bg-amber-50' : 'text-sage-600 hover:bg-sage-50'}`}
                              >
                                <Users size={14} /> {recipe.household_id ? "Nezdieľať" : "Zdieľať s rodinou"}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExternalShare(recipe);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-gray-600 hover:bg-sage-50 hover:text-sage-600 flex items-center gap-2 transition-colors border-t border-gray-50"
                              >
                                <Share2 size={14} /> Zdieľať externe
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmRecipe(recipe);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                              >
                                <Trash2 size={14} /> Vymazať
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {recipe.household_id && (
                        <div className="absolute top-4 left-4 z-20 bg-sage-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20 scale-90 origin-top-left">
                          <Users size={14} strokeWidth={2.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Spoločný</span>
                        </div>
                      )}
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sage-200">
                          <ChefHat size={60} />
                        </div>
                      )}
                    </div>
                    <div className="p-7">
                      <h3 className="text-xl font-bold text-gray-800 mb-5 line-clamp-2 group-hover:text-sage-600 transition-colors leading-tight h-[3.5rem]">
                        {recipe.title}
                      </h3>
                      <div className="flex justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-7 px-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-sage-400" />
                          {recipe.prep_time} min
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Flame size={14} className="text-amber-400" />
                          {recipe.calories} kcal
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Utensils size={14} className="text-blue-400" />
                          {recipe.difficulty}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleOpenRecipe(recipe)}
                        className="w-full py-5 bg-sage-50 text-sage-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-sage-100 transition-all active:scale-95 text-sm"
                      >
                        Zobraziť recept <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="detail" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <header className="flex items-center gap-4 py-4 px-2 -mx-2">
              <button 
                onClick={() => setView("list")}
                className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-600 active:scale-90 transition-all"
              >
                <ChevronLeft size={22} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight text-center flex-1">Detail</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleExternalShare()}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 active:scale-90 transition-all hover:text-sage-500"
                >
                  <Share2 size={22} />
                </button>
                <Link 
                  href={`/recipes/edit/${selectedRecipe.id}`}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-sage-600 active:scale-90 transition-all"
                >
                  <Pencil size={22} />
                </Link>
              </div>
            </header>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-20">
              <div className="h-72 relative bg-sage-50 flex items-center justify-center overflow-hidden">
                {selectedRecipe.image_url ? (
                  <img 
                    src={selectedRecipe.image_url} 
                    alt={selectedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-sage-100">
                    <ChefHat size={80} />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                   <button 
                    onClick={() => handleToggleShare(selectedRecipe)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 border-2 ${selectedRecipe.household_id ? 'bg-sage-500 text-white border-white' : 'bg-white/80 backdrop-blur-sm text-gray-500 border-transparent hover:bg-white'}`}
                    title={selectedRecipe.household_id ? "Zdieľané s domácnosťou" : "Zdieľať s domácnosťou"}
                  >
                    <Users size={18} />
                  </button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-center">
                   <h3 className="text-3xl font-bold text-white leading-tight drop-shadow-md">{selectedRecipe.title}</h3>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {selectedRecipe.description && (
                  <p className="text-gray-500 text-sm italic leading-relaxed text-center px-6">
                    "{selectedRecipe.description}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-y-6 gap-x-2 border-b border-gray-100 pb-8">
                  <div className="space-y-1 text-center border-r border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Príprava</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-xs">
                       <Clock size={14} className="text-sage-500" />
                       {selectedRecipe.prep_time} min
                    </p>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Varenie</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-xs">
                       <Flame size={14} className="text-amber-500" />
                       {selectedRecipe.cook_time ? `${selectedRecipe.cook_time} min` : "—"}
                    </p>
                  </div>
                  <div className="space-y-1 text-center border-r border-gray-100 pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Náročnosť</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-xs">
                       <Utensils size={14} className="text-rose-500" />
                       {selectedRecipe.difficulty}
                    </p>
                  </div>
                  <div className="space-y-1 text-center pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Porcie</p>
                    <p className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-xs">
                       <Users size={14} className="text-blue-500" />
                       {selectedRecipe.servings || 1} {selectedRecipe.servings === 1 ? "porcia" : (selectedRecipe.servings > 1 && selectedRecipe.servings < 5 ? "porcie" : "porcií")}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-6 space-y-6 border border-gray-100/50 shadow-sm">
                  <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Flame size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Kalórie</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {selectedRecipe.calories || 0} <span className="text-xs font-medium text-gray-400 tracking-normal">kcal</span>
                      </p>
                      {userGoals?.calories > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${calculatePercent(selectedRecipe.calories || 0, userGoals.calories)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-l border-gray-200/50 pl-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Dna size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Bielkoviny</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {selectedRecipe.nutrition?.protein || 0} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.protein > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${calculatePercent(selectedRecipe.nutrition?.protein || 0, userGoals.protein)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-orange-500">
                        <Wheat size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sacharidy</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {selectedRecipe.nutrition?.carbs || 0} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.carbs > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${calculatePercent(selectedRecipe.nutrition?.carbs || 0, userGoals.carbs)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-l border-gray-200/50 pl-4">
                      <div className="flex items-center gap-2 text-rose-600">
                        <Droplet size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tuky</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 leading-none">
                        {selectedRecipe.nutrition?.fat || 0} <span className="text-xs font-medium text-gray-400 tracking-normal">g</span>
                      </p>
                      {userGoals?.fat > 0 && (
                        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden mr-4">
                          <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${calculatePercent(selectedRecipe.nutrition?.fat || 0, userGoals.fat)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-400 mt-4 text-center italic font-medium leading-tight px-4">
                    * Nutričné hodnoty sú vypočítané na jednu porciu podľa uvedených surovín. Pokiaľ príloha nie je v zozname surovín, nie je v hodnotách započítaná.
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                      Ingrediencie
                    </h4>
                    <button 
                      onClick={handleOpenShareModal}
                      className="flex items-center gap-2 px-4 py-2 bg-sage-50 text-sage-600 rounded-2xl text-xs font-bold hover:bg-sage-100 transition-all active:scale-95 border border-sage-100"
                    >
                      <Share2 size={14} /> Zdieľať nákupný zoznam
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedRecipe.ingredients?.map((ing: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50 hover:bg-white transition-colors"
                      >
                        <span className="font-medium text-gray-700">{ing.item}</span>
                        <span className="text-sage-600 font-bold">{ing.amount} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Postup
                  </h4>
                  <div className="space-y-6">
                    {selectedRecipe.instructions?.map((step: string, i: number) => (
                      <div key={i} className="flex gap-5">
                        <div className="w-7 h-7 bg-sage-50 text-sage-600 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xs border border-sage-100">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmRecipe && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmRecipe(null)}
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
                  <AlertTriangle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Vymazať recept?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed px-4">
                    Naozaj chcete vymazať recept <span className="font-bold text-gray-700">"{deleteConfirmRecipe.title}"</span>? Táto akcia sa nedá vrátiť späť.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleDeleteRecipe}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
                  >
                    Áno, vymazať recept
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmRecipe(null)}
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

      {/* Share Shopping List Modal */}
      <AnimatePresence>
        {showShareModal && selectedRecipe && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Zdieľať nákup</h3>
                  <p className="text-xs text-gray-400 font-medium">Vyberte, čo už máte doma</p>
                </div>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center active:scale-90 transition-all"
                >
                  <ChevronLeft size={24} className="rotate-[-90deg] sm:rotate-0" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {selectedRecipe.ingredients?.map((ing: any, i: number) => {
                  const isChecked = checkedIngredients.includes(ing.item);
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setCheckedIngredients(prev => 
                          prev.includes(ing.item) 
                            ? prev.filter(t => t !== ing.item) 
                            : [...prev, ing.item]
                        );
                      }}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isChecked 
                          ? 'bg-sage-50/50 border-sage-200' 
                          : 'bg-gray-50 border-transparent hover:bg-white hover:border-sage-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked 
                            ? 'bg-sage-500 border-sage-500 text-white' 
                            : 'bg-white border-gray-200 text-transparent group-hover:border-sage-300'
                        }`}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className={`font-semibold text-sm transition-all ${isChecked ? 'text-sage-900' : 'text-gray-700'}`}>
                          {ing.item}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                <p className="text-[10px] text-gray-400 text-center italic">
                  * Odznačené položky budú pridané do nákupného zoznamu.
                </p>
                <button 
                  onClick={() => {
                    handleShareShoppingList();
                    setShowShareModal(false);
                  }}
                  className="w-full py-5 bg-sage-500 text-white rounded-2xl font-bold shadow-xl shadow-sage-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Share2 size={20} />
                  Odoslať zoznam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
