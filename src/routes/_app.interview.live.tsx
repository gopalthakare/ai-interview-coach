import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Camera,
  StopCircle,
  ArrowRight,
  Timer,
  Eye,
  EyeOff,
  Smartphone,
  UserX,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { useProctoring, type ProctoringViolationType } from "../hooks/use-proctoring";

interface Question {
  id: number;
  text: string;
  index: number;
  total: number;
  difficulty: string;
}

export const Route = createFileRoute("/_app/interview/live")({
  head: () => ({ meta: [{ title: "Live Interview — PrepPundit" }] }),
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    // Initial question
    if (isDemo) {
      setQuestion({
        id: 0,
        text: DEMO_QUESTIONS[0],
        index: 0,
        total,
        difficulty: search.difficulty,
      });
    } else {
      api<Question>("/interview/question", { body: { interview_id: Number(search.id) } })
        .then(setQuestion)
        .catch(() => {
          setQuestion({
            id: 0,
            text: DEMO_QUESTIONS[0],
            index: 0,
            total,
            difficulty: search.difficulty,
          });
        });
    }
    // Camera preview
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraReady(true);
          }
        })
        .catch(() => {
          toast.error("Couldn't access your camera — check browser permissions.");
        });
    }
  }, [isDemo, search.id, search.difficulty]);

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !endingRef.current) {
      endInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const proctoring = useProctoring(videoRef.current, cameraReady && !endingRef.current);
  const lastViolationCountRef = useRef(0);

  useEffect(() => {
    const newOnes = proctoring.violations.slice(lastViolationCountRef.current);
    lastViolationCountRef.current = proctoring.violations.length;
    const tabSwitch = newOnes.find((v) => v.type === "tab_switched");
    if (tabSwitch) {
      toast.warning("You switched away from the interview tab. This has been logged.");
    }
  }, [proctoring.violations]);

  const answerMut = useMutation({
    mutationFn: (payload: { interview_id: number; question_id: number; answer: string }) =>
      api<Question>("/interview/answer", { body: payload }),
  });

  const endMut = useMutation({
    mutationFn: (payload: { interview_id: number }) =>
      api<{ report_id: number }>("/interview/end", { body: payload }),
  });

  async function toggleMic() {
    if (micOn) {
      recogRef.current?.stop();
      setMicOn(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser — try Chrome or Edge.");
      return;
    }
    if (!window.isSecureContext) {
      toast.error("Voice input needs a secure connection (HTTPS or localhost).");
      return;
    }

    // Request mic permission explicitly first. SpeechRecognition can request
    // its own permission, but doing it this way surfaces a clear error if
    // it's blocked instead of the recognizer just silently ending.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      toast.error("Microphone access is blocked — allow it in your browser's site settings.");
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
    recog.onerror = (e: { error?: string }) => {
      setMicOn(false);
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied.",
        "no-speech": "No speech detected — mic stopped listening.",
        "audio-capture": "No microphone was found.",
        network: "Voice recognition lost its network connection.",
      };
      if (e?.error && e.error !== "aborted") {
        toast.error(messages[e.error] ?? `Voice input stopped (${e.error}).`);
      }
    };
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
      setQuestion({
        id: nextIdx,
        text: DEMO_QUESTIONS[nextIdx],
        index: nextIdx,
        total,
        difficulty: search.difficulty,
      });
    } else {
      try {
        const q = await answerMut.mutateAsync({
          interview_id: Number(search.id),
          question_id: question.id,
          answer,
        });
        setQuestion(q);
      } catch {
        setQuestion({
          id: nextIdx,
          text: DEMO_QUESTIONS[nextIdx],
          index: nextIdx,
          total,
          difficulty: search.difficulty,
        });
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
          <Badge variant="outline" className="border-primary/40 text-primary capitalize">
            {search.type}
          </Badge>
          <span className="ml-2 text-sm text-muted-foreground">
            Question {index + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2 card-flat px-3 py-1.5 rounded-lg border border-border">
          <Timer className="h-4 w-4 text-primary" />
          <span className="tabular-nums font-mono">
            {mm}:{ss}
          </span>
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="card-flat p-8 min-h-40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Interviewer
            </div>
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
              <Button
                variant="outline"
                onClick={endInterview}
                disabled={endingRef.current || endMut.isPending}
              >
                <StopCircle className="h-4 w-4" /> End interview
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={
                  !answer.trim() || answerMut.isPending || endMut.isPending || endingRef.current
                }
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
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <ProctoringPanel proctoring={proctoring} />
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

const VIOLATION_META: Record<ProctoringViolationType, { label: string; icon: typeof Eye }> = {
  no_face: { label: "No face detected", icon: UserX },
  multiple_faces: { label: "Multiple faces detected", icon: UserX },
  looking_away: { label: "Looked away", icon: EyeOff },
  phone_detected: { label: "Phone detected", icon: Smartphone },
  tab_switched: { label: "Switched tabs", icon: ExternalLink },
};

function ProctoringPanel({ proctoring }: { proctoring: ReturnType<typeof useProctoring> }) {
  if (!proctoring.supported) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Activity detection isn't available in this browser — voice and text answers still work fine.
      </p>
    );
  }

  if (proctoring.loading || !proctoring.ready) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading activity detection…
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className={
            proctoring.faceDetected
              ? "border-emerald-500/40 text-emerald-500"
              : "border-destructive/40 text-destructive"
          }
        >
          {proctoring.faceDetected ? <Eye className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
          {proctoring.faceDetected ? "Face detected" : "No face"}
        </Badge>
        {proctoring.lookingAway && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500">
            <EyeOff className="h-3 w-3" /> Looking away
          </Badge>
        )}
        {proctoring.phoneDetected && (
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            <Smartphone className="h-3 w-3" /> Phone detected
          </Badge>
        )}
        {proctoring.tabSwitchCount > 0 && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500">
            <ExternalLink className="h-3 w-3" /> Tab switches: {proctoring.tabSwitchCount}
          </Badge>
        )}
        {proctoring.faceDetected &&
          !proctoring.lookingAway &&
          !proctoring.phoneDetected &&
          proctoring.tabSwitchCount === 0 && (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
              <ShieldCheck className="h-3 w-3" /> All clear
            </Badge>
          )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Runs on-device — your video is never uploaded or sent to a server.
      </p>
      {proctoring.violations.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto text-xs border-t border-border pt-2">
          {proctoring.violations
            .slice()
            .reverse()
            .map((v, i) => {
              const meta = VIOLATION_META[v.type];
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{meta.label}</span>
                  <span className="ml-auto tabular-nums">
                    {new Date(v.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
