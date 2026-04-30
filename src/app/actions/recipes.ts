"use server";

import { geminiModel } from "@/lib/gemini";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server Action to generate a recipe based on user input.
 */
export async function generateRecipeAction(
  promptText: string, 
  type: "dish" | "ingredients" | "random" | "refine",
  previousRecipe?: any
) {
  try {
    let finalPrompt = "";

    if (type === "dish") {
      finalPrompt = `Generuj podrobný a chutný recept pre konkrétne jedlo: "${promptText}". 
      Tento recept by mal byť v jeho tradičnej/originálnej forme.`;
    } else if (type === "ingredients") {
      finalPrompt = `Mám tieto suroviny: "${promptText}". 
      Vymysli z nich najlepší možný recept. Môžeš pridať bežné základné suroviny ako soľ, korenie, olej, vodu atď.`;
    } else if (type === "refine") {
      finalPrompt = `Mám tento existujúci recept: ${JSON.stringify(previousRecipe)}.
      Používateľ chce urobiť túto zmenu: "${promptText}".
      Uprav recept (množstvá, ingrediencie, postup, kalórie a nutričné hodnoty) podľa tejto požiadavky tak, aby dával zmysel.`;
    } else {
      finalPrompt = `Vymysli náhodný, inšpiratívny a chutný recept pre dnešný deň.`;
    }

    const systemInstruction = `
      Odpovedaj VŽDY a VÝHRADNE vo formáte JSON. Celý text musí byť v SLOVENČINE.
      Štruktúra JSON musí byť presne takáto:
      {
        "title": "Názov receptu",
        "description": "Stručný lákavý popis jedla (max 2 vety)",
        "servings": 4,
        "prep_time": "15",
        "cook_time": "30",
        "difficulty": "Jednoduchá" | "Stredná" | "Náročná",
        "calories": 450, 
        "nutrition": {
          "protein": { "value": 25, "unit": "g" },
          "carbs": { "value": 40, "unit": "g" },
          "fat": { "value": 15, "unit": "g" }
        },
        "ingredients": [
          { "item": "názov suroviny", "amount": "100", "unit": "g" }
        ],
        "instructions": [
          "1. krok postupu...",
          "2. krok postupu..."
        ],
        "imageUrl": "pork stew with cabbage"
      }
      DÔLEŽITÉ PRAVIDLÁ:
      1. JAZYK A JEDNOTKY: Celý text musí byť v SLOVENČINE. Používaj výhradne slovenské jednotky: PL (polievková lyžica), ČL (čajová lyžička), ks (kus), g, kg, ml, l. NIKDY nepoužívaj anglické tbsp, tsp a pod.
      2. LOGICKÁ KONZISTENCIA: Každá surovina spomenutá v postupe (napr. voda, olej, soľ) MUSÍ byť uvedená v zozname ingrediencií s konkrétnym množstvom.
      3. KOMPLETNOSŤ: Nikdy nevynechávaj základné suroviny potrebné pre daný typ jedla (tekutiny pre guláše, tuk na smaženie atď.).
      4. ČÍSLA A NUTRIČNÉ HODNOTY: "calories" a "value" musia byť ČÍSLA (Integer/Float). DÔLEŽITÉ: Nutričné hodnoty (calories, nutrition) počítaj VŽDY na JEDNU PORCIU (teda vydel celkové hodnoty surovin počtom "servings").
      
      Návrat len čistý JSON, žiadne kecy okolo. NIKDY nepoužívaj žiadne citácie ani značky typu [cite: 1].
    `;

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + finalPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    let text = response.text();
    // Clean potential markdown and citations
    text = text.replace(/```json/g, "").replace(/```/g, "").replace(/\[cite: \d+\]/g, "").trim();
    
    const recipe = JSON.parse(text);
    return { success: true, recipe };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { success: false, error: "Nepodarilo sa vygenerovať recept. Skúste to znova." };
  }
}

/**
 * Helper to get server-side supabase client
 */
async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Server Action to save a recipe to Supabase.
 */
export async function saveRecipeAction(recipeData: any) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Musíte byť prihlásený. Ak ste sa práve prihlásili, skúste obnoviť stránku (F5)." };
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          user_id: user.id,
          title: recipeData.title,
          description: recipeData.description || "",
          prep_time: recipeData.prep_time,
          cook_time: recipeData.cook_time,
          difficulty: recipeData.difficulty,
          servings: recipeData.servings || 1,
          calories: recipeData.calories || 0,
          nutrition: recipeData.nutrition || {},
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          image_url: recipeData.image_url || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/recipes");
    return { success: true, recipe: data };
  } catch (error: any) {
    console.error("Save Recipe Error:", error);
    return { success: false, error: error.message || "Nepodarilo sa uložiť recept." };
  }
}

/**
 * Server Action to update an existing recipe.
 */
export async function updateRecipeAction(id: string, recipeData: any) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Musíte byť prihlásený." };
    }

    const { data, error } = await supabase
      .from("recipes")
      .update({
        title: recipeData.title,
        description: recipeData.description || "",
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings || 1,
        calories: recipeData.calories || 0,
        nutrition: recipeData.nutrition || {},
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        image_url: recipeData.image_url || null
      })
      .eq("id", id)
      .eq("user_id", user.id) // Security check: only owner can update
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/recipes");
    return { success: true, recipe: data };
  } catch (error: any) {
    console.error("Update Recipe Error:", error);
    return { success: false, error: error.message || "Nepodarilo sa aktualizovať recept." };
  }
}

/**
 * Server Action to delete a recipe.
 */
export async function deleteRecipeAction(id: string) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Musíte byť prihlásený." };
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Security check: only owner can delete

    if (error) throw error;

    revalidatePath("/recipes");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Recipe Error:", error);
    return { success: false, error: error.message || "Nepodarilo sa vymazať recept." };
  }
}

/**
 * Server Action to update user profile.
 */
export async function updateProfileAction(profileData: any) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Musíte byť prihlásený." };
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: profileData.full_name,
        preferences: profileData.preferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, error: "Nepodarilo sa uložiť zmeny profilu." };
  }
}

/**
 * Server Action to parse raw text into a recipe JSON using AI.
 */
export async function parseRecipeTextAction(rawText: string) {
  try {
    const prompt = `
      Analyzuj tento text a vytiahni z neho recept. Text môže byť akýkoľvek (blog, chat, poznámky).
      Tvojou úlohou je pretransformovať ho do štruktúrovaného formátu JSON.
      Ak v texte chýbajú niektoré informácie (napr. nutričné hodnoty alebo časy), skús ich rozumne odhadnúť podľa obsahu jedla.

      DÔLEŽITÉ: Nutričné hodnoty (calories, protein, carbs, fat) počítaj VŽDY na JEDNU PORCIU. Započítaj iba suroviny, ktoré sú uvedené v texte. Ak v recepte nie je výslovne uvedená príloha (napr. ryža, zemiaky), nezahŕňaj ju do výpočtu.

      Text na analýzu:
      "${rawText}"

      Odpovedaj VŽDY a VÝHRADNE vo formáte JSON v SLOVENČINE.
      Štruktúra JSON musí byť presne takáto:
      {
        "title": "Názov receptu",
        "description": "Stručný popis",
        "servings": 4, (iba číslo!)
        "prep_time": "15", (iba číslo!)
        "cook_time": "30", (iba číslo!)
        "difficulty": "Jednoduchá",
        "calories": 450,
        "nutrition": {
          "protein": 25,
          "carbs": 50,
          "fat": 15
        },
        "ingredients": [
          { "item": "názov suroviny", "amount": "množstvo", "unit": "jednotka" }
        ],
        "instructions": [
          "krok 1",
          "krok 2"
        ]
      }
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean JSON response
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const recipeData = JSON.parse(cleanedJson);

    return { success: true, data: recipeData };
  } catch (error: any) {
    console.error("Parse Text Error:", error);
    return { success: false, error: "AI sa nepodarilo tento text spracovať. Skúste vložiť jasnejší text." };
  }
}
