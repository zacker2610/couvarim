-- 1. Tabuľka pre profily používateľov
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    preferences JSONB DEFAULT '{"intolerances": [], "diet": [], "goals": {"calories": "0", "protein": "0", "carbs": "0", "fat": "0"}}'::jsonb,
    pantry JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabuľka pre domácnosti (skupiny)
CREATE TABLE IF NOT EXISTS public.households (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabuľka pre členov domácnosti
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES public.households ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member', -- 'owner', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(household_id, user_id)
);

-- Row Level Security (RLS) - základné nastavenie
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Profily: každý môže vidieť a meniť svoj vlastný profil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Domácnosti: vidia ich len členovia
CREATE POLICY "Members can view their households" ON public.households 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.household_members 
            WHERE household_id = public.households.id AND user_id = auth.uid()
        )
    );

-- Automatické vytvorenie profilu po registrácii (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ak trigger už existuje, odstránime ho pre čistý re-štart
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tabuľka pre recepty
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    household_id UUID REFERENCES public.households ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    prep_time TEXT,
    cook_time TEXT,
    servings INTEGER DEFAULT 1,
    difficulty TEXT,
    calories INTEGER DEFAULT 0,
    nutrition JSONB DEFAULT '{"protein": 0, "carbs": 0, "fat": 0}'::jsonb,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pre recepty: vidia ich vlastníci alebo členovia rovnakej domácnosti
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Odstránenie starých politik, ak existujú, aby sme predišli chybám pri duplikovaní
DROP POLICY IF EXISTS "Users can view own or household recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

CREATE POLICY "Users can view own or household recipes" ON public.recipes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (household_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.household_members 
            WHERE household_id = public.recipes.household_id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);
