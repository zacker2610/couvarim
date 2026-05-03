"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ChefHat,
  History, 
  User, 
  Settings, 
  PlusCircle,
  Camera,
  LogOut,
  Users
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-sage-100 flex-col p-4 shadow-sm">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 bg-sage-400 rounded-2xl flex items-center justify-center text-white shadow-md">
          <ChefHat size={24} />
        </div>
        <h1 className="text-xl font-bold text-sage-700 tracking-tight">ČoUvarím.sk</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group",
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
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sage-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
          <LogOut size={20} />
          <span className="font-medium">Odhlásiť sa</span>
        </button>
      </div>
    </aside>
  );
}
