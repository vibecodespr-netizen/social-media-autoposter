import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Source = Database["public"]["Tables"]["sources"]["Row"];

export function useBrand() {
  return useQuery({
    queryKey: ["brand"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("brands").select("*").order("created_at").limit(1).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: e2 } = await supabase.from("brands").insert({ user_id: u.user.id }).select().single();
      if (e2) throw e2;
      return created;
    },
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return async (id: string, patch: Database["public"]["Tables"]["brands"]["Update"]) => {
    const { error } = await supabase.from("brands").update(patch).eq("id", id);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["brand"] });
  };
}
