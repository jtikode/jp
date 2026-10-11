"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  applySpecialRate,
  previewSpecialShops,
  removeSpecialRate,
  type LineMatch,
  type SpecialShop,
} from "@/actions/specialRateActions";
import { Card } from "@/components/ui/Card";

interface Row {
  line: string;
  status: LineMatch["status"];
  options: LineMatch["matches"];
  picked: string | null;
}

export function SpecialRatesManager({ current }: { current: SpecialShop[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [percent, setPercent] = useState(10);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function preview() {
    setMessage(null);
    start(async () => {
      const res = await previewSpecialShops(text);
      setRows(
        res.map((r) => ({
          line: r.line,
          status: r.status,
          options: r.matches,
          picked: r.status === "matched" ? r.matches[0].id : null,
        })),
      );
    });
  }

  const chosen = (rows ?? []).filter((r) => r.picked).map((r) => r.picked as string);

  function apply() {
    setMessage(null);
    start(async () => {
      const res = await applySpecialRate(chosen, percent);
      if (!res.ok) {
        setMessage(res.error ?? "Could not save.");
        return;
      }
      setMessage(`${res.updated} shop${res.updated === 1 ? "" : "s"} now on purchase rate + ${percent}%.`);
      setRows(null);
      setText("");
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await removeSpecialRate(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Add shops to a special rate</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste one shop per line: the party name, party code or phone number. These shops will pay the purchase rate
          plus the percentage you choose, but never more than the normal rate. Offer, deal and clearance prices do not change.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={"SHREE SAI MEDICAL\n4543\n9876543210"}
          className="mt-3 w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700" htmlFor="sr-percent">
            Rate for these shops
          </label>
          <select
            id="sr-percent"
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="min-h-11 rounded-lg border-2 border-slate-300 px-3 text-base"
          >
            <option value={10}>Purchase rate + 10%</option>
            <option value={15}>Purchase rate + 15%</option>
          </select>
          <button
            type="button"
            onClick={preview}
            disabled={pending || text.trim() === ""}
            className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending && rows === null ? "Checking..." : "Check the list"}
          </button>
        </div>
      </Card>

      {rows && (
        <Card className="overflow-x-auto">
          <h3 className="mb-2 text-base font-bold text-slate-900">
            Check the matches ({chosen.length} of {rows.length} ready)
          </h3>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">You pasted</th>
                <th className="py-2 pr-3">Shop</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.line} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 text-slate-700">{r.line}</td>
                  <td className="py-2 pr-3">
                    {r.status === "none" && <span className="font-semibold text-red-600">No shop found</span>}
                    {r.status === "matched" && (
                      <span className="text-slate-900">
                        {r.options[0].name}
                        <span className="block text-xs text-slate-500">
                          {[r.options[0].code, r.options[0].address].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    )}
                    {r.status === "ambiguous" && (
                      <select
                        value={r.picked ?? ""}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev ? prev.map((x, j) => (j === i ? { ...x, picked: e.target.value || null } : x)) : prev,
                          )
                        }
                        className="w-full rounded-lg border-2 border-amber-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">Several shops match: pick one</option>
                        {r.options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} · {[o.code, o.address].filter(Boolean).join(" · ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={apply}
            disabled={pending || chosen.length === 0}
            className="mt-4 min-h-12 w-full rounded-xl bg-green-700 px-6 text-base font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : `Put ${chosen.length} shop${chosen.length === 1 ? "" : "s"} on purchase rate + ${percent}%`}
          </button>
        </Card>
      )}

      {message && <p className="text-sm font-semibold text-green-700">{message}</p>}

      <Card className="overflow-x-auto">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Shops on a special rate ({current.length})</h2>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Shop</th>
              <th className="py-2 pr-3">Rate</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {current.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium text-slate-900">
                  {s.name}
                  <span className="block text-xs font-normal text-slate-500">{[s.code, s.address].filter(Boolean).join(" · ")}</span>
                </td>
                <td className="py-2 pr-3 text-slate-700">P.Rate + {s.percent}%</td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={pending}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Back to normal rate
                  </button>
                </td>
              </tr>
            ))}
            {current.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  No shops on a special rate yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
