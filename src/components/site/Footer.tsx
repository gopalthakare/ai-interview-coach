import { Logomark } from "./Logomark";

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Logomark />
            <span className="font-semibold">AI Interview Coach</span>
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
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} AI Interview Coach. All rights reserved.</span>
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
