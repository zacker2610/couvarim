import { supabase } from "./supabase";

export const signInWithGoogle = async (redirectTo?: string) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error.message);
    alert("Nepodarilo sa prihlásiť cez Google.");
  }

  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, name: string, redirectTo?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    alert("Chyba pri registrácii: " + error.message);
  } else {
    alert("Registrácia úspešná! Skontrolujte si email pre potvrdenie.");
  }

  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    alert("Chyba pri prihlásení: " + error.message);
  }

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
  } else {
    window.location.href = "/";
  }
};
