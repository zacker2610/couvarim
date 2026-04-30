import Link from "next/link";
import { ChefHat, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col overflow-hidden">
      {/* Desktop Navigation (Hidden on mobile) */}
      <nav className="hidden sm:flex max-w-7xl mx-auto w-full px-6 py-6 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center text-sage-50 shadow-md">
            <ChefHat size={20} />
          </div>
          <span className="text-xl font-bold text-sage-700">ČoUvarím.sk</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-2.5 text-sage-700 font-semibold hover:bg-sage-50 rounded-xl transition-all">
            Prihlásiť sa
          </Link>
          <Link href="/register" className="px-6 py-2.5 bg-sage-500 text-sage-50 font-semibold rounded-xl shadow-md hover:bg-sage-600 transition-all">
            Začať zadarmo
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
        {/* Mobile Logo (Visible only on mobile) */}
        <div className="sm:hidden absolute top-12 left-0 right-0 flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-sage-500 rounded-2xl flex items-center justify-center text-sage-50 shadow-xl mb-2">
            <ChefHat size={32} />
          </div>
          <span className="text-2xl font-bold text-sage-700 tracking-tight">ČoUvarím.sk</span>
        </div>

        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-100 text-sage-700 rounded-full text-sm font-bold mb-8 mx-auto">
            <Sparkles size={14} />
            <span className="tracking-tight text-[10px]">Inteligentné varenie s AI</span>
          </div>
          
          <h1 className="text-4xl sm:text-7xl font-bold text-gray-900 tracking-tighter mb-6 leading-[1.1]">
            Varte z toho, <br />
            čo <span className="text-sage-500">máte doma.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-12 px-4">
            Premeňte suroviny vo vašej chladničke na gurmánsky zážitok vďaka umelej inteligencii.
          </p>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex gap-4 justify-center">
            <Link href="/register" className="px-10 py-4 bg-sage-500 text-sage-50 text-lg font-bold rounded-2xl shadow-xl hover:bg-sage-600 transition-all flex items-center gap-2 group">
              Vyskúšať teraz <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-4 bg-white text-gray-700 text-lg font-bold rounded-2xl shadow-md border border-gray-100 hover:bg-gray-50 transition-all">
              Ako to funguje?
            </button>
          </div>
        </div>

        {/* Mobile Action Area (Fixed at bottom for native feel) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-8 space-y-4 bg-gradient-to-t from-[#F8F5F2] via-[#F8F5F2] to-transparent pt-20">
          <Link href="/register" className="w-full py-5 bg-sage-500 text-sage-50 rounded-2xl font-bold shadow-xl flex items-center justify-center active:scale-95 transition-all">
            Začať teraz
          </Link>
          <Link href="/login" className="w-full py-5 bg-white text-gray-700 rounded-2xl font-bold shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-all">
            Už mám účet
          </Link>
          <div className="h-safe-area-inset-bottom" />
        </div>
      </main>

      {/* Desktop Features Section (Hidden on mobile) */}
      <section className="hidden sm:block bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-12 text-center">
          <Feature icon={<Sparkles />} title="Osobné preferencie" text="AI berie do úvahy vaše alergie, intolerancie a chute." />
          <Feature icon={<Sparkles />} title="Rozpoznanie fotky" text="Odfote suroviny a naša technológia ich identifikuje." />
          <Feature icon={<Sparkles />} title="História receptov" text="Všetky vaše vygenerované lahôdky máte po ruke." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-sage-50 text-sage-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{text}</p>
    </div>
  );
}
