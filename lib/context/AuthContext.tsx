"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PortalUser } from "@/lib/types/auth";
import { ALL_VIEWONLY_PAGES } from "@/lib/types/auth";

interface AuthContextValue {
  portalUser: PortalUser | null;
  isAdmin: boolean;
  isCoach: boolean;
  allowedPages: string[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  portalUser: null,
  isAdmin: false,
  isCoach: false,
  allowedPages: [...ALL_VIEWONLY_PAGES],
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("portal_users")
          .select("*")
          .eq("id", user.id)
          .single();
        setPortalUser(data ?? null);
        if (data) {
          await supabase
            .from("portal_users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id);
        }
      } else {
        setPortalUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setPortalUser(null);
    window.location.href = "/login";
  }

  const isAdmin = portalUser?.role === "admin";
  const allowedPages = isAdmin
    ? [...ALL_VIEWONLY_PAGES]
    : (portalUser?.allowed_pages ?? [...ALL_VIEWONLY_PAGES]);

  return (
    <AuthContext.Provider
      value={{
        portalUser,
        isAdmin,
        isCoach: portalUser?.role === "view_only",
        allowedPages,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
