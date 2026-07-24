"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/Button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  name?: string;
}

export function CameraCapture({ onCapture, name = "photo" }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setCompressing(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const namedFile = new File([compressed], file.name, { type: compressed.type });

      // Replace the input's file list with the compressed version so the
      // enclosing form submits the compressed bytes, not the original capture.
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(namedFile);
      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files;
      }

      setPreviewUrl(URL.createObjectURL(namedFile));
      onCapture(namedFile);
    } catch {
      setError("Could not process that photo. Please try again.");
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={previewUrl ? "secondary" : "primary"}
        onClick={() => inputRef.current?.click()}
        disabled={compressing}
      >
        {compressing ? "Processing photo..." : previewUrl ? "Retake Photo" : "Take Photo"}
      </Button>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Visit proof" className="h-40 w-full rounded-xl object-cover" />
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
