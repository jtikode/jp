"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface GeolocationCaptureProps {
  onCapture: (lat: number, lng: number) => void;
}

export function GeolocationCapture({ onCapture }: GeolocationCaptureProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCapture() {
    setStatus("loading");
    setError(null);

    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setStatus("done");
        onCapture(lat, lng);
      },
      (err) => {
        setStatus("error");
        setError(err.message || "Could not fetch your location.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={status === "done" ? "secondary" : "primary"}
        onClick={handleCapture}
        disabled={status === "loading"}
      >
        {status === "done"
          ? "GPS Verified ✓"
          : status === "loading"
            ? "Fetching location..."
            : "Verify GPS Location"}
      </Button>
      {coords && (
        <p className="text-sm text-slate-500">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </p>
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
