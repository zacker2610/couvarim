"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  ChefHat,
  History, 
  User, 
  Settings, 
  PlusCircle,
  Camera,
  LogOut,
  Users,
  Download,
  Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { signOut } from "@/lib/auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: Home, label: "Domov", href: "/dashboard" },
  { icon: ChefHat, label: "Moje recepty", href: "/recipes" },
  { icon: PlusCircle, label: "Nový recept", href: "/generate" },
  { icon: Users, label: "Domácnosť", href: "/household" },
  { icon: User, label: "Profil", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      console.log("PWA: beforeinstallprompt fired");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-sage-100 flex-col p-4 shadow-sm">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-11 h-11 bg-sage-400 rounded-2xl flex items-center justify-center text-white shadow-md">
          <ChefHat size={26} strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-sage-700 tracking-tight">ČoUvarím.sk</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => {
                if (item.href === "/recipes") {
                  window.location.href = "/recipes";
                } else {
                  router.push(item.href);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group text-left",
                isActive 
                  ? "bg-sage-100 text-sage-700 shadow-sm" 
                  : "text-gray-500 hover:bg-sage-50 hover:text-sage-600"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-sage-600" : "text-gray-400 group-hover:text-sage-500"
              )} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sage-100 space-y-2">
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all duration-200"
          >
            <Download size={20} />
            <span className="font-bold text-sm">Nainštalovať appku</span>
          </button>
        )}
        
        {!isInstalled && !deferredPrompt && (
          <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Info size={12} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Inštalácia</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Kliknite na <strong>tři bodky</strong> (Chrome/Edge) alebo <strong>Zdieľať</strong> (Safari) a zvoľte <strong>Inštalovať</strong> alebo <strong>Na plochu</strong>.
            </p>
          </div>
        )}

        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Odhlásiť sa</span>
        </button>
      </div>
    </aside>
  );
}
