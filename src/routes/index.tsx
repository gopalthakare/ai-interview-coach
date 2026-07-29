import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Mic,
  Camera,
  FileText,
  Target,
  BarChart3,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Navbar } from "../components/site/Navbar";
import { Footer } from "../components/site/Footer";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-28">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <div>
          <Badge variant="outline" className="mb-6 border-border gap-2 py-1.5">
            <span className="level-meter h-3">
              <span className="level-meter-bar h-[40%] animate-meter" style={{ animationDelay: "0ms" }} />
              <span className="level-meter-bar h-full animate-meter" style={{ animationDelay: "150ms" }} />
              <span className="level-meter-bar h-[65%] animate-meter" style={{ animationDelay: "300ms" }} />
            </span>
            Now with voice interviews
          </Badge>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
            Ace your next interview
            <br />
            with an <span className="text-primary">AI coach</span> that actually listens.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Upload your resume, drop in a job description, and run a full mock interview.
            Adaptive questions, honest feedback, and a personalized roadmap — in minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/register">
                Start free interview <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="mt-12 flex items-center gap-8">
            <MiniStat label="Interviews run" value="128,420" />
            <MiniStat label="Avg. score gain" value="+34%" />
            <MiniStat label="Roles supported" value="80+" />
          </div>
        </div>

        {/* Signature element: a live "readout" panel — the same report
            format candidates see after a session, standing in for the
            product's real artifact instead of an abstract graphic. */}
        <div className="card-flat rounded-xl p-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
            <span>Live report</span>
            <span className="flex items-center gap-1.5">
              <span className="level-meter h-2.5">
                <span className="level-meter-bar h-[40%] animate-meter" />
                <span className="level-meter-bar h-full animate-meter" style={{ animationDelay: "150ms" }} />
                <span className="level-meter-bar h-[65%] animate-meter" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-rec-dot" />
              Recording
            </span>
          </div>
          <div className="mt-5 font-semibold">Senior Python Developer</div>
          <div className="text-xs text-muted-foreground">Detailed interview report</div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <ReadoutStat label="Overall" value="78" />
            <ReadoutStat label="Technical" value="82" />
            <ReadoutStat label="Comms" value="74" />
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <ReadoutLine label="Async/await mechanics" ok />
            <ReadoutLine label="Database indexing tradeoffs" ok />
            <ReadoutLine label="System design — capacity planning" ok={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold font-mono-nums text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function ReadoutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <div className="text-lg font-semibold font-mono-nums">{value}%</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ReadoutLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <CheckCircle2 className={"h-3.5 w-3.5 shrink-0 " + (ok ? "text-success" : "text-muted-foreground/50")} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function Logos() {
  const roles = [
    "Backend Engineering",
    "Data Science",
    "ML / AI",
    "Product Management",
    "DevOps & Infra",
    "Fintech",
  ];
  return (
    <section className="py-12 border-y border-border">
      <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-sm">
        <span className="text-xs text-muted-foreground uppercase tracking-widest mr-2">
          Interview loops practiced for
        </span>
        {roles.map((r, i) => (
          <span
            key={r}
            className="rounded-full border border-border px-3 py-1 text-muted-foreground animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {r}
          </span>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: FileText, title: "Resume parsing", desc: "Extract skills, experience, projects, and certifications from your PDF." },
  { icon: Target, title: "Resume ↔ JD match", desc: "See match %, missing skills, and what to study next." },
  { icon: Brain, title: "Adaptive questions", desc: "Difficulty adjusts live based on your answers, like a real interviewer." },
  { icon: Mic, title: "Voice interviews", desc: "Speak your answers. Speech-to-text and text-to-speech built in." },
  { icon: Camera, title: "Behavior analytics", desc: "Head pose, presence, and engagement — not cheating detection." },
  { icon: BarChart3, title: "Detailed reports", desc: "Technical & communication scores, strengths, gaps, and a roadmap." },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border mb-4">Everything you need</Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            A full interview <span className="text-primary">studio</span>, not a chatbot
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every session is grounded in your resume and the specific role you're targeting.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className="card-flat p-6 group hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-11 w-11 rounded-xl bg-primary grid place-items-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Upload your resume", desc: "PDF in, structured profile out — skills, projects, and experience." },
  { n: "02", title: "Pick a role or paste a JD", desc: "Choose from 80+ presets or paste any job description." },
  { n: "03", title: "Run the interview", desc: "Adaptive questions, voice or text. Timer, transcript, and camera preview." },
  { n: "04", title: "Get your report", desc: "Scores, missing concepts, strengths, and a learning roadmap." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-24 border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border mb-4">How it works</Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            From resume to <span className="text-primary">offer-ready</span> in four steps
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-4 relative">
          <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-border" />
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="relative animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative z-10 h-12 w-12 rounded-full bg-card border-2 border-primary grid place-items-center font-mono-nums font-semibold text-primary">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Priya S.", role: "Data Scientist, Series B startup", quote: "The adaptive follow-ups felt eerily like my real onsite. I walked in knowing exactly where I was weak." },
  { name: "Marcus O.", role: "Backend Engineer, fintech", quote: "The resume-to-JD match saved me. It pointed out three missing skills that came up in the actual interview." },
  { name: "Aisha K.", role: "ML Engineer, cloud infrastructure", quote: "The final report reads like a mentor's notes. Concrete, kind, and actually useful." },
];

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border mb-4">Loved by candidates</Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Real prep. <span className="text-primary">Real outcomes.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card
              key={t.name}
              className="card-flat p-6 hover:-translate-y-1 transition-transform duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-1 mb-4 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary grid place-items-center text-sm font-semibold text-primary-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    tag: "Try it out",
    features: ["3 interviews / month", "Resume parsing", "Basic reports", "Text mode"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    tag: "Most popular",
    features: ["Unlimited interviews", "Voice + video mode", "Adaptive difficulty", "Full reports + PDF", "Roadmap generation"],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Teams",
    price: "$49",
    tag: "For bootcamps",
    features: ["Everything in Pro", "Cohort analytics", "Custom rubrics", "Priority support"],
    cta: "Contact sales",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border mb-4">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Simple pricing. <span className="text-primary">Serious prep.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Card
              key={t.name}
              className={
                "relative p-8 border transition-all duration-300 hover:-translate-y-1 animate-fade-up " +
                (t.highlighted
                  ? "card-flat border-primary/40 shadow-lg shadow-primary/10"
                  : "card-flat")
              }
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {t.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                  {t.tag}
                </Badge>
              )}
              <div className="text-sm text-muted-foreground">{t.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight font-mono-nums">{t.price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={
                  "w-full mt-8 " +
                  (t.highlighted
                    ? "bg-primary text-primary-foreground border-0"
                    : "")
                }
                variant={t.highlighted ? "default" : "outline"}
              >
                <Link to="/register">{t.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Does the AI actually listen to my voice?", a: "Yes — speech-to-text runs in the browser and answers are transcribed and evaluated in real time." },
  { q: "How is the difficulty adaptive?", a: "The engine tracks your rolling score and adjusts subsequent questions up or down, and can ask follow-ups if an answer is shallow." },
  { q: "Is my resume data private?", a: "Your resume is stored on your account only. You can delete it any time." },
  { q: "Does this detect cheating?", a: "No. We provide behavior analytics — presence, head pose, and engagement — for your own awareness. It is not cheating detection." },
  { q: "Which roles do you support?", a: "80+ presets across engineering, ML, data, product, and design. You can also paste any custom JD." },
];

function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-border mb-4">FAQ</Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Questions, <span className="text-primary">answered</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((item, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-border">
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="card-flat rounded-2xl p-12 text-center">
          <div className="level-meter h-5 justify-center mx-auto mb-6">
            <span className="level-meter-bar h-[40%] animate-meter" />
            <span className="level-meter-bar h-full animate-meter" style={{ animationDelay: "150ms" }} />
            <span className="level-meter-bar h-[65%] animate-meter" style={{ animationDelay: "300ms" }} />
            <span className="level-meter-bar h-[85%] animate-meter" style={{ animationDelay: "450ms" }} />
            <span className="level-meter-bar h-[50%] animate-meter" style={{ animationDelay: "600ms" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Your next offer starts with <span className="text-primary">one interview</span>.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Try it free. No credit card. Cancel anytime.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/register">
                Start your first interview <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
