"use client";

import { useEffect, useRef, useState } from "react";

// Uses the browser's built-in BarcodeDetector (Chrome / Android, Safari 17+).
interface Detector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

export function canScanQr(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;
}

export function QrScanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
    const detector = new Ctor({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        stream = s;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = s;
        await v.play();
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(v);
            if (codes[0]?.rawValue) {
              onResult(codes[0].rawValue);
              return;
            }
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setError("Camera permission denied or unavailable."));
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="app-panel space-y-2 p-3">
      {error ? <p className="text-xs text-danger">{error}</p> : <video ref={videoRef} className="aspect-square w-full rounded bg-ink object-cover" muted playsInline />}
      <button type="button" className="control-button bg-card text-xs" onClick={onClose}>Close camera</button>
    </div>
  );
}
