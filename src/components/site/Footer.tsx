import { Logomark } from "./Logomark";

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Logomark />
            <span className="font-semibold">PrepPundit</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Adaptive AI mock interviews with resume matching, scoring, and a personalized roadmap.
          </p>
        </div>
        <FooterCol title="Product" items={["Features", "Pricing", "Roadmap", "Changelog"]} />
        <FooterCol title="Company" items={["About", "Blog", "Careers", "Contact"]} />
        <FooterCol title="Legal" items={["Privacy", "Terms", "Security", "Cookies"]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>© {new Date().getFullYear()} PrepPundit. All rights reserved.</span>
          <span>
            Built by <span className="text-foreground font-medium">Gopal Thakare</span>
            {" · "}
            <a
              href="https://www.linkedin.com/in/gopalthakare14/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            {" · "}
            <a
              href="https://github.com/gopalthakare/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </span>
          <span className="font-mono-nums">v1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="hover:text-foreground transition-colors cursor-pointer">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
