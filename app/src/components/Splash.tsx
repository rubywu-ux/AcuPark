import DubsBark from "@/components/DubsBark";
import { LogoLockup } from "@/components/Logo";

/** How long the launch splash stays mounted (sit, bark, brand, fade-out). */
export const SPLASH_MS = 3400;

/**
 * Launch screen on deep UW purple: Dubs springs in, barks once (jaw, ears, tail and head all
 * move), a slanted "Go Dawgs!" pops out, and the AcuPark lockup rises in beneath him.
 * Timings live in globals.css (.splash-*, .db-*, .bark-lines, .go-dawgs).
 */
export default function Splash() {
  return (
    <div
      className="splash-root fixed inset-0 z-[100] mx-auto max-w-app grid place-items-center text-white"
      aria-label="AcuPark, a campus parking app"
      role="img"
    >
      <div className="flex flex-col items-center -mt-6">
        <div className="dubs-stage" aria-hidden>
          <DubsBark size={200} />
          <span className="bark-lines">
            <span />
            <span />
            <span />
          </span>
          <span className="go-dawgs">Go Dawgs!</span>
        </div>

        <LogoLockup className="splash-brand mt-9" tagline="A campus parking app" />
      </div>
    </div>
  );
}
