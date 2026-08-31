"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { clsx } from "@/lib/clsx";

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function pick(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 text-left text-sm"
      >
        <span className={clsx("truncate", !value && "text-slate-500")}>{value || placeholder}</span>
        <span className="flex shrink-0 items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                pick("");
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className="text-slate-400" />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-lg">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full border-b border-slate-200 px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => pick("")}
              className="block w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
            >
              {allLabel}
            </button>
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className={clsx(
                  "block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50",
                  o === value ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700",
                )}
              >
                {o}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
