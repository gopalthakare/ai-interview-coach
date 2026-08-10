import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, GraduationCap, Briefcase, FolderKanban, Award } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";

interface Resume {
  id: number;
  filename: string;
  skills: string[];
  education: { degree: string; institution: string; year?: string }[];
  experience: { role: string; company: string; duration: string; details?: string }[];
  projects: { name: string; description: string; tech?: string[] }[];
  certifications: string[];
  uploaded_at: string;
}

export const Route = createFileRoute("/_app/resume")({
  head: () => ({ meta: [{ title: "Resume — PrepPundit" }] }),
  component: ResumePage,
});

function ResumePage() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: resume } = useQuery<Resume | null>({
    queryKey: ["resume"],
    queryFn: () => api<Resume | null>("/resume"),
    retry: false,
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      return api<Resume>("/resume/upload", { formData: fd });
    },
    onSuccess: () => {
      toast.success("Resume parsed successfully");
      qc.invalidateQueries({ queryKey: ["resume"] });
      setFile(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF. We'll extract your skills, experience, and projects.
        </p>
      </div>

      <Card className="card-flat p-8">
        <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">
            {file ? file.name : "Drop your resume PDF here or click to browse"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">PDF up to 5 MB</div>
        </label>
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!file || upload.isPending}
            onClick={() => file && upload.mutate(file)}
            className="bg-primary text-primary-foreground border-0"
          >
            {upload.isPending ? "Parsing…" : "Upload & parse"}
          </Button>
        </div>
      </Card>

      {resume && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Skills" icon={FileText}>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((s) => (
                <Badge key={s} variant="outline" className="border-primary/30 text-primary">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
          <Section title="Education" icon={GraduationCap}>
            <ul className="space-y-3 text-sm">
              {resume.education.map((e, i) => (
                <li key={i}>
                  <div className="font-medium">{e.degree}</div>
                  <div className="text-muted-foreground text-xs">
                    {e.institution} {e.year ? `• ${e.year}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Experience" icon={Briefcase}>
            <ul className="space-y-4 text-sm">
              {resume.experience.map((x, i) => (
                <li key={i}>
                  <div className="font-medium">
                    {x.role} — {x.company}
                  </div>
                  <div className="text-xs text-muted-foreground">{x.duration}</div>
                  {x.details && <p className="mt-1 text-muted-foreground">{x.details}</p>}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Projects" icon={FolderKanban}>
            <ul className="space-y-4 text-sm">
              {resume.projects.map((p, i) => (
                <li key={i}>
                  <div className="font-medium">{p.name}</div>
                  <p className="text-muted-foreground text-xs">{p.description}</p>
                  {p.tech && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.tech.map((t) => (
                        <span key={t} className="text-[10px] uppercase text-primary">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Certifications" icon={Award}>
            <ul className="space-y-2 text-sm">
              {resume.certifications.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <Card className="card-flat p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </Card>
  );
}
