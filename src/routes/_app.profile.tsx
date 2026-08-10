import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — PrepPundit" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <Card className="card-flat p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary grid place-items-center text-xl font-semibold text-primary-foreground">
            {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{user?.full_name || "Anonymous"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <Badge className="mt-2 bg-primary text-primary-foreground border-0">Pro trial</Badge>
          </div>
        </div>
      </Card>
      <Card className="card-flat p-6">
        <h3 className="font-semibold mb-3">Account</h3>
        <dl className="text-sm space-y-2">
          <Row k="User ID" v={String(user?.id ?? "—")} mono />
          <Row k="Email" v={user?.email ?? "—"} />
          <Row k="Joined" v={formatJoinedDate(user?.created_at)} />
        </dl>
      </Card>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={mono ? "font-mono-nums" : undefined}>{v}</dd>
    </div>
  );
}

function formatJoinedDate(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}