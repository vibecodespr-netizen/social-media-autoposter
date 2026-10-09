import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — SocialPilot AI" },
      { name: "description", content: "Choose a new password." },
      { property: "og:title", content: "Set a new password" },
      { property: "og:description", content: "Choose a new SocialPilot password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form
        className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Password updated");
          navigate({ to: "/dashboard" });
        }}
      >
        <h1 className="text-2xl font-bold">New password</h1>
        <Input
          type="password"
          minLength={8}
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Button className="w-full" type="submit">
          Update password
        </Button>
      </form>
    </div>
  );
}
