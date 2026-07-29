export function Logomark({ className }: { className?: string }) {
  return (
    <div
      className={
        "h-8 w-8 rounded-md bg-primary grid place-items-center shrink-0 " + (className ?? "")
      }
    >
      <div className="level-meter h-3.5">
        <span className="level-meter-bar h-[40%]" style={{ background: "var(--primary-foreground)", opacity: 0.9 }} />
        <span className="level-meter-bar h-full" style={{ background: "var(--primary-foreground)" }} />
        <span className="level-meter-bar h-[65%]" style={{ background: "var(--primary-foreground)", opacity: 0.9 }} />
      </div>
    </div>
  );
}
