"use server";

import { geminiModel, geminiVisionModel } from "@/lib/gemini";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase-server";
import { sendHouseholdInvitation } from "@/lib/mail";

/**
 * Generate a unique AI image for the recipe using Pollinations.ai
 */
function getAiGeneratedImage(prompt: string) {
  const cleanPrompt = encodeURIComponent(`${prompt}, professional food photography, high resolution, delicious, plated, 8k, bokeh background`);
  // Using Pollinations.ai for real-time image generation based on the recipe description
  return `https://pollinations.ai/p/${cleanPrompt}?width=1000&height=800&seed=${Math.floor(Math.random() * 100000)}&nologo=true&model=flux`;
}

function getCategoryImage(category: string) {
  // Deprecated in favor of AI generation, but kept as fallback
  return getAiGeneratedImage(category);
}

function getRandomFoodImage(keyword: string) {
  // Deprecated in favor of getCategoryImage
  return getCategoryImage(keyword);
}

/**
 * Server Action to generate a recipe based on user input.
 */
export async function generateRecipeAction(
  promptText: string, 
  type: "dish" | "ingredients" | "random" | "refine",
  previousRecipe?: any,
  useHousehold: boolean = true
) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    let constraintsPrompt = "";
    
    if (user && useHousehold) {
      // 1. Get Household to find all members
      const { data: household } = await supabase
        .from("households")
        .select("id")
        .or(`owner_id.eq.${user.id}`)
        .maybeSingle();
      
      if (household) {
        const { data: members } = await supabase
          .from("household_members")
          .select(`
            *,
            profiles:user_id (preferences, full_name)
          `)
          .eq("household_id", household.id);
        
        if (members) {
          const allIntolerances = new Set<string>();
          const allDiets = new Set<string>();
          const allDislikes = new Set<string>();
          
          members.forEach((m: any) => {
            const prefs = m.user_id ? m.profiles?.preferences : m.preferences;
            if (prefs) {
              (prefs.intolerances || []).forEach((i: string) => allIntolerances.add(i));
              (prefs.diet || []).forEach((d: string) => allDiets.add(d));
              (prefs.disliked_ingredients || []).forEach((di: string) => allDislikes.add(di));
            }
          });
          
          if (allIntolerances.size > 0 || allDiets.size > 0 || allDislikes.size > 0) {
            constraintsPrompt = `
              DÔLEŽITÉ OBMEDZENIA (RODINNÝ REŽIM):
              ${allIntolerances.size > 0 ? `- Alergie/Intolerancie: ${Array.from(allIntolerances).join(", ")}` : ""}
              ${allDiets.size > 0 ? `- Stravovacie štýly: ${Array.from(allDiets).join(", ")}` : ""}
              ${allDislikes.size > 0 ? `- Tieto suroviny NEPOUŽÍVAJ: ${Array.from(allDislikes).join(", ")}` : ""}
              Recept musí byť bezpečný a chutný pre všetkých členov s týmito požiadavkami.
            `;
          }
        }
      }
    } else if (user && !useHousehold) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();
      
      if (profile?.preferences) {
        const p = profile.preferences;
        if (p.intolerances?.length > 0 || p.diet?.length > 0 || p.disliked_ingredients?.length > 0) {
          constraintsPrompt = `
            DÔLEŽITÉ OBMEDZENIA (LEN PRE MŇA):
            ${p.intolerances?.length > 0 ? `- Alergie/Intolerancie: ${p.intolerances.join(", ")}` : ""}
            ${p.diet?.length > 0 ? `- Stravovacie štýly: ${p.diet.join(", ")}` : ""}
            ${p.disliked_ingredients?.length > 0 ? `- Tieto suroviny NEPOUŽÍVAJ: ${p.disliked_ingredients.join(", ")}` : ""}
          `;
        }
      }
    }

    let finalPrompt = "";

    if (type === "dish") {
      finalPrompt = `Generuj podrobný a chutný recept pre konkrétne jedlo: "${promptText}". 
      Tento recept by mal byť v jeho tradičnej/originálnej forme.
      DÔLEŽITÉ: Predpokladaj, že používateľ nemá ingrediencie doma (okrem úplných základov ako voda/soľ), takže nastav väčšinu na "owned": false.
      ${constraintsPrompt}`;
    } else if (type === "ingredients") {
      finalPrompt = `Mám tieto suroviny: "${promptText}". 
      Vymysli z nich najlepší možný recept. Môžeš pridať bežné základné suroviny ako soľ, korenie, olej, vodu atď.
      ${constraintsPrompt}`;
    } else if (type === "refine") {
      finalPrompt = `Mám tento existujúci recept: ${JSON.stringify(previousRecipe)}.
      Používateľ chce urobiť túto zmenu: "${promptText}".
      Uprav recept (množstvá, ingrediencie, postup, kalórie a nutričné hodnoty) podľa tejto požiadavky tak, aby dával zmysel.
      ${constraintsPrompt}`;
    } else {
      const themes = [
        "Talianska kuchyňa", "Ázijské stir-fry", "Mexické tacos alebo fajitas", 
        "Moderná slovenská kuchyňa", "Stredomorská ryba alebo morské plody", "Blízky východ (hummus, shakshuka)",
        "Francúzske bistro jedlo", "Indické curry", "Zdravý bowl so superpotravinami",
        "Pomalé varenie (ragú, guláš)", "Ľahký letný šalát s proteínom", "Tradičný nedeľný obed v novom šate"
      ];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      
      finalPrompt = `Vymysli náhodný, inšpiratívny a chutný recept pre dnešný deň. 
      Téma pre dnešok: ${randomTheme}.
      Skús vymyslieť niečo originálne, čo bežne človeka nenapadne.
      DÔLEŽITÉ: Keďže používateľ nezadal žiadne vlastné suroviny, nastav pri VŠETKÝCH ingredienciách "owned": false.
      ${constraintsPrompt}`;
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
          "protein": 25,
          "carbs": 40,
          "fat": 15
        },
        "ingredients": [
          { "item": "názov suroviny", "amount": "100", "unit": "g", "buying_amount": "1", "buying_unit": "kg", "owned": true | false }
        ],
        "instructions": [
          "1. krok postupu...",
          "2. krok postupu..."
        ],
        "imagePrompt": "Detailed English description of the dish for AI image generation (e.g. 'Creamy pesto pasta with roasted cherry tomatoes and walnuts')"
      }
      DÔLEŽITÉ PRAVIDLÁ:
      1. JAZYK: Celý text musí byť v SLOVENČINE, OKREM poľa "imagePrompt", ktoré musí byť v ANGLIČTINE (podrobný popis pre generátor obrázkov).
      2. ČÍSLA A ČASY: "calories", "prep_time" a "cook_time" MUSIA byť vždy vyplnené (aj keby len odhad). "prep_time" a "cook_time" vracaj ako string obsahujúci iba číslo v minútach (napr. "15").
      3. LOGICKÁ KONZISTENCIA: Každá surovina spomenutá v postupe MUSÍ byť v ingredienciách.
      3. OWNED PROPERTY (NÁKUPNÝ ZOZNAM): Nastav "owned": true, ak surovina bola v pôvodnom zadaní užívateľa (na fotke alebo v texte). Nastav "owned": false, ak je to surovina, ktorú recept vyžaduje navyše a užívateľ ju pravdepodobne nemá (napr. korenie, príloha, chýbajúci základ).
      4. KOMPLETNOSŤ: Nikdy nevynechávaj základné suroviny potrebné pre daný typ jedla.
      5. ČÍSLA A NUTRIČNÉ HODNOTY: "calories" a nutričné hodnoty (protein, carbs, fat) MUSIA byť čísla (Integer/Float). Nutričné hodnoty počítaj VŽDY na JEDNU PORCIU.
      6. LOGIKA PORCIÍ: Množstvá surovín MUSIA zodpovedať počtu porcií. Ak je "servings" 1, množstvá musia byť primerané pre jednu osobu (napr. 150-200g mäsa). Ak sú množstvá veľké (napr. 600g mäsa), nastav "servings" na zodpovedajúci počet (napr. 3-4).
      7. NÁKUPNÉ JEDNOTKY: Pre každú ingredienciu doplň "buying_amount" a "buying_unit", ktoré predstavujú logické množstvo na nákup v obchode (napr. ak je amount "1" a unit "ČL korenia", buying_amount bude "1" a buying_unit "balenie").
      
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
    
    // Generate a unique AI image based on the descriptive prompt
    recipe.image_url = getAiGeneratedImage(recipe.imagePrompt || recipe.title);
    
    return { success: true, recipe };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { success: false, error: "Nepodarilo sa vygenerovať recept. Skúste to znova." };
  }
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
          image_url: recipeData.image_url || getAiGeneratedImage(recipeData.title)
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
        image_url: recipeData.image_url || null // Explicitly allow null for deletion
      })
      .eq("id", id)
      .select(); // Removed .single() to handle 0 rows gracefully

    if (error) throw error;

    if (!data || data.length === 0) {
      return { 
        success: false, 
        error: "Nemáte oprávnenie na úpravu tohto receptu alebo recept neexistuje." 
      };
    }

    // Force revalidation of all related paths to clear aggressive caches
    revalidatePath("/recipes");
    revalidatePath("/recipes/" + id);
    revalidatePath("/", "layout"); 
    
    return { success: true, recipe: data[0] };
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
        pantry: profileData.pantry || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return { success: false, error: error.message || "Nepodarilo sa uložiť zmeny profilu." };
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
          { "item": "názov suroviny", "amount": "množstvo", "unit": "jednotka", "buying_amount": "množstvo pre nákup", "buying_unit": "jednotka pre nákup" }
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
 * Server Action to scan ingredients from an image and generate a recipe.
 */
export async function analyzeIngredientsImageAction(base64Image: string, useHousehold: boolean = true) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    let constraintsPrompt = "";
    
    // Reuse the same preference logic as generateRecipeAction
    if (user && useHousehold) {
      const { data: household } = await supabase
        .from("households")
        .select("id")
        .or(`owner_id.eq.${user.id}`)
        .maybeSingle();
      
      if (household) {
        const { data: members } = await supabase
          .from("household_members")
          .select(`
            *,
            profiles:user_id (preferences)
          `)
          .eq("household_id", household.id);
        
        if (members) {
          const allIntolerances = new Set<string>();
          const allDiets = new Set<string>();
          const allDislikes = new Set<string>();
          
          members.forEach((m: any) => {
            const prefs = m.user_id ? m.profiles?.preferences : m.preferences;
            if (prefs) {
              (prefs.intolerances || []).forEach((i: string) => allIntolerances.add(i));
              (prefs.diet || []).forEach((d: string) => allDiets.add(d));
              (prefs.disliked_ingredients || []).forEach((di: string) => allDislikes.add(di));
            }
          });
          
          if (allIntolerances.size > 0 || allDiets.size > 0 || allDislikes.size > 0) {
            constraintsPrompt = `
              DÔLEŽITÉ OBMEDZENIA (RODINNÝ REŽIM):
              ${allIntolerances.size > 0 ? `- Alergie/Intolerancie: ${Array.from(allIntolerances).join(", ")}` : ""}
              ${allDiets.size > 0 ? `- Stravovacie štýly: ${Array.from(allDiets).join(", ")}` : ""}
              ${allDislikes.size > 0 ? `- Tieto suroviny NEPOUŽÍVAJ: ${Array.from(allDislikes).join(", ")}` : ""}
            `;
          }
        }
      }
    } else if (user && !useHousehold) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();
      
      if (profile?.preferences) {
        const p = profile.preferences;
        if (p.intolerances?.length > 0 || p.diet?.length > 0 || p.disliked_ingredients?.length > 0) {
          constraintsPrompt = `
            DÔLEŽITÉ OBMEDZENIA (LEN PRE MŇA):
            ${p.intolerances?.length > 0 ? `- Alergie/Intolerancie: ${p.intolerances.join(", ")}` : ""}
            ${p.diet?.length > 0 ? `- Stravovacie štýly: ${p.diet.join(", ")}` : ""}
            ${p.disliked_ingredients?.length > 0 ? `- Tieto suroviny NEPOUŽÍVAJ: ${p.disliked_ingredients.join(", ")}` : ""}
          `;
        }
      }
    }

    const prompt = `Identifikuj všetky suroviny na tomto obrázku (napr. z chladničky alebo nákupu). 
                    Následne z týchto surovín navrhni JEDEN chutný a originálny recept. 
                    ${constraintsPrompt}
                    Odpovedaj VŽDY v slovenčine a výhradne ako čistý JSON v tomto formáte: 
                    {
                      "title": "Názov receptu",
                      "description": "Stručný lákavý popis",
                      "servings": 4,
                      "prep_time": "15",
                      "cook_time": "30",
                      "difficulty": "Jednoduchá",
                      "calories": 450,
                      "nutrition": {"protein": 25, "carbs": 40, "fat": 15},
                      "ingredients": [{"item": "názov", "amount": "100", "unit": "g", "owned": true}],
                      "instructions": ["krok 1", "krok 2"],
                      "imagePrompt": "Detailed English description of the dish for AI image generation"
                    }`;

    const result = await geminiVisionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);

      // Add generated image URL
      data.image_url = getAiGeneratedImage(data.imagePrompt || data.title);

      return { success: true, data };
    } catch (parseError) {
      console.error("JSON Parse Error (Analyze Ingredients):", text);
      return { 
        success: false, 
        error: text.length < 200 ? text : "AI sa nepodarilo analyzovať obrázok. Skúste to prosím znova." 
      };
    }
  } catch (error: any) {
    console.error("Analyze Ingredients Image Error:", error);
    return { success: false, error: "AI sa nepodarilo rozpoznať suroviny. Skúste to prosím znova." };
  }
}

/**
 * Server Action to scan recipe from an image using AI.
 */
export async function scanRecipeImageAction(base64Image: string) {
  try {
    const prompt = `
      Tento obrázok obsahuje napísaný alebo vytlačený recept (z knihy, časopisu alebo ručne písaný). 
      Tvojou úlohou je TEXT receptu rozpoznať (OCR) a pretransformovať ho do štruktúrovaného JSON formátu. 
      Snaž sa presne zachovať názov, ingrediencie (aj s množstvami) a postup. 
      Ak na obrázku chýbajú nutričné hodnoty alebo časy, skús ich rozumne odhadnúť podľa obsahu jedla.

      Odpovedaj VŽDY a VÝHRADNE vo formáte JSON v SLOVENČINE.
      Štruktúra JSON musí byť presne takáto:
      {
        "title": "Názov receptu",
        "description": "Stručný popis",
        "servings": 4,
        "prep_time": "15",
        "cook_time": "30",
        "difficulty": "Stredná",
        "calories": 450,
        "nutrition": {
          "protein": 25,
          "carbs": 50,
          "fat": 15
        },
        "ingredients": [
          { "item": "názov suroviny", "amount": "množstvo", "unit": "jednotka", "buying_amount": "množstvo pre nákup", "buying_unit": "jednotka pre nákup" }
        ],
        "instructions": [
          "krok 1",
          "krok 2"
        ]
      }
    `;

    const result = await geminiVisionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const responseText = response.text();
    
    try {
      // Clean JSON response
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const recipeData = JSON.parse(cleanedJson);

      return { success: true, data: recipeData };
    } catch (parseError) {
      console.error("JSON Parse Error (Scan Recipe):", responseText);
      return { 
        success: false, 
        error: responseText.length < 200 ? responseText : "AI sa nepodarilo prečítať recept z fotky. Skúste fotku urobiť znova s lepším svetlom." 
      };
    }
  } catch (error: any) {
    console.error("Scan Image Error:", error);
    return { success: false, error: "AI sa nepodarilo prečítať recept z fotky. Skúste fotku urobiť znova s lepším svetlom." };
  }
}

/**
 * Household Actions
 */

export async function getOrCreateHouseholdAction(createIfNotFound: boolean = false) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Musíte byť prihlásený." };

    // Find all households where the user is a member
    const { data: memberRecords, error: mError } = await supabase
      .from("household_members")
      .select("household_id, role, joined_at, households(*)")
      .eq("user_id", user.id)
      .order('joined_at', { ascending: false });

    if (mError) throw mError;

    if (memberRecords && memberRecords.length > 0) {
      // Prioritize shared households (where role is 'member') over personal ones (where role is 'owner')
      // This ensures that if someone joins a household, they are directed there instead of their own empty one
      let bestRecord = memberRecords[0];
      
      const sharedRecord = memberRecords.find(r => r.role === 'member');
      if (sharedRecord) {
        bestRecord = sharedRecord;
      }

      const household = Array.isArray(bestRecord.households) 
        ? (bestRecord.households as any)[0] 
        : bestRecord.households;

      if (household) {
        // Automatic cleanup: Rename old default "Moja Rodina" to "Moja Domácnosť"
        if (household.name === "Moja Rodina") {
          const { data: updatedHousehold } = await supabase
            .from("households")
            .update({ name: "Moja Domácnosť" })
            .eq("id", household.id)
            .select()
            .single();
          
          if (updatedHousehold) return { success: true, household: updatedHousehold };
        }
        
        return { success: true, household };
      }
    }

    // If no membership found, check if they own one (for safety/legacy)
    const { data: ownedHousehold } = await supabase
      .from("households")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (ownedHousehold) {
      // Add them as a member if they are owner but not in members table
      await supabase.from("household_members").insert({
        household_id: ownedHousehold.id,
        user_id: user.id,
        role: "owner"
      });
      return { success: true, household: ownedHousehold };
    }

    // If not found and we shouldn't create, return null
    if (!createIfNotFound) {
      return { success: true, household: null };
    }

    // Explicitly create a default one
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

    // Flatten profiles if they come as an array
    const flattenedMembers = data?.map((member: any) => ({
      ...member,
      profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
    })) || [];

    return { success: true, members: flattenedMembers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addHouseholdMemberAction(householdId: string, memberData: any) {
  try {
    const supabase = await getServerSupabase();

    if (memberData.type === "email" || memberData.type === "link") {
      const { data, error } = await supabase
        .from("household_members")
        .insert({
          household_id: householdId,
          invitation_email: memberData.type === "email" ? memberData.email : null,
          status: "pending",
          role: "member",
          preferences: { 
            intolerances: memberData.intolerances || [],
            diet: memberData.diet || [],
            disliked_ingredients: memberData.disliked_ingredients || []
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Only send email if it's an email invitation
      if (memberData.type === "email") {
        const { data: household } = await supabase
          .from("households")
          .select("name")
          .eq("id", householdId)
          .single();
        
        const { data: { user: inviter } } = await supabase.auth.getUser();
        const inviterName = inviter?.user_metadata?.full_name || "Člen rodiny";
        
        await sendHouseholdInvitation(
          memberData.email,
          household?.name || "Moja Domácnosť",
          inviterName,
          data.id
        );
      }

      // DEBUG: Log invitation link to console
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      console.log(`\n🚀 [DEBUG] POZVÁNKA VYGENEROVANÁ (${memberData.type}):`);
      if (memberData.email) console.log(`📧 Pre: ${memberData.email}`);
      console.log(`🔗 Odkaz: ${baseUrl}/invite/${data.id}\n`);

      return { success: true, member: data };
    } else {
      const { data, error } = await supabase
        .from("household_members")
        .insert({
          household_id: householdId,
          display_name: memberData.name,
          status: "active",
          preferences: { 
            intolerances: memberData.intolerances || [],
            diet: memberData.diet || [],
            disliked_ingredients: memberData.disliked_ingredients || []
          },
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

export async function updateHouseholdMemberAction(memberId: string, memberData: any) {
  try {
    const supabase = await getServerSupabase();
    
    const updateData: any = {
      display_name: memberData.name,
      preferences: { 
        intolerances: memberData.intolerances || [],
        diet: memberData.diet || [],
        disliked_ingredients: memberData.disliked_ingredients || []
      }
    };

    const { data, error } = await supabase
      .from("household_members")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, member: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function leaveHouseholdAction(householdId: string) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Musíte byť prihlásený." };

    // Check if they are the owner (owners can't leave this way)
    const { data: household } = await supabase
      .from("households")
      .select("owner_id")
      .eq("id", householdId)
      .maybeSingle();

    if (household?.owner_id === user.id) {
      return { success: false, error: "Správca nemôže opustiť domácnosť. Najskôr ju musíte zmazať alebo previesť na iného člena." };
    }

    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("household_id", householdId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleRecipeShareAction(recipeId: string, shouldShare: boolean) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Musíte byť prihlásený." };

    let householdId = null;
    if (shouldShare) {
      const hResult = await getOrCreateHouseholdAction();
      if (!hResult.success) throw new Error(hResult.error);
      householdId = hResult.household.id;
      console.log(`DEBUG: Sharing recipe ${recipeId} to household ${householdId}`);
    } else {
      console.log(`DEBUG: Unsharing recipe ${recipeId}`);
    }

    const { data: updatedRecipe, error } = await supabase
      .from("recipes")
      .update({ household_id: householdId })
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`DEBUG: Successfully updated recipe ${recipeId}. New household_id: ${updatedRecipe.household_id}`);

    revalidatePath("/recipes");
    revalidatePath("/household");
    return { success: true, recipe: updatedRecipe };
  } catch (error: any) {
    console.error("Toggle Share Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getHouseholdSharedRecipesAction(householdId: string) {
  try {
    const supabase = await getServerSupabase();
    
    // Get recipes shared to this household
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("DEBUG: Shared Recipes Error:", error);
      throw error;
    }

    // Attach author profiles manually for better reliability
    if (recipes && recipes.length > 0) {
      const userIds = [...new Set(recipes.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
        
      if (profiles) {
        const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        recipes.forEach(r => {
          r.profiles = profileMap[r.user_id];
        });
      }
    }

    return { success: true, recipes: recipes || [] };
  } catch (error: any) {
    console.error("Get Shared Recipes Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getInvitationDetailsAction(inviteId: string) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("household_members")
      .select(`
        *,
        households (name)
      `)
      .eq("id", inviteId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: true, invitation: null };

    // If it's already active, check if it's the current user
    if (data.status === 'active') {
      if (user && data.user_id === user.id) {
        return { success: true, invitation: data, alreadyAccepted: true };
      }
      return { success: true, invitation: null, error: "Táto pozvánka už bola použitá." };
    }

    return { success: true, invitation: data };
  } catch (error: any) {
    console.error("Get Invitation Error:", error);
    return { success: false, error: error.message };
  }
}

export async function acceptInvitationAction(inviteId: string, userId: string, fullName: string | null) {
  try {
    const supabase = await getServerSupabase();
    
    // 1. Get invitation details first to check if it's still pending
    const { data: invite, error: fetchError } = await supabase
      .from("household_members")
      .select("household_id, invitation_email")
      .eq("id", inviteId)
      .eq("status", "pending")
      .maybeSingle();
      
    if (fetchError) throw fetchError;
    if (!invite) return { success: false, error: "Pozvánka už nie je platná." };

    // 2. Check if user is already in THIS household
    const { data: existing } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", invite.household_id)
      .eq("user_id", userId)
      .maybeSingle();
      
    if (existing) {
      // If they are already a member, just update the invitation record if it was their record
      // or just return success
      await supabase
        .from("household_members")
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq("id", inviteId);
        
      return { success: true, alreadyMember: true };
    }

    // 3. Update the invitation record
    // Try to get a better name if fullName is missing
    let finalName = fullName;
    if (!finalName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      
      if (profile?.full_name) {
        finalName = profile.full_name;
      }
    }

    const { error: updateError } = await supabase
      .from("household_members")
      .update({
        user_id: userId,
        status: "active",
        display_name: finalName || (invite.invitation_email ? invite.invitation_email.split('@')[0] : "Nový člen"),
        joined_at: new Date().toISOString()
      })
      .eq("id", inviteId);

    if (updateError) throw updateError;

    revalidatePath("/household");
    return { success: true };
  } catch (error: any) {
    console.error("Accept Invitation Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action to normalize ingredients into shopping units using AI.
 */
export async function normalizeShoppingListAction(ingredients: any[]) {
  try {
    const prompt = `
      Pretransformuj tento zoznam ingrediencií z receptu na praktický nákupný zoznam pre obchod.
      Cieľom je previesť kuchynské množstvá (lyžičky, štipky, malé gramáže) na reálne nákupné jednotky (balenia, kusy, kg, l).
      
      Zoznam na transformáciu:
      ${JSON.stringify(ingredients.map(i => ({ item: i.item, amount: i.amount, unit: i.unit })))}
      
      Pravidlá:
      1. Ak je niečoho veľmi málo (lyžička korenia, štipka soli, 5g prášku do pečiva), premeň to na "1 balenie" alebo "balenie".
      2. Ak je gramáž špecifická (napr. 71g múky), zaokrúhli to na logické nákupné množstvo (napr. 1 kg) alebo "balenie".
      3. Ak sú to kusy (napr. 2 cibule), ponechaj kusy alebo zaokrúhli nahor na logické balenie (napr. sáčok).
      4. Vráť zrozumiteľné slovenské názvy a jednotky.
      5. DÔLEŽITÉ: Názvy v poli "item" MUSIA byť IDENTICKÉ s tými, ktoré sú v zozname na transformáciu. Nemeň názvy surovín, len doplň množstvá a jednotky pre nákup.
      
      Vráť VŽDY a VÝHRADNE JSON pole objektov so štruktúrou:
      [
        { "item": "názov suroviny", "amount": "množstvo", "unit": "jednotka" }
      ]
      Návrat len čistý JSON.
    `;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").replace(/\[cite: \d+\]/g, "").trim();
    
    const normalizedData = JSON.parse(text);

    return { success: true, data: normalizedData };
  } catch (error: any) {
    console.error("Normalize Shopping List Error:", error);
    // Fallback: return original ingredients if AI fails
    return { success: true, data: ingredients };
  }
}
