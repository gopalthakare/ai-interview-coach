import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";

interface HistoryItem {
  id: number;
  role: string;
  date: string;
  score: number;
  resume_match: number;
  difficulty: string;
  duration_minutes: number;
}

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — AI Interview Coach" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data = [], isError } = useQuery<HistoryItem[]>({
    queryKey: ["history"],
    queryFn: () => api<HistoryItem[]>("/history"),
    retry: false,
  });

  const items = data;

  async function handleDelete(id: number) {
    if (!confirm("Delete this interview and its report?")) return;

    try {
      await api(`/history/${id}`, {
        method: "DELETE",
      });

      window.location.reload();
    } catch {
      alert("Failed to delete interview.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Interview history
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every session, ranked and reviewable.
        </p>
      </div>

      {isError && (
        <Card className="card-flat p-4 text-sm text-muted-foreground">
          Failed to load interview history.
        </Card>
      )}

      <Card className="card-flat divide-y divide-border">
        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No interviews yet.
          </div>
        )}

        {items.map((h, i) => (
          <div
            key={h.id}
            className="p-5 flex items-center gap-4 flex-wrap hover:bg-accent/50 transition-colors animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{h.role}</div>
              <div className="text-xs text-muted-foreground">
                {h.date} • {h.duration_minutes}m • {h.difficulty}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="font-semibold text-primary font-mono-nums">
                  {h.score}%
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Resume match
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary font-mono-nums"
                >
                  {h.resume_match}%
                </Badge>
              </div>

              <Button asChild size="sm" variant="outline">
                <Link
                  to="/report/$id"
                  params={{ id: String(h.id) }}
                >
                  View Report
                </Link>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(h.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}