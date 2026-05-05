"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home,
  ChefHat, 
  PlusCircle, 
  Users, 
  User 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: "Domov", href: "/dashboard" },
  { icon: ChefHat, label: "Recepty", href: "/recipes" },
  { icon: PlusCircle, label: "Nový", href: "/generate" },
  { icon: Users, label: "Domácnosť", href: "/household" },
  { icon: User, label: "Profil", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-sage-100 flex justify-around items-center px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => {
              if (item.href === "/recipes" && pathname === "/recipes") {
                window.location.href = "/recipes";
              } else {
                router.push(item.href);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 transition-all duration-200 flex-1",
              isActive ? "text-sage-600" : "text-gray-400"
            )}
          >
            <div className={cn(
              "p-1 rounded-2xl transition-all",
              isActive ? "bg-sage-100/50" : ""
            )}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
