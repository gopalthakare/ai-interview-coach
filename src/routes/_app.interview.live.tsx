import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, MicOff, Camera, StopCircle, ArrowRight, Timer } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";

interface Question {
  id: number;
  text: string;
  index: number;
  total: number;
  difficulty: string;
}

export const Route = createFileRoute("/_app/interview/live")({
  head: () => ({ meta: [{ title: "Live Interview — AI Interview Coach" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: (s.id as string) ?? "demo",
    type: (s.type as string) ?? "technical",
    difficulty: (s.difficulty as string) ?? "intermediate",
    duration: (s.duration as string) ?? "20",
  }),
  component: LivePage,
});

const DEMO_QUESTIONS: string[] = [
  "Walk me through your resume — what work are you most proud of and why?",
  "Explain the difference between a process and a thread. When would you pick one over the other?",
  "Design a URL shortener. How would you handle 10x traffic growth?",
  "Describe a time you disagreed with a teammate. How did you resolve it?",
  "How does gradient descent work, and what causes it to get stuck?",
];

function LivePage() {
  const search = useSearch({ from: "/_app/interview/live" });
  const navigate = useNavigate();
  const isDemo = search.id === "demo";

  const total = 5;
  const durationSec = Number(search.duration) * 60;
  const [remaining, setRemaining] = useState(durationSec);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<{ q: string; a: string }[]>([]);
  const [micOn, setMicOn] = useState(false);
  const recogRef = useRef<any>(null);
  const endingRef = useRef(false);

  useEffect(() => {
    // Initial question
    if (isDemo) {
      setQuestion({ id: 0, text: DEMO_QUESTIONS[0], index: 0, total, difficulty: search.difficulty });
    } else {
      api<Question>("/interview/question", { body: { interview_id: Number(search.id) } })
        .then(setQuestion)
        .catch(() => {
          setQuestion({ id: 0, text: DEMO_QUESTIONS[0], index: 0, total, difficulty: search.difficulty });
        });
    }
    // Camera preview
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          const v = document.getElementById("camera-preview") as HTMLVideoElement | null;
          if (v) v.srcObject = stream;
        })
        .catch(() => {});
    }
  }, [isDemo, search.id, search.difficulty]);

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !endingRef.current) {
    endInterview();}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const answerMut = useMutation({
    mutationFn: (payload: { interview_id: number; question_id: number; answer: string }) =>
      api<Question>("/interview/answer", { body: payload }),
  });

  const endMut = useMutation({
    mutationFn: (payload: { interview_id: number }) =>
      api<{ report_id: number }>("/interview/end", { body: payload }),
  });

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    if (micOn) {
      recogRef.current?.stop();
      setMicOn(false);
      return;
    }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    recog.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setAnswer(text);
    };
    recog.onerror = () => setMicOn(false);
    recog.onend = () => setMicOn(false);
    recog.start();
    recogRef.current = recog;
    setMicOn(true);
  }

  async function nextQuestion() {
    if (!question) return;
    setTranscript((t) => [...t, { q: question.text, a: answer }]);
    const nextIdx = index + 1;

    if (nextIdx >= total) {
      endInterview();
      return;
    }

    if (isDemo) {
      setQuestion({ id: nextIdx, text: DEMO_QUESTIONS[nextIdx], index: nextIdx, total, difficulty: search.difficulty });
    } else {
      try {
        const q = await answerMut.mutateAsync({
          interview_id: Number(search.id),
          question_id: question.id,
          answer,
        });
        setQuestion(q);
      } catch {
        setQuestion({ id: nextIdx, text: DEMO_QUESTIONS[nextIdx], index: nextIdx, total, difficulty: search.difficulty });
      }
    }
    setIndex(nextIdx);
    setAnswer("");
  }

async function endInterview() {
  if (endingRef.current) return;

  endingRef.current = true;

  recogRef.current?.stop?.();

  if (isDemo) {
    navigate({
      to: "/report/$id",
      params: { id: "demo" },
    });
    return;
  }

  try {
    const r = await endMut.mutateAsync({
      interview_id: Number(search.id),
    });

    navigate({
      to: "/report/$id",
      params: {
        id: String(r.report_id),
      },
    });
  } catch {
    navigate({
      to: "/report/$id",
      params: {
        id: "demo",
      },
    });
  }
}

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = useMemo(() => ((index + 1) / total) * 100, [index, total]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge variant="outline" className="border-primary/40 text-primary capitalize">{search.type}</Badge>
          <span className="ml-2 text-sm text-muted-foreground">
            Question {index + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2 card-flat px-3 py-1.5 rounded-lg border border-border">
          <Timer className="h-4 w-4 text-primary" />
          <span className="tabular-nums font-mono">{mm}:{ss}</span>
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="card-flat p-8 min-h-40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Interviewer</div>
            <p className="text-xl leading-relaxed">{question?.text ?? "Loading…"}</p>
          </Card>
          <Card className="card-flat p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Your answer</div>
              <Button
                size="sm"
                variant={micOn ? "default" : "outline"}
                onClick={toggleMic}
                className={micOn ? "bg-primary text-primary-foreground border-0" : ""}
              >
                {micOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {micOn ? "Stop mic" : "Use voice"}
              </Button>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer or use voice…"
              className="min-h-40 bg-muted border-border"
            />
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={endInterview} disabled={endingRef.current || endMut.isPending}>
                <StopCircle className="h-4 w-4" /> End interview
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!answer.trim() || answerMut.isPending || endMut.isPending || endingRef.current}
                className="bg-primary text-primary-foreground border-0"
              >
                {index + 1 >= total ? "Finish" : "Next question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="card-flat p-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Camera className="h-4 w-4 text-primary" /> Camera preview
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-black/40 border border-border grid place-items-center">
              <video id="camera-preview" autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Behavior analytics only — not cheating detection.
            </p>
          </Card>
          <Card className="card-flat p-4">
            <div className="text-sm font-medium mb-2">Transcript</div>
            <div className="space-y-3 max-h-96 overflow-y-auto text-xs">
              {transcript.length === 0 && (
                <p className="text-muted-foreground">Answers will appear here.</p>
              )}
              {transcript.map((t, i) => (
                <div key={i}>
                  <div className="text-primary">Q: {t.q}</div>
                  <div className="text-muted-foreground mt-1">A: {t.a || "—"}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}