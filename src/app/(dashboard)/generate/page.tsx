"use client";

import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Sparkles, 
  Camera, 
  PenLine, 
  Dices,
  ArrowRight,
  ChevronLeft,
  X,
  Check,
  Users,
  User,
  ChefHat,
  WifiOff,
  RefreshCw,
  Clock,
  Flame,
  Utensils,
  Dna,
  Wheat,
  Droplet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_MESSAGES = [
  "Prehľadávam vašu chladničku...",
  "Brúsim kuchárske nože...",
  "Vyháňam mačku z kuchynskej linky...",
  "Hľadám tajné ingrediencie...",
  "Miešam chute podľa vašich preferencií...",
  "Pýtam sa šéfkuchára na názor...",
  "Upratujem stôl pre váš nový recept..."
];

const MOCK_RECIPE = {
  id: "rec_123",
  title: "Krémové tekvicové rizoto",
  description: "Jemné jesenné rizoto s pečenou tekvicou hokkaido a čerstvým šalviovým maslom.",
  prep_time: "15 min",
  cook_time: "30 min",
  difficulty: "Stredná",
  calories: "450 kcal",
  nutrition: {
    protein: { value: 12, unit: "g", color: "bg-blue-500" },
    carbs: { value: 65, unit: "g", color: "bg-amber-500" },
    fat: { value: 18, unit: "g", color: "bg-rose-500" }
  },
  ingredients: [
    { item: "Ryža Arborio", amount: "300", unit: "g" },
    { item: "Tekvica Hokkaido", amount: "500", unit: "g" },
    { item: "Zeleninový vývar", amount: "1", unit: "l" },
    { item: "Šalotka", amount: "2", unit: "ks" },
    { item: "Maslo", amount: "50", unit: "g" },
    { item: "Parmezán", amount: "60", unit: "g" }
  ],
  instructions: [
    "Tekvicu nakrájame na kocky a upečieme v rúre do mäkka.",
    "Na masle speníme šalotku, pridáme ryžu a krátko orestujeme.",
    "Postupne podlievame horúcim vývarom a miešame, kým ryža nezmäkne.",
    "Na záver vmiešame rozmixovanú pečenú tekvicu, parmezán a kúsok masla."
  ]
};

export default function GeneratePage() {
  const [step, setStep] = useState<"choice" | "photo" | "manual" | "loading" | "error" | "result">("choice");
  const [ingredients, setIngredients] = useState("");
  const [cookingFor, setCookingFor] = useState<"me" | "household">("household");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "loading") {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);

      const timer = setTimeout(() => {
        const isError = Math.random() < 0.05;
        if (isError) {
          setStep("error");
        } else {
          setStep("result");
        }
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [step]);

  return (
    <div className="pb-12 space-y-6">
      <AnimatePresence mode="wait">
        {step === "choice" && (
          <motion.div key="choice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <header className="sticky top-0 z-40 bg-[#F8F5F2]/80 backdrop-blur-md flex items-center justify-between py-4 px-2 -mx-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Nový recept</h2>
            </header>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Pre koho varíme?</label>
              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setCookingFor("me")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${cookingFor === 'me' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}><User size={16} /> Len pre mňa</button>
                <button onClick={() => setCookingFor("household")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${cookingFor === 'household' ? 'bg-white shadow-sm text-sage-700' : 'text-gray-500'}`}><Users size={16} /> Domácnosť</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Spôsob zadania</label>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: "random", title: "Prekvap ma", description: "Náhodný recept podľa vašej chuti", icon: Dices, color: "bg-purple-50 text-purple-600" },
                  { id: "photo", title: "Odfotiť chladničku", description: "AI rozpozná suroviny z fotky", icon: Camera, color: "bg-blue-50 text-blue-600" },
                  { id: "manual", title: "Napísať suroviny", description: "Zadajte, čo máte práve po ruke", icon: PenLine, color: "bg-sage-50 text-sage-600" }
                ].map((opt) => (
                  <button key={opt.id} onClick={() => setStep(opt.id === "random" ? "loading" : opt.id as any)} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 text-left group transition-all active:scale-[0.98]">
                    <div className={`w-12 h-12 ${opt.color} rounded-2xl flex items-center justify-center`}><opt.icon size={24} /></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">{opt.title}</h3>
                      <p className="text-gray-400 text-sm font-medium leading-tight">{opt.description}</p>
                    </div>
                    <ArrowRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 px-8">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-sage-100 border-t-sage-500 rounded-full animate-spin" />
              <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sage-500 animate-bounce" size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Pracujeme na tom...</h2>
              <p className="text-sage-600 font-bold text-lg animate-pulse h-12 flex items-center justify-center">{LOADING_MESSAGES[loadingMessageIndex]}</p>
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <header className="flex items-center gap-4 py-4">
              <button onClick={() => setStep("choice")} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Váš recept</h2>
            </header>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-56 flex items-center justify-center relative">
                <img 
                  src="/pumpkin_risotto_hero_1777508788499.png" 
                  alt={MOCK_RECIPE.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                   <span className="bg-sage-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Top Inšpirácia</span>
                   <h3 className="text-2xl font-black text-white mt-2 drop-shadow-lg">{MOCK_RECIPE.title}</h3>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <div className="flex justify-between items-center text-center">
                  <div className="space-y-1">
                    <Clock size={18} className="mx-auto text-sage-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Príprava</p>
                    <p className="font-bold text-gray-800">{MOCK_RECIPE.prep_time}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="space-y-1">
                    <Flame size={18} className="mx-auto text-amber-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Kalórie</p>
                    <p className="font-bold text-gray-800">{MOCK_RECIPE.calories}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="space-y-1">
                    <Utensils size={18} className="mx-auto text-blue-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Náročnosť</p>
                    <p className="font-bold text-gray-800">{MOCK_RECIPE.difficulty}</p>
                  </div>
                </div>

                {/* Nutrition Section */}
                <div className="bg-gray-50/50 rounded-2xl p-4 grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Dna size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Bielkoviny</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-black text-gray-800 leading-none">{MOCK_RECIPE.nutrition.protein.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5">{MOCK_RECIPE.nutrition.protein.unit}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[60%]" />
                      </div>
                   </div>
                   <div className="space-y-2 border-x border-gray-100 px-4">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Wheat size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Sacharidy</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-black text-gray-800 leading-none">{MOCK_RECIPE.nutrition.carbs.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5">{MOCK_RECIPE.nutrition.carbs.unit}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[80%]" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <Droplet size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Tuky</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-black text-gray-800 leading-none">{MOCK_RECIPE.nutrition.fat.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5">{MOCK_RECIPE.nutrition.fat.unit}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[40%]" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-black text-gray-800 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Ingrediencie
                  </h4>
                  <div className="space-y-2">
                    {MOCK_RECIPE.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                        <span className="font-bold text-gray-700 text-sm">{ing.item}</span>
                        <span className="text-sage-600 font-black text-sm">{ing.amount} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-gray-800 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-sage-500 rounded-full" />
                    Postup
                  </h4>
                  <div className="space-y-4">
                    {MOCK_RECIPE.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full py-5 bg-sage-500 text-sage-50 rounded-3xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest hover:bg-sage-600">
               Uložiť do mojej zbierky
            </button>
          </motion.div>
        )}

        {/* Manual/Photo steps same as before... */}
        {step === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <header className="flex items-center gap-4 py-4">
                <button onClick={() => setStep("choice")} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Moje suroviny</h2>
             </header>
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Napr. kura, ryža, mrkva..." className="w-full h-40 bg-gray-50 rounded-2xl p-4 text-lg outline-none focus:bg-white focus:ring-2 focus:ring-sage-400 transition-all resize-none text-gray-800" />
             </div>
             <button onClick={() => setStep("loading")} className="w-full py-5 bg-sage-500 text-sage-50 rounded-3xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest hover:bg-sage-600">Generovať</button>
          </motion.div>
        )}

        {step === "photo" && (
           <motion.div key="photo" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <header className="flex items-center gap-4 py-4">
                <button onClick={() => setStep("choice")} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Odfotiť</h2>
             </header>
             <div className="aspect-[3/4] bg-gray-900 rounded-3xl flex flex-col items-center justify-center text-white p-8 text-center gap-4 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 border-[3px] border-white/20 m-6 rounded-2xl border-dashed" />
                <Camera size={64} className="opacity-50" />
                <p className="font-bold opacity-50 text-sm">Tu sa otvorí fotoaparát</p>
                <button className="mt-4 px-8 py-4 bg-white text-gray-900 rounded-full font-bold shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">Spustiť</button>
             </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 px-8">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner"><WifiOff size={48} /></div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Ups, kuchár stratil wi-fi!</h2>
              <p className="text-gray-400 font-medium leading-relaxed">Nepodarilo sa nám spojiť so serverom. Skontrolujte pripojenie.</p>
            </div>
            <button onClick={() => setStep("loading")} className="w-full py-5 bg-gray-800 text-white rounded-3xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"><RefreshCw size={20} /> Skúsiť znova</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
