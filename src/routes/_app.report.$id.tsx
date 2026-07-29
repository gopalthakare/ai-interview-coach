import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Award, TrendingUp, AlertCircle, BookOpen } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { api, API_BASE_URL, getToken } from "../lib/api";

interface Report {
  id: number;
  role: string;
  date: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  strengths: string[];
  weaknesses: string[];
  skill_gaps: string[];
  topics_to_improve: string[];
  roadmap: { step: string; detail: string }[];
}

export const Route = createFileRoute("/_app/report/$id")({
  head: () => ({ meta: [{ title: "Interview Report — AI Interview Coach" }] }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const isDemo = id === "demo";

  const {
    data,
    isLoading,
    isError,
  } = useQuery<Report>({
    queryKey: ["report", id],
    queryFn: () => api<Report>(`/report/${id}`),
    enabled: !isDemo,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading report...
      </div>
    );
  }

  if (isError && !isDemo) {
    return (
      <Card className="card-flat p-8 text-center">
        <h2 className="text-xl font-semibold">Report not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This interview report doesn't exist or couldn't be loaded.
        </p>
      </Card>
    );
  }

  const report = isDemo ? demoReport() : data!;

  const downloadUrl = isDemo
    ? null
    : `${API_BASE_URL}/report/${id}/pdf?token=${encodeURIComponent(getToken() ?? "")}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{report.date}</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{report.role}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Detailed interview report</p>
        </div>
        {downloadUrl ? (
          <Button asChild className="bg-primary text-primary-foreground border-0">
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </Button>
        ) : (
          <Button disabled className="bg-primary text-primary-foreground border-0 opacity-60">
            <Download className="h-4 w-4" /> PDF (demo)
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard label="Overall" value={report.overall_score} />
        <ScoreCard label="Technical" value={report.technical_score} />
        <ScoreCard label="Communication" value={report.communication_score} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard title="Strengths" icon={Award} tone="primary" items={report.strengths ?? []} />
        <ListCard title="Weaknesses" icon={AlertCircle} tone="destructive" items={report.weaknesses ?? []} />
        <ListCard title="Skill gap analysis" icon={TrendingUp} tone="accent" items={report.skill_gaps ?? []} />
        <ListCard title="Topics to improve" icon={BookOpen} tone="primary" items={report.topics_to_improve ?? []} />
      </div>

      <Card className="card-flat p-6">
        <h3 className="font-semibold">Recommended learning roadmap</h3>
        <ol className="mt-4 space-y-4">
          {(report.roadmap ?? []).map((r, i) => (
            <li key={i} className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-sm font-semibold text-primary-foreground shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-medium">{r.step}</div>
                <div className="text-sm text-muted-foreground mt-1">{r.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="card-flat p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-4xl font-semibold font-mono-nums text-primary">{value}%</div>
      <Progress value={value} className="mt-4 h-1.5" />
    </Card>
  );
}

function ListCard({ title, icon: Icon, tone, items }: { title: string; icon: any; tone: "primary" | "destructive" | "accent"; items: string[] }) {
  const color = tone === "destructive" ? "text-destructive" : tone === "accent" ? "text-chart-4" : "text-primary";
  return (
    <Card className="card-flat p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={color}>•</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function demoReport(): Report {
  return {
    id: 0,
    role: "Senior Python Developer",
    date: "Today",
    overall_score: 78,
    technical_score: 82,
    communication_score: 74,
    strengths: [
      "Clear articulation of async/await mechanics",
      "Strong grasp of database indexing tradeoffs",
      "Concise STAR-format storytelling",
    ],
    weaknesses: [
      "System design lacked capacity planning",
      "Missed edge cases in the coding question",
      "Some answers could be more concise",
    ],
    skill_gaps: ["Kubernetes operators", "Distributed tracing", "gRPC streaming"],
    topics_to_improve: ["System design fundamentals", "Advanced SQL", "Concurrency patterns"],
    roadmap: [
      { step: "Study distributed systems", detail: "Work through Designing Data-Intensive Applications, chapters 5–9." },
      { step: "Practice system design", detail: "Complete 5 mock designs on caching, sharding, and message queues." },
      { step: "Deepen K8s knowledge", detail: "Build a small operator using kubebuilder to internalize CRDs." },
      { step: "Communication drills", detail: "Record answers, cut fillers, aim for 90-second STAR stories." },
    ],
  };
}