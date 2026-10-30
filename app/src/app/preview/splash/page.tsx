"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Pause, Play, RotateCcw } from "lucide-react";
import Splash, { SPLASH_MS } from "@/components/Splash";

const SPEEDS = [1, 0.5, 0.25] as const;
const GAP_MS = 900; // pause on the "app" screen between loops

/** Design preview: plays the launch splash on a loop, with replay and slow motion. */
export default function SplashPreview() {
  const [run, setRun] = useState(0);
  const [showing, setShowing] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [looping, setLooping] = useState(true);
  const stage = useRef<HTMLDivElement>(null);

  // Slow motion: scale every CSS animation inside the splash.
  useEffect(() => {
    if (!showing) return;
    stage.current?.getAnimations({ subtree: true }).forEach((a) => (a.playbackRate = speed));
  }, [run, showing, speed]);

  useEffect(() => {
    if (!showing) return;
    const t = setTimeout(() => setShowing(false), SPLASH_MS / speed);
    return () => clearTimeout(t);
  }, [run, showing, speed]);

  useEffect(() => {
    if (showing || !looping) return;
    const t = setTimeout(() => replay(), GAP_MS);
    return () => clearTimeout(t);
  }, [showing, looping]);

  const replay = () => {
    setRun((r) => r + 1);
    setShowing(true);
  };

  return (
    <main className="relative min-h-[100dvh] bg-band text-white grid place-items-center">
      <p className="text-white/50 text-[14px]">App loads here</p>

      <div ref={stage}>{showing && <Splash key={run} />}</div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app z-[200] px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex items-center gap-2 rounded-2xl bg-black/75 backdrop-blur p-2 text-white text-[13px]">
          <button onClick={replay} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/15 font-semibold">
            <RotateCcw size={15} /> Replay
          </button>
          <button
            onClick={() => setLooping((l) => !l)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/15 font-semibold"
            aria-pressed={looping}
          >
            {looping ? <Pause size={15} /> : <Play size={15} />} Loop
          </button>
          <div className="ml-auto flex rounded-xl bg-white/10 p-0.5" role="radiogroup" aria-label="Speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={speed === s}
                onClick={() => {
                  setSpeed(s);
                  replay();
                }}
                className={clsx("h-8 px-2.5 rounded-lg font-semibold", speed === s ? "bg-white text-black" : "text-white/70")}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
