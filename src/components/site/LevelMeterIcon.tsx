/**
 * Small inline version of the level-meter motif, without the boxed
 * background used by <Logomark />. Used anywhere a generic icon
 * (like a sparkle) would otherwise sit next to a label — keeps the
 * "listening / measuring" motif consistent instead of falling back
 * to a stock icon.
 */
export function LevelMeterIcon({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <span className={"level-meter h-3.5 " + (className ?? "")}>
      <span
        className={"level-meter-bar h-[40%] bg-primary" + (animate ? " animate-meter" : "")}
        style={animate ? { animationDelay: "0ms" } : undefined}
      />
      <span
        className={"level-meter-bar h-full bg-primary" + (animate ? " animate-meter" : "")}
        style={animate ? { animationDelay: "150ms" } : undefined}
      />
      <span
        className={"level-meter-bar h-[65%] bg-primary" + (animate ? " animate-meter" : "")}
        style={animate ? { animationDelay: "300ms" } : undefined}
      />
    </span>
  );
}
