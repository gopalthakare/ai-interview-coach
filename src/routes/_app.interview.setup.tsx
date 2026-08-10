import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Brain, Users, MessageSquare, Layers, Play, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

export const Route = createFileRoute("/_app/interview/setup")({
  head: () => ({ meta: [{ title: "New Interview — PrepPundit" }] }),
  component: SetupPage,
});

const TYPES = [
  { id: "technical", label: "Technical", icon: Brain, desc: "Coding, systems, domain knowledge." },
  { id: "hr", label: "HR", icon: Users, desc: "Motivation, culture, expectations." },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare, desc: "STAR stories from your experience." },
  { id: "mixed", label: "Mixed", icon: Layers, desc: "A realistic blend of everything." },
];

function SetupPage() {
  const [type, setType] = useState("technical");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [duration, setDuration] = useState("20");
  const navigate = useNavigate();

  const start = useMutation({
    mutationFn: () =>
      api<{ interview_id: number }>("/interview/start", {
        body: { type, difficulty, duration_minutes: Number(duration) },
      }),
    onSuccess: (r) => {
      navigate({to: "/interview/live", search: { id: String(r.interview_id), duration, difficulty, type,} as never,});
    },
    onError: (e) => {
      // Fall back to demo mode when backend not available
      toast.warning("Starting in demo mode (no backend detected)");
      navigate({ to: "/interview/live", search: { id: "demo", type, difficulty, duration } as never });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configure your interview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll generate adaptive questions from your resume and target role.
        </p>
      </div>

      <Card className="card-flat p-6">
        <h3 className="font-semibold mb-4">Interview type</h3>
        <div className="grid gap-3 md:grid-cols-4">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                "p-4 rounded-xl border text-left transition",
                type === t.id
                  ? "border-primary/60 bg-primary/10"
                  : "border-border hover:border-primary/30",
              )}
            >
              <t.icon className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium text-sm">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-flat p-6">
          <h3 className="font-semibold mb-4">Difficulty</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "relative p-3 rounded-lg border text-sm font-medium capitalize transition text-center",
                  difficulty === d
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                {difficulty === d && (
                  <Check className="h-3.5 w-3.5 absolute top-1.5 right-1.5" />
                )}
                {d}
              </button>
            ))}
          </div>
        </Card>
        <Card className="card-flat p-6">
          <h3 className="font-semibold mb-4">Duration</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["10", "20", "30"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  "relative p-3 rounded-lg border text-sm font-medium transition text-center font-mono-nums",
                  duration === d
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                {duration === d && (
                  <Check className="h-3.5 w-3.5 absolute top-1.5 right-1.5" />
                )}
                {d} min
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={start.isPending}
          onClick={() => start.mutate()}
          className="bg-primary text-primary-foreground border-0"
        >
          <Play className="h-4 w-4" />
          {start.isPending ? "Starting…" : "Begin interview"}
        </Button>
      </div>
    </div>
  );
}