"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";

// Date + time picker whose value is submitted as an ISO instant: the browser
// converts from the admin's local time, so the end time means the same moment
// no matter which timezone the server runs in. Empty = no end date.
export function ExpiryField({
  name,
  onIsoChange,
}: {
  name?: string;
  onIsoChange?: (iso: string) => void;
}) {
  const [iso, setIso] = useState("");

  return (
    <>
      <Input
        type="datetime-local"
        onChange={(e) => {
          const next = e.target.value ? new Date(e.target.value).toISOString() : "";
          setIso(next);
          onIsoChange?.(next);
        }}
      />
      {name && <input type="hidden" name={name} value={iso} />}
    </>
  );
}
