"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewSpecialShops, type LineMatch } from "@/actions/specialRateActions";
import { applyDistributorRate, removeDistributor, type DistributorShop } from "@/actions/cnfActions";
import { Card } from "@/components/ui/Card";

interface Row {
  line: string;
  status: LineMatch["status"];
  options: LineMatch["matches"];
  picked: string | null;
}

export function DistributorsManager({ current }: { current: DistributorShop[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [percent, setPercent] = useState("10");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pct = Number(percent);
  const pctValid = Number.isFinite(pct) && pct > 0 && pct <= 100;

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
      const res = await applyDistributorRate(chosen, pct);
      if (!res.ok) {
        setMessage(res.error ?? "Could not save.");
        return;
      }
      setMessage(`${res.updated} store${res.updated === 1 ? "" : "s"} can now order on cnf.jpkop.in at purchase rate + ${pct}%.`);
      setRows(null);
      setText("");
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await removeDistributor(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Give distributors access to cnf.jpkop.in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste one distributor per line: the party name, party code or phone number. They sign in with their normal J P Traders
          Login Id and password, and pay the purchase rate plus the percentage you choose, never more than the normal rate.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"SHREE SAI DISTRIBUTORS\n4543\n9876543210"}
          className="mt-3 w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700" htmlFor="dist-percent">
            Purchase rate +
          </label>
          <input
            id="dist-percent"
            inputMode="decimal"
            value={percent}
            onChange={(e) => setPercent(e.target.value.replace(/[^\d.]/g, ""))}
            className="min-h-11 w-20 rounded-lg border-2 border-slate-300 px-3 text-base"
          />
          <span className="text-sm font-semibold text-slate-700">%</span>
          <button
            type="button"
            onClick={preview}
            disabled={pending || text.trim() === "" || !pctValid}
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
                <th className="py-2 pr-3">Store</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.line} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 text-slate-700">{r.line}</td>
                  <td className="py-2 pr-3">
                    {r.status === "none" && <span className="font-semibold text-red-600">No store found</span>}
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
                        <option value="">Several stores match: pick one</option>
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
            disabled={pending || chosen.length === 0 || !pctValid}
            className="mt-4 min-h-12 w-full rounded-xl bg-green-700 px-6 text-base font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : `Make ${chosen.length} store${chosen.length === 1 ? "" : "s"} distributors at purchase rate + ${pct}%`}
          </button>
        </Card>
      )}

      {message && <p className="text-sm font-semibold text-green-700">{message}</p>}

      <Card className="overflow-x-auto">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Distributors ({current.length})</h2>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Store</th>
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
                    Remove access
                  </button>
                </td>
              </tr>
            ))}
            {current.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  No distributors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
