import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FileText,
  Target,
  TrendingUp,
  Play,
} from "lucide-react";
import { LevelMeterIcon } from "../components/site/LevelMeterIcon";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  total_interviews: number;
  avg_score: number;
  technical_trend: { date: string; score: number }[];
  communication_trend: { date: string; score: number }[];
  recent: { id: number; role: string; score: number; date: string }[];
  resume_match: number;
  suggestions: string[];
}

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Interview Coach" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/dashboard"),
    retry: false,
  });

  const stats = data ?? fallback();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LevelMeterIcon animate /> Your interview studio
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Track progress, review sessions, and start your next mock interview.
          </p>
        </div>
        <Button asChild size="lg" className="bg-primary text-primary-foreground border-0">
          <Link to="/interview/setup">
            <Play className="h-4 w-4" /> Start new interview
          </Link>
        </Button>
      </div>

      {isError && (
        <Card className="card-flat p-4 text-sm text-muted-foreground">
          Backend not reachable — showing sample data. Configure <code className="text-primary">VITE_API_BASE_URL</code> and run the FastAPI backend to see real stats.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={BarChart3} label="Total interviews" value={stats.total_interviews.toString()} />
        <StatCard icon={TrendingUp} label="Average score" value={`${stats.avg_score.toFixed(0)}%`} />
        <StatCard icon={Target} label="Resume match" value={`${stats.resume_match}%`} />
        <StatCard icon={FileText} label="Suggestions" value={stats.suggestions.length.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCard title="Technical score" data={stats.technical_trend} color="var(--color-chart-1)" />
        <TrendCard title="Communication score" data={stats.communication_trend} color="var(--color-chart-2)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-flat p-6 lg:col-span-2">
          <h3 className="font-semibold">Recent interviews</h3>
          <div className="mt-4 divide-y divide-border">
            {stats.recent.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No interviews yet — start one!</p>
            )}
            {stats.recent.map((r) => (
              <Link
                key={r.id}
                to="/report/$id"
                params={{ id: String(r.id) }}
                className="flex items-center justify-between py-3 hover:bg-accent rounded-lg px-3 -mx-3 transition"
              >
                <div>
                  <div className="font-medium text-sm">{r.role}</div>
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
                <Badge className="bg-primary text-primary-foreground border-0 font-mono-nums">{r.score}%</Badge>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="card-flat p-6">
          <h3 className="font-semibold">Skill suggestions</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {stats.suggestions.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-primary">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="card-flat p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Resume match to target role</h3>
            <p className="text-xs text-muted-foreground">Compared against your saved job description.</p>
          </div>
          <span className="text-2xl font-semibold font-mono-nums text-primary">{stats.resume_match}%</span>
        </div>
        <Progress value={stats.resume_match} className="h-2" />
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="card-flat p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold font-mono-nums">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

function TrendCard({ title, data, color }: { title: string; data: { date: string; score: number }[]; color: string }) {
  return (
    <Card className="card-flat p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-popover-foreground)",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
            />
            <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function fallback(): DashboardData {
  return {
    total_interviews: 12,
    avg_score: 78,
    resume_match: 74,
    technical_trend: [
      { date: "W1", score: 55 },
      { date: "W2", score: 62 },
      { date: "W3", score: 68 },
      { date: "W4", score: 74 },
      { date: "W5", score: 79 },
      { date: "W6", score: 82 },
    ],
    communication_trend: [
      { date: "W1", score: 60 },
      { date: "W2", score: 65 },
      { date: "W3", score: 70 },
      { date: "W4", score: 72 },
      { date: "W5", score: 78 },
      { date: "W6", score: 84 },
    ],
    recent: [
      { id: 1, role: "Senior Python Developer", score: 82, date: "2 days ago" },
      { id: 2, role: "ML Engineer", score: 76, date: "5 days ago" },
      { id: 3, role: "Full Stack Developer", score: 71, date: "1 week ago" },
    ],
    suggestions: [
      "Practice system design at scale (sharding, caching layers).",
      "Deepen understanding of transformer attention mechanics.",
      "Improve STAR-format storytelling for behavioral answers.",
      "Study Kubernetes operators and CRDs.",
    ],
  };
}