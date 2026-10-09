import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Inbox, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PlatformBadge, StatusBadge, formatDateTime } from "@/components/app/status";
import { useBrand, usePostActions, usePosts, type Post } from "@/hooks/use-brand";
import { PLATFORMS } from "@/lib/platforms";
import { publishPostNow } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/content")({
  component: Content,
});

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Pending review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "needs_integration", label: "Needs integration" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

function Content() {
  const { data: brand } = useBrand();
  const { data: posts, isLoading } = usePosts(brand?.id);
  const actions = usePostActions();
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (posts ?? []).filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (platform === "all" || p.platform === platform),
    );
  }, [posts, status, platform]);

  async function publish(post: Post) {
    setBusyId(post.id);
    try {
      const res = await publishPostNow({ data: { postId: post.id } });
      if (res.ok) toast.success(res.message);
      else toast.warning(res.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Content queue</h1>
          <p className="mt-1 text-muted-foreground">
            Review, edit, schedule and send everything the autopilot produces.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={status === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              busy={busyId === post.id}
              onPublish={() => publish(post)}
              onApprove={() =>
                actions
                  .update(post.id, { status: "scheduled" })
                  .then(() => toast.success("Approved & scheduled"))
                  .catch((e) => toast.error(e.message))
              }
              onReject={() =>
                actions
                  .update(post.id, { status: "rejected" })
                  .then(() => toast.success("Rejected"))
                  .catch((e) => toast.error(e.message))
              }
              onDelete={() =>
                actions
                  .remove(post.id)
                  .then(() => toast.success("Deleted"))
                  .catch((e) => toast.error(e.message))
              }
              onSave={(patch) =>
                actions
                  .update(post.id, patch)
                  .then(() => toast.success("Saved"))
                  .catch((e) => toast.error(e.message))
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="Nothing here"
          hint="Run the autopilot from the dashboard, or generate a post in the Studio."
        />
      )}
    </div>
  );
}

function PostRow({
  post,
  busy,
  onPublish,
  onApprove,
  onReject,
  onDelete,
  onSave,
}: {
  post: Post;
  busy: boolean;
  onPublish: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onSave: (patch: { content?: string; scheduled_for?: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(post.content);
  const [when, setWhen] = useState(post.scheduled_for ? toLocalInput(post.scheduled_for) : "");

  const canApprove = post.status === "draft" || post.status === "pending_approval";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge id={post.platform} />
            <StatusBadge status={post.status} />
            <span className="font-mono text-xs text-muted-foreground">
              {post.scheduled_for
                ? `scheduled ${formatDateTime(post.scheduled_for)}`
                : `created ${formatDateTime(post.created_at)}`}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
          {post.hashtags?.length > 0 && (
            <p className="mt-1 text-xs text-primary/80">
              {post.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          {canApprove && (
            <Button size="sm" onClick={onApprove}>
              <Check /> Approve
            </Button>
          )}
          {post.status !== "published" && (
            <Button size="sm" variant="secondary" onClick={onPublish} disabled={busy}>
              <Send /> {busy ? "Sending…" : "Publish"}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Content</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
                </div>
                <div className="space-y-1.5">
                  <Label>Scheduled for</Label>
                  <Input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    onSave({ content, scheduled_for: when ? new Date(when).toISOString() : null });
                    setOpen(false);
                  }}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {canApprove && (
            <Button size="icon" variant="ghost" title="Reject" onClick={onReject}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" title="Delete" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
