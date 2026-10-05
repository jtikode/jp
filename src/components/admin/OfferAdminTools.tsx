"use client";

import { useState } from "react";
import { sendOfferAlert, updateBannerExpiry } from "@/actions/bannerActions";
import { ExpiryField } from "@/components/admin/ExpiryField";

type Message = { ok: boolean; text: string } | null;

function MessageLine({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <span className={message.ok ? "text-sm font-medium text-green-700" : "text-sm font-medium text-red-600"}>
      {message.text}
    </span>
  );
}

const BUTTON = "rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60";

// Per-offer controls on the admin Banners page: the end date, and the alert
// (push + a ready-to-paste WhatsApp message).
export function OfferAdminTools({
  bannerId,
  endsAtLabel,
  canAlert,
  shareText,
}: {
  bannerId: string;
  // Pre-formatted on the server (fixed IST) so it can't mismatch on hydration.
  endsAtLabel: string | null;
  canAlert: boolean;
  shareText: string;
}) {
  const [iso, setIso] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [expiryMessage, setExpiryMessage] = useState<Message>(null);
  const [alertMessage, setAlertMessage] = useState<Message>(null);
  const [copied, setCopied] = useState(false);

  async function saveExpiry(value: string | null) {
    setBusy("expiry");
    setExpiryMessage(null);
    try {
      const result = await updateBannerExpiry(bannerId, value);
      setExpiryMessage(
        result.ok
          ? { ok: true, text: value ? "End time saved." : "End date removed." }
          : { ok: false, text: result.error ?? "Could not save." },
      );
    } catch {
      setExpiryMessage({ ok: false, text: "Could not save. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function sendAlert() {
    if (!window.confirm("Send a push notification about this offer to every retailer who has notifications on?")) return;
    setBusy("alert");
    setAlertMessage(null);
    try {
      const result = await sendOfferAlert(bannerId);
      setAlertMessage(
        result.ok
          ? { ok: true, text: `Sent to ${result.storeCount ?? 0} retailer(s) (${result.sentCount ?? 0} device(s)).` }
          : { ok: false, text: result.error ?? "Could not send." },
      );
    } catch {
      setAlertMessage({ ok: false, text: "Could not send. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setAlertMessage({ ok: false, text: "Could not copy. Select the text below and copy it by hand." });
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-4 border-t border-slate-100 pt-3">
      <div>
        <p className="mb-1 text-sm font-semibold text-slate-700">
          Offer end time:{" "}
          <span className="font-medium text-slate-900">{endsAtLabel ?? "No end date (shows until you hide it)"}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64">
            <ExpiryField onIsoChange={setIso} />
          </div>
          <button
            type="button"
            disabled={!iso || busy !== null}
            onClick={() => saveExpiry(iso)}
            className={`${BUTTON} bg-blue-700 text-white hover:bg-blue-800`}
          >
            Set end time
          </button>
          {endsAtLabel && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => saveExpiry(null)}
              className={`${BUTTON} border-2 border-slate-300 text-slate-700 hover:bg-slate-50`}
            >
              Remove end date
            </button>
          )}
          <MessageLine message={expiryMessage} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The offer disappears from the shop at this time. Retailers see &quot;Valid till&quot; on it, or a countdown in its
          last 2 days.
        </p>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-slate-700">Tell retailers about this offer</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canAlert || busy !== null}
            onClick={sendAlert}
            className={`${BUTTON} bg-blue-700 text-white hover:bg-blue-800`}
          >
            {busy === "alert" ? "Sending..." : "Send push alert"}
          </button>
          <button
            type="button"
            onClick={copyText}
            className={`${BUTTON} border-2 border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            {copied ? "Copied" : "Copy WhatsApp message"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BUTTON} border-2 border-green-600 text-green-700 hover:bg-green-50`}
          >
            Open in WhatsApp
          </a>
          <MessageLine message={alertMessage} />
        </div>
        {!canAlert && (
          <p className="mt-1 text-xs text-slate-500">The push alert is only available while the offer is showing.</p>
        )}
        <textarea
          readOnly
          value={shareText}
          rows={Math.min(10, shareText.split("\n").length + 1)}
          className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-slate-50 p-2 text-sm text-slate-700"
        />
      </div>
    </div>
  );
}
