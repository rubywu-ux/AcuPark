"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type Webcam from "react-webcam";
import { Camera, ImageIcon, X } from "lucide-react";
import { IconButton, Spinner } from "@/components/ui";

const WebcamView = dynamic(() => import("@/components/WebcamWrapper"), { ssr: false });

export const SCAN_IMAGE_KEY = "acupark:scan";
const SAMPLE_PHOTO = "/lots/scan-car.jpg";

/** Full-screen plate scanner. Falls back to a sample photo when no camera is available (desktop, HTTP on mobile). */
export default function Scanner({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const camRef = useRef<Webcam>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<"aim" | "analyzing">("aim");
  const [still, setStill] = useState<string | null>(null);

  const finish = useCallback(
    (img: string) => {
      setStill(img);
      try {
        sessionStorage.setItem(SCAN_IMAGE_KEY, img);
      } catch {
        sessionStorage.removeItem(SCAN_IMAGE_KEY);
      }
      setPhase("analyzing");
      setTimeout(onDone, 1600);
    },
    [onDone]
  );

  const capture = () => {
    const shot = camRef.current?.getScreenshot();
    finish(shot ?? SAMPLE_PHOTO);
  };

  return (
    <div className="fixed inset-0 z-[80] mx-auto max-w-app bg-black text-white flex flex-col">
      <div className="absolute inset-0">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt="Captured vehicle" className="w-full h-full object-cover" />
        ) : error ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SAMPLE_PHOTO} alt="" className="w-full h-full object-cover opacity-40" />
        ) : (
          <WebcamView
            audio={false}
            webcamRef={camRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.7}
            videoConstraints={{ facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }}
            onUserMedia={() => setReady(true)}
            onUserMediaError={() => setError(true)}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      <div className="relative flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
        <IconButton label="Close scanner" onClick={onClose} className="bg-white/15 backdrop-blur">
          <X size={22} />
        </IconButton>
        <span className="text-[15px] font-semibold">AI Quick Scan</span>
        <span className="w-11" />
      </div>

      {/* Plate guide */}
      <div className="relative flex-1 grid place-items-center">
        <div className="relative w-[78%] aspect-[2/1] rounded-3xl">
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
            <span key={c} className={`absolute w-10 h-10 border-accent ${c}`} />
          ))}
          {phase === "analyzing" && (
            <span className="absolute left-3 right-3 h-[3px] rounded-full bg-accent shadow-[0_0_16px_4px_rgba(255,199,0,0.6)] animate-scan-line" />
          )}
        </div>
      </div>

      <div className="relative px-6 pb-[max(env(safe-area-inset-bottom),28px)] flex flex-col items-center gap-5">
        {phase === "analyzing" ? (
          <div className="flex items-center gap-3 h-[76px] text-[17px] font-semibold">
            <Spinner /> Reading plate & location…
          </div>
        ) : error ? (
          <>
            <p className="text-white/80 text-[15px] text-center">Camera isn&apos;t available here. Use a sample photo to try the flow.</p>
            <button
              onClick={() => finish(SAMPLE_PHOTO)}
              className="h-14 px-6 rounded-2xl bg-accent text-accent-ink font-semibold flex items-center gap-2"
            >
              <ImageIcon size={20} /> Use sample photo
            </button>
          </>
        ) : (
          <>
            <p className="text-white/80 text-[15px]">Line up your license plate inside the frame</p>
            <button
              aria-label="Capture"
              disabled={!ready}
              onClick={capture}
              className="w-[76px] h-[76px] rounded-full border-4 border-white grid place-items-center disabled:opacity-40 active:scale-95 transition"
            >
              <span className="w-[60px] h-[60px] rounded-full bg-white grid place-items-center text-black">
                <Camera size={26} />
              </span>
            </button>
            <button onClick={() => finish(SAMPLE_PHOTO)} className="text-white/70 text-[14px] underline underline-offset-4">
              Use sample photo instead
            </button>
          </>
        )}
      </div>
    </div>
  );
}
