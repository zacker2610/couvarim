"use server";

import { geminiModel } from "@/lib/gemini";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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
          { "item": "názov suroviny", "amount": "100", "unit": "g", "owned": true | false }
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
        image_url: recipeData.image_url || getAiGeneratedImage(recipeData.title)
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
        pantry: profileData.pantry || [],
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
    
    const { data, error } = await supabase
      .from("household_members")
      .select(`
        *,
        households (name)
      `)
      .eq("id", inviteId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) throw error;
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
    const { error: updateError } = await supabase
      .from("household_members")
      .update({
        user_id: userId,
        status: "active",
        display_name: fullName || (invite.invitation_email ? invite.invitation_email.split('@')[0] : "Nový člen"),
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
