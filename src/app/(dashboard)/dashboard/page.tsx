import React from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Camera,
  Utensils,
  Flame,
  ChefHat
} from "lucide-react";
import Link from "next/link";
import { getLatestRecipesAction } from "@/app/actions/recipes";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const result = await getLatestRecipesAction();
  const recipes = result.success && result.recipes ? result.recipes : [];

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Vitaj v kuchyni! 👋
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Na čo máš dnes chuť? Vyber si suroviny a Gemini ti vyčaruje recept.
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/generate" className="group p-6 bg-white rounded-2xl shadow-sm border border-sage-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sage-100 text-sage-500 rounded-2xl group-hover:bg-sage-500 group-hover:text-sage-50 transition-colors duration-300">
              <Sparkles size={24} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-sage-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Generovať recept</h3>
          <p className="text-gray-500 mt-2">Zadaj suroviny, ktoré máš v chladničke a nechaj sa prekvapiť.</p>
        </Link>

        <Link href="/scan" className="group p-6 bg-white rounded-2xl shadow-sm border border-sage-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sage-100 text-sage-500 rounded-2xl group-hover:bg-sage-500 group-hover:text-sage-50 transition-colors duration-300">
              <Camera size={24} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-sage-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Odfotiť ingrediencie</h3>
          <p className="text-gray-500 mt-2">Stačí jedna fotka a naša AI spozná, čo všetko máš k dispozícii.</p>
        </Link>
      </div>

      {/* Recent Recipes */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Posledné recepty</h3>
          <Link href="/recipes" className="text-sage-500 hover:text-sage-600 font-medium flex items-center gap-1 transition-colors text-sm">
            Zobraziť všetky <ChevronRight size={16} />
          </Link>
        </div>
        
        {recipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sage-100 p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-50 text-sage-200 rounded-full mb-4">
              <Clock size={32} />
            </div>
            <p className="text-gray-500 text-lg">Zatiaľ si neuložil žiadne recepty.</p>
            <Link href="/generate" className="inline-flex mt-6 px-6 py-3 bg-sage-500 text-sage-50 rounded-2xl font-semibold hover:bg-sage-600 transition-colors shadow-sm">
              Vytvoriť prvý recept
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe: any) => (
              <Link 
                key={recipe.id} 
                href={`/recipes?id=${recipe.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all duration-300 relative cursor-pointer hover:shadow-md hover:border-sage-200 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-sage-50">
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage-200">
                      <ChefHat size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-bold text-gray-600 uppercase tracking-wider shadow-sm border border-white/50">
                    {recipe.difficulty}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 line-clamp-1 group-hover:text-sage-600 transition-colors leading-tight">
                    {recipe.title}
                  </h4>
                  <div className="mt-auto flex justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest px-1">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-sage-400" />
                      {recipe.prep_time} min
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Flame size={14} />
                      {recipe.calories || 0} kcal
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
