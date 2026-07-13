import { Orbit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import AnimatedContent from "@/components/animated-content";
import { RippleGrid } from "@/components/ripple-grid";
import TextType from "@/components/text-type";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-orbit-paper px-5 py-12 text-orbit-ink dark:bg-(--dark-background)">
      <div className="pointer-events-none absolute inset-0">
        <div className="size-full dark:hidden">
          <RippleGrid
            enableRainbow={false}
            gridColor="#17191D"
            rippleIntensity={0.01}
            gridSize={18}
            gridThickness={41}
            fadeDistance={1.2}
            vignetteStrength={5}
            glowIntensity={0}
            opacity={0.7}
            gridRotation={0}
            mouseInteraction={false}
            mouseInteractionRadius={1.4}
          />
        </div>
        <div className="hidden size-full dark:block">
          <RippleGrid
            enableRainbow={false}
            gridColor="#F3F0E9"
            rippleIntensity={0.01}
            gridSize={18}
            gridThickness={40}
            fadeDistance={2}
            vignetteStrength={5}
            glowIntensity={0}
            opacity={0.7}
            gridRotation={0}
            mouseInteraction={false}
            mouseInteractionRadius={1.4}
          />
        </div>
      </div>
      <AnimatedContent
        className="relative w-full max-w-md"
        distance={100}
        direction="vertical"
        reverse={false}
        duration={1.5}
        ease="power3.out"
        initialOpacity={0}
        animateOpacity
        scale={0.7}
        threshold={0.1}>
        <Card
          className="gap-0 rounded-(--radius) border-orbit-ink/20 bg-blue-gray-400 py-0 text-orbit-ink shadow-[0_24px_80px_rgb(23_25_29/18%)]"
          aria-labelledby="auth-title">
          <CardHeader className="px-7 pb-0 pt-7 sm:px-9 sm:pt-9">
            <div className="mb-6 flex items-center gap-3">
              <span
                className="grid size-11 place-items-center rounded-full border border-orbit-ink/20 bg-accent/85"
                aria-hidden="true">
                <HugeiconsIcon icon={Orbit02Icon} size={22} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-black tracking-tighter">Orbit</p>
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-orbit-ink/60">
                  {eyebrow}
                </p>
              </div>
            </div>
            <TextType
              id="auth-title"
              as="h1"
              text={title}
              loop={true}
              deletingSpeed={60}
              pauseDuration={2800}
              aria-label={title}
              className="text-3xl font-black text-orbit-ink tracking-[-0.065em]"
            />
          </CardHeader>
          <CardContent className="px-7 pb-7 pt-8 sm:px-9 sm:pb-9">
            {children}
          </CardContent>
        </Card>
      </AnimatedContent>
    </main>
  );
}
