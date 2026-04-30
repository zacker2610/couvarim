import React from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Camera
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
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
        <Link href="/generate" className="group p-6 bg-white rounded-xl shadow-sm border border-sage-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sage-100 text-sage-500 rounded-xl group-hover:bg-sage-500 group-hover:text-sage-50 transition-colors duration-300">
              <Sparkles size={24} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-sage-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Generovať recept</h3>
          <p className="text-gray-500 mt-2">Zadaj suroviny, ktoré máš v chladničke a nechaj sa prekvapiť.</p>
        </Link>

        <Link href="/scan" className="group p-6 bg-white rounded-xl shadow-sm border border-sage-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sage-100 text-sage-500 rounded-xl group-hover:bg-sage-500 group-hover:text-sage-50 transition-colors duration-300">
              <Camera size={24} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-sage-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Odfotiť ingrediencie</h3>
          <p className="text-gray-500 mt-2">Stačí jedna fotka a naša AI spozná, čo všetko máš k dispozícii.</p>
        </Link>
      </div>

      {/* Recent Recipes Placeholder */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Posledné recepty</h3>
          <Link href="/recipes" className="text-sage-500 hover:text-sage-600 font-medium flex items-center gap-1 transition-colors">
            Zobraziť všetky <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="bg-white rounded-xl border border-sage-100 p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-50 text-sage-200 rounded-full mb-4">
            <Clock size={32} />
          </div>
          <p className="text-gray-500 text-lg">Zatiaľ si neuložil žiadne recepty.</p>
          <Link href="/generate" className="inline-flex mt-6 px-6 py-3 bg-sage-500 text-sage-50 rounded-xl font-semibold hover:bg-sage-600 transition-colors shadow-sm">
            Vytvoriť prvý recept
          </Link>
        </div>
      </section>
    </div>
  );
}
