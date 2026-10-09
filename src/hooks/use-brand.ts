import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Source = Database["public"]["Tables"]["sources"]["Row"];
export type Activity = Database["public"]["Tables"]["activity_log"]["Row"];

export function useBrand() {
  return useQuery({
    queryKey: ["brand"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: e2 } = await supabase
        .from("brands")
        .insert({ user_id: u.user.id })
        .select()
        .single();
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

export function usePosts(brandId?: string) {
  return useQuery({
    queryKey: ["posts", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useIdeas(brandId?: string) {
  return useQuery({
    queryKey: ["ideas", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("brand_id", brandId!)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSources(brandId?: string) {
  return useQuery({
    queryKey: ["sources", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivity(brandId?: string) {
  return useQuery({
    queryKey: ["activity", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["ideas"] });
    qc.invalidateQueries({ queryKey: ["sources"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
    qc.invalidateQueries({ queryKey: ["brand"] });
  };
}

export function usePostActions() {
  const invalidate = useInvalidate();
  return {
    create: async (rows: Database["public"]["Tables"]["posts"]["Insert"][]) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("posts")
        .insert(rows.map((r) => ({ ...r, user_id: u.user!.id })));
      if (error) throw error;
      await invalidate();
    },
    update: async (id: string, patch: Database["public"]["Tables"]["posts"]["Update"]) => {
      const { error } = await supabase.from("posts").update(patch).eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    remove: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
  };
}

export function useSourceActions() {
  const invalidate = useInvalidate();
  return {
    add: async (brandId: string, url: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("sources")
        .insert({ brand_id: brandId, user_id: u.user.id, url });
      if (error) throw error;
      await invalidate();
    },
    toggle: async (id: string, active: boolean) => {
      const { error } = await supabase.from("sources").update({ active }).eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    remove: async (id: string) => {
      const { error } = await supabase.from("sources").delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
  };
}
