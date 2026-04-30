"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, Utensils, ListChecks, Save } from "lucide-react";
import { geminiVisionModel } from "@/lib/gemini";

interface Recipe {
  nazov: string;
  ingrediencie: string[];
  postup: string[];
  cas: string;
  narocnost: string;
}

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeAndGenerate = async () => {
    if (!image) return;
    
    setLoading(true);
    setRecipe(null);

    try {
      // Convert base64 to parts for Gemini
      const base64Data = image.split(",")[1];
      
      const prompt = `Identifikuj všetky suroviny na tomto obrázku. 
                      Následne z týchto surovín (a bežných domácich zásob ako soľ, korenie, olej) navrhni recept.
                      Zohľadni, že používateľ má tieto intolerancie: Lepok, Laktóza (simulované dáta z profilu). 
                      Odpovedaj v slovenčine a výhradne ako čistý JSON v tomto formáte: 
                      {"nazov": "...", "ingrediencie": ["identifikovaná surovina 1", "..."], "postup": ["..."], "cas": "...", "narocnost": "..."}`;

      const result = await geminiVisionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);
      setRecipe(data);
    } catch (error) {
      console.error("Chyba pri analýze:", error);
      alert("Nepodarilo sa rozpoznať suroviny. Skúste to znova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Odfotiť suroviny</h2>
        <p className="text-gray-500 mt-2">Stačí jedna fotka a Gemini zistí, čo máš v chladničke.</p>
      </header>

      <div className="bg-white p-8 rounded-xl border border-sage-100 shadow-sm flex flex-col items-center">
        {image ? (
          <div className="w-full max-w-md space-y-6">
            <img src={image} alt="Suroviny" className="w-full h-64 object-cover rounded-xl shadow-md border border-sage-50" />
            <div className="flex gap-4">
              <button 
                onClick={() => setImage(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Iná fotka
              </button>
              <button 
                onClick={analyzeAndGenerate}
                disabled={loading}
                className="flex-[2] py-3 bg-sage-400 text-white rounded-xl font-bold shadow-lg hover:bg-sage-500 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Analyzovať a variť
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-md h-64 border-2 border-dashed border-sage-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-sage-50 hover:border-sage-300 transition-all group"
          >
            <div className="w-16 h-16 bg-sage-50 text-sage-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera size={32} />
            </div>
            <p className="text-gray-500 font-medium">Klikni pre nahranie alebo fotenie</p>
            <p className="text-gray-400 text-sm mt-1">Podporuje JPG, PNG</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center p-12">
          <Loader2 className="animate-spin mx-auto text-sage-400 mb-4" size={48} />
          <p className="text-xl text-gray-500 font-medium italic">Gemini skúma vašu chladničku...</p>
        </div>
      )}

      {recipe && (
        <div className="bg-white rounded-xl border border-sage-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-sage-400 p-8 text-white flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold mb-2">{recipe.nazov}</h3>
              <div className="flex gap-4 opacity-90">
                <span className="flex items-center gap-1">
                  <Utensils size={16} /> {recipe.narocnost}
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks size={16} /> {recipe.cas}
                </span>
              </div>
            </div>
            <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
              <Save size={24} />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-1">
              <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-sage-50 pb-2">
                Rozpoznané suroviny
              </h4>
              <ul className="space-y-3">
                {recipe.ingrediencie.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage-400 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-sage-50 pb-2">
                Postup prípravy
              </h4>
              <div className="space-y-6">
                {recipe.postup.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-sage-50 text-sage-600 rounded-lg flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <p className="text-gray-600 leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
