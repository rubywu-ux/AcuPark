"use client";

import { useEffect, useState } from "react";
import DubsBark from "@/components/DubsBark";

const LOOP_MS = 4600; // spring in, bark, "Go Dawgs!", a beat, then again

/** Just the sticker, on the band purple, barking on a loop. The portfolio embeds this in an iframe. */
export default function DubsPreview() {
  const [run, setRun] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setRun((r) => r + 1), LOOP_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-[100dvh] bg-band text-white grid place-items-center overflow-hidden">
      <div key={run} className="dubs-stage" aria-hidden>
        <DubsBark size={240} />
        <span className="bark-lines">
          <span />
          <span />
          <span />
        </span>
        <span className="go-dawgs">Go Dawgs!</span>
      </div>
    </main>
  );
}
