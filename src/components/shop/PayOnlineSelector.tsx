"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { reportPayment } from "@/actions/paymentActions";
import { buildUpiLink, invoiceNote } from "@/lib/upi";
import { t, type Lang } from "@/lib/i18n";

export interface PayableInvoice {
  id: string;
  invoiceNo: string | null;
  // Formatted on the server — a client-side toLocaleDateString would use the
  // viewer's timezone and could disagree with the server-rendered HTML.
  dateLabel: string | null;
  amount: number;
  outstanding: number;
}

const QR_OPTIONS = { width: 280, margin: 1 } as const;

export function PayOnlineSelector({
  vpa,
  payeeName,
  invoices,
  initialQrDataUrl,
  lang,
}: {
  vpa: string;
  payeeName: string;
  invoices: PayableInvoice[];
  initialQrDataUrl: string;
  lang: Lang;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(invoices.map((i) => i.id)));

  const selectedInvoices = useMemo(() => invoices.filter((i) => selected.has(i.id)), [invoices, selected]);
  const total = useMemo(
    () => Math.round(selectedInvoices.reduce((sum, i) => sum + i.outstanding, 0) * 100) / 100,
    [selectedInvoices],
  );
  // Part payment: the retailer can type a smaller amount than the selected
  // bills add up to. Empty means "pay it all"; anything above the selected
  // total is rejected rather than quietly capped.
  const [customAmount, setCustomAmount] = useState<string | null>(null);
  const typedAmount = Number(customAmount);
  const hasCustom = customAmount !== null && customAmount.trim() !== "" && Number.isFinite(typedAmount) && typedAmount > 0;
  const overLimit = hasCustom && typedAmount > total + 0.001;
  const payAmount = hasCustom && !overLimit ? Math.round(typedAmount * 100) / 100 : total;
  const balanceAfter = Math.round((total - payAmount) * 100) / 100;
  const upiLink = useMemo(
    () =>
      buildUpiLink({
        vpa,
        payeeName,
        amount: payAmount,
        note: invoiceNote(selectedInvoices.map((i) => i.invoiceNo)),
      }),
    [vpa, payeeName, payAmount, selectedInvoices],
  );

  // Seeded with the server-rendered QR for the default (everything selected)
  // state so there's no blank flash on first paint.
  const [qr, setQr] = useState({ link: upiLink, url: initialQrDataUrl });

  useEffect(() => {
    if (upiLink === qr.link) return;
    let cancelled = false;
    QRCode.toDataURL(upiLink, QR_OPTIONS).then((url) => {
      if (!cancelled) setQr({ link: upiLink, url });
    });
    return () => {
      cancelled = true;
    };
  }, [upiLink, qr.link]);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportAmount, setReportAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [submitting, startSubmit] = useTransition();

  function openReport() {
    setReportAmount(payAmount > 0 ? String(payAmount) : "");
    setReportError(null);
    setReportOpen(true);
  }

  function submitReport() {
    setReportError(null);
    startSubmit(async () => {
      const result = await reportPayment(
        Number(reportAmount),
        selectedInvoices.map((i) => i.invoiceNo).filter((n): n is string => !!n),
        utr,
      );
      if (!result.ok) {
        setReportError(result.error ?? "Could not save.");
        return;
      }
      setReported(true);
      setReportOpen(false);
    });
  }

  function toggle(id: string) {
    setCustomAmount(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = selected.size === invoices.length;
  // Never show a QR whose amount doesn't match the current selection — a
  // stale image for the split second while the new one renders could be
  // scanned and paid at the wrong amount.
  const qrIsFresh = qr.link === upiLink;

  return (
    <>
      {invoices.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">{t(lang, "shop_select_bills_to_pay")}</h2>
            <button
              type="button"
              onClick={() => {
                setCustomAmount(null);
                setSelected(allSelected ? new Set() : new Set(invoices.map((i) => i.id)));
              }}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              {allSelected ? t(lang, "shop_clear_selection") : t(lang, "shop_select_all")}
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            {invoices.map((inv) => {
              const checked = selected.has(inv.id);
              const partiallyPaid = inv.outstanding < inv.amount;
              return (
                <li key={inv.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${
                      checked ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(inv.id)}
                      className="h-5 w-5 shrink-0 accent-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {t(lang, "shop_invoice_no")} {inv.invoiceNo ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">{inv.dateLabel ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">₹{inv.outstanding.toLocaleString("en-IN")}</p>
                      {partiallyPaid && (
                        <p className="text-xs text-slate-400">
                          {t(lang, "shop_bill_amount")} ₹{inv.amount.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card className="flex flex-col items-center gap-4 text-center">
        {total > 0 && (
          <div className="w-full">
            <p className="text-sm text-slate-500">{t(lang, "shop_amount_to_pay")}</p>
            <div className="mx-auto mt-1 flex max-w-xs items-center gap-2 rounded-xl border-2 border-slate-300 px-3 focus-within:border-blue-600">
              <span className="text-2xl font-bold text-slate-900">₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                aria-label={t(lang, "shop_part_payment_label")}
                value={customAmount ?? String(total)}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="min-h-14 w-full bg-transparent text-3xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{t(lang, "shop_part_payment_label")}</p>
            {overLimit && (
              <p className="mt-1 text-sm font-medium text-red-600">
                {t(lang, "shop_part_payment_over")} ₹{total.toLocaleString("en-IN")}
              </p>
            )}
            {!overLimit && balanceAfter > 0 && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                {t(lang, "shop_part_payment_balance")}: ₹{balanceAfter.toLocaleString("en-IN")}
              </p>
            )}
            {customAmount !== null && (
              <button
                type="button"
                onClick={() => setCustomAmount(null)}
                className="mt-1 text-sm font-semibold text-blue-700 hover:underline"
              >
                {t(lang, "shop_pay_full_amount")}
              </button>
            )}
          </div>
        )}
        {qrIsFresh ? (
          <Image src={qr.url} alt="UPI QR code" width={220} height={220} unoptimized />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-slate-100" />
        )}
        <p className="text-sm text-slate-500">{payeeName}</p>
        <p className="text-sm text-slate-600">
          {t(lang, "shop_upi_id")}: <span className="font-semibold text-slate-900">{vpa}</span>
        </p>
        <a
          href={upiLink}
          className="w-full rounded-lg bg-blue-700 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
        >
          {t(lang, "shop_pay_now")}
          {payAmount > 0 ? `: ₹${payAmount.toLocaleString("en-IN")}` : ""}
        </a>
      </Card>

      <Card>
        {reported ? (
          <p className="text-center text-sm font-medium text-green-700">{t(lang, "shop_payment_reported")}</p>
        ) : reportOpen ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t(lang, "shop_amount_paid")}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={reportAmount}
                onChange={(e) => setReportAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t(lang, "shop_utr_optional")}</label>
              <Input value={utr} onChange={(e) => setUtr(e.target.value)} maxLength={40} />
            </div>
            {reportError && <p className="text-sm font-medium text-red-600">{reportError}</p>}
            <button
              type="button"
              onClick={submitReport}
              disabled={submitting || !(Number(reportAmount) > 0)}
              className="w-full rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t(lang, "shop_sending") : t(lang, "shop_submit_payment")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-slate-500">{t(lang, "shop_payment_report_hint")}</p>
            <button
              type="button"
              onClick={openReport}
              className="w-full rounded-lg border-2 border-green-700 px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              {t(lang, "shop_i_have_paid")}
            </button>
          </div>
        )}
      </Card>
    </>
  );
}
