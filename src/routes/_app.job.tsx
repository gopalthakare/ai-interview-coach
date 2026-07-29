import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileSearch, Code2, Brain, Cpu, LineChart, Coffee, Layout, Server, Layers } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api } from "../lib/api";

interface JobAnalysis {
  role: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  match: {
    percentage: number;
    matched: string[];
    missing: string[];
    suggested: string[];
  };
}

const PRESETS = [
  { label: "Python Developer", icon: Code2 },
  { label: "AI Engineer", icon: Brain },
  { label: "Machine Learning Engineer", icon: Cpu },
  { label: "Data Scientist", icon: LineChart },
  { label: "Java Developer", icon: Coffee },
  { label: "Frontend Developer", icon: Layout },
  { label: "Backend Developer", icon: Server },
  { label: "Full Stack Developer", icon: Layers },
];

export const Route = createFileRoute("/_app/job")({
  head: () => ({ meta: [{ title: "Job Description — AI Interview Coach" }] }),
  component: JobPage,
});

function JobPage() {
  const qc = useQueryClient();
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<JobAnalysis | null>(null);

  const analyze = useMutation({
    mutationFn: (payload: { text?: string; preset?: string }) =>
      api<JobAnalysis>("/job/analyze", { body: payload }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Job analyzed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Target job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a JD or pick a role. We'll match it to your resume.
        </p>
      </div>

      <Card className="card-flat p-6">
        <Tabs defaultValue="paste">
          <TabsList className="bg-muted">
            <TabsTrigger value="paste">Paste JD</TabsTrigger>
            <TabsTrigger value="preset">Predefined role</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="space-y-4 mt-4">
            <Textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here…"
              className="min-h-48 bg-muted border-border"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                We'll pull out required skills, seniority, and keywords, then match them against your resume.
              </p>
              <Button
                disabled={!jd.trim() || analyze.isPending}
                onClick={() => analyze.mutate({ text: jd })}
                className="bg-primary text-primary-foreground border-0 shrink-0"
              >
                <FileSearch className="h-4 w-4" />
                {analyze.isPending ? "Analyzing…" : "Analyze JD"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="preset" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => analyze.mutate({ preset: p.label })}
                  disabled={analyze.isPending}
                  className="p-4 rounded-xl card-flat border border-border text-sm hover:border-primary/40 hover:-translate-y-0.5 transition-all text-left animate-fade-up flex items-center gap-3"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                    <p.icon className="h-4 w-4 text-primary" />
                  </span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {result && (
        <>
          <Card className="card-flat p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Resume match</div>
                <div className="mt-1 text-3xl font-semibold text-primary font-mono-nums">{result.match.percentage}%</div>
              </div>
              <div className="text-sm text-muted-foreground">Role: {result.role}</div>
            </div>
            <Progress value={result.match.percentage} className="mt-4 h-2" />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <SkillList title="Matched skills" tone="primary" items={result.match.matched} />
            <SkillList title="Missing skills" tone="destructive" items={result.match.missing} />
            <SkillList title="Suggested to learn" tone="accent" items={result.match.suggested} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-flat p-6">
              <h3 className="font-semibold mb-3">Required skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.required_skills.map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </Card>
            <Card className="card-flat p-6">
              <h3 className="font-semibold mb-3">Responsibilities</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                {result.responsibilities.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Display-only formatting: the backend sends these tags lowercase, but the
// "Required skills" section (sourced from the JD parser) comes pre-cased.
// This keeps the whole page visually consistent without touching any data.
const ACRONYMS: Record<string, string> = {
  ai: "AI", ml: "ML", api: "API", apis: "APIs", sql: "SQL", aws: "AWS",
  gcp: "GCP", nlp: "NLP", "ci/cd": "CI/CD", mlops: "MLOps", ui: "UI", ux: "UX",
  html: "HTML", css: "CSS", yolo: "YOLO", shap: "SHAP", lime: "LIME",
  fastapi: "FastAPI", opencv: "OpenCV", mysql: "MySQL", numpy: "NumPy",
  xgboost: "XGBoost", "next.js": "Next.js", javascript: "JavaScript",
};

function formatSkillLabel(raw: string): string {
  return raw
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      return word
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join("-");
    })
    .join(" ");
}

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: "primary" | "destructive" | "accent" }) {
  const cls =
    tone === "primary" ? "border-primary/30 text-primary" :
    tone === "destructive" ? "border-destructive/30 text-destructive" :
    "border-chart-4/30 text-chart-4";
  return (
    <Card className="card-flat p-6">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
        {items.map((s) => (
          <Badge key={s} variant="outline" className={cls}>{formatSkillLabel(s)}</Badge>
        ))}
      </div>
    </Card>
  );
}