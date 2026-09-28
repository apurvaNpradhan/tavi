import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

type StatusPageProps = {
  code: string;
  description: string;
  testId: string;
};

const SCRAMBLE_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$?/\\";
const SCRAMBLE_DURATION_MS = 700;
const SCRAMBLE_TICK_MS = 45;

/**
 * Resolves the OS "reduce motion" preference at first render. jsdom does not
 * implement `matchMedia`, so both `window` and the function itself are
 * guarded; the test setup stubs it.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function ScrambleText({ text }: { text: string }) {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    // With reduced motion the initial state already shows the resolved text;
    // callers key the component by text so a change remounts it fresh.
    if (reduceMotion) return;

    const characters = text.split("");
    const startedAt = performance.now();
    let animationFrame = 0;
    let lastTick = 0;

    const animate = (now: number) => {
      if (now - lastTick >= SCRAMBLE_TICK_MS) {
        lastTick = now;
        const progress = Math.min((now - startedAt) / SCRAMBLE_DURATION_MS, 1);
        const settledCharacters = Math.floor(progress * characters.length);

        setDisplay(
          characters
            .map((character, index) =>
              index < settledCharacters || character === " "
                ? character
                : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)],
            )
            .join(""),
        );
      }

      if (now - startedAt < SCRAMBLE_DURATION_MS) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplay(text);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [reduceMotion, text]);

  return <span className="tabular-nums">{display}</span>;
}

export function StatusPage({ code, description, testId }: StatusPageProps) {
  const { t } = useTranslation("common");

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-16 text-foreground">
      <div
        className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
        data-testid={testId}
      >
        <p className="text-[7rem] leading-none font-bold tracking-[-0.08em] sm:text-[9rem]">
          <ScrambleText key={code} text={code} />
        </p>
        <p className="mt-8 max-w-sm text-base leading-7 text-muted-foreground">{description}</p>
        <Button className="mt-8 min-w-32" render={<Link to="/" />}>
          <Home aria-hidden="true" />
          {t("goHome")}
        </Button>
      </div>
    </main>
  );
}
