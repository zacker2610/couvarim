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
 * Server Action to get the latest 3 recipes for the user.
 */
export async function getLatestRecipesAction() {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Musíte byť prihlásený." };
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    return { success: true, recipes: data };
  } catch (error: any) {
    console.error("Get Latest Recipes Error:", error);
    return { success: false, error: error.message || "Nepodarilo sa načítať recepty." };
  }
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

/**
 * Household Actions
 */

export async function getOrCreateHouseholdAction() {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Musíte byť prihlásený." };

    // Try to find if user is already in a household (as owner)
    const { data: household } = await supabase
      .from("households")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (household) {
      return { success: true, household };
    }

    // Try to find if user is a member of any household
    const { data: memberOf } = await supabase
      .from("household_members")
      .select("household_id, households(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberOf) {
      return { success: true, household: memberOf.households };
    }

    // If not, create a default one
    const { data: newHousehold, error: hError } = await supabase
      .from("households")
      .insert({
        name: "Moja Domácnosť",
        owner_id: user.id
      })
      .select()
      .single();

    if (hError) throw hError;

    // Add owner as a member
    await supabase.from("household_members").insert({
      household_id: newHousehold.id,
      user_id: user.id,
      role: "owner"
    });

    return { success: true, household: newHousehold };
  } catch (error: any) {
    console.error("Household Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getHouseholdMembersAction(householdId: string) {
  try {
    const supabase = await getServerSupabase();
    
    const { data, error } = await supabase
      .from("household_members")
      .select(`
        *,
        profiles:user_id (full_name, preferences)
      `)
      .eq("household_id", householdId);

    if (error) throw error;

    return { success: true, members: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addHouseholdMemberAction(householdId: string, memberData: any) {
  try {
    const supabase = await getServerSupabase();

    if (memberData.type === "registered") {
      return { success: false, error: "Pridávanie podľa emailu bude dostupné čoskoro." };
    } else {
      const { data, error } = await supabase
        .from("household_members")
        .insert({
          household_id: householdId,
          display_name: memberData.name,
          preferences: { intolerances: memberData.intolerances || [] },
          role: "member"
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, member: data };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeHouseholdMemberAction(memberId: string) {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
