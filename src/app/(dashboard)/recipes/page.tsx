"use client";

import React from "react";
import { Search, Filter, Clock, Utensils, ChevronRight } from "lucide-react";

const mockRecipes = [
  { 
    id: 1, 
    nazov: "Krémové rizoto so špargľou", 
    datum: "30. 4. 2026", 
    cas: "25 min", 
    narocnost: "Stredná",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=2070&auto=format&fit=crop"
  },
  { 
    id: 2, 
    nazov: "Pečené kura na mede a citróne", 
    datum: "28. 4. 2026", 
    cas: "45 min", 
    narocnost: "Jednoduchá",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop"
  },
  { 
    id: 3, 
    nazov: "Šalát s quinoou a avokádom", 
    datum: "25. 4. 2026", 
    cas: "15 min", 
    narocnost: "Jednoduchá",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function RecipesPage() {
  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Moje recepty</h2>
          <p className="text-gray-500 mt-2">Zbierka tvojich obľúbených jedál, ktoré si vygeneroval.</p>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Hľadať v receptoch..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-sage-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400 transition-all shadow-sm"
          />
        </div>
        <button className="px-6 py-3 bg-white border border-sage-100 text-gray-600 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
          <Filter size={20} />
          Filtrovať
        </button>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockRecipes.map((recipe) => (
          <div key={recipe.id} className="group bg-white rounded-2xl border border-sage-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={recipe.image} 
                alt={recipe.nazov}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-sage-700 shadow-sm">
                {recipe.datum}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-1 group-hover:text-sage-600 transition-colors">
                {recipe.nazov}
              </h3>
              <div className="flex justify-between items-center text-gray-500 text-sm mb-6">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-sage-400" />
                  {recipe.cas}
                </div>
                <div className="flex items-center gap-1.5">
                  <Utensils size={16} className="text-sage-400" />
                  {recipe.narocnost}
                </div>
              </div>
              <button className="w-full py-3 bg-sage-50 text-sage-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sage-100 transition-colors">
                Zobraziť recept <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
