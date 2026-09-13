import type { Metadata } from "next";
import { Baloo_2, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { buildWhatsAppLink } from "@/lib/waLink";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["500", "700", "800"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "How to Order — J P Traders",
  description: "A step-by-step guide for retailers to install the JP Traders shop app and place their first order.",
};

export default function HowToOrderPage() {
  return (
    <main className={`${baloo.variable} ${workSans.variable} ${plexMono.variable} guide-page`}>
      <style>{`
        .guide-page{
          --paper:#ffffff;
          --paper-alt:#e6edfa;
          --ink:#12213d;
          --ink-soft:#4c5b78;
          --ink-faint:#7c88a3;
          --primary:#1d4ed8;
          --primary-deep:#1638a8;
          --primary-tint:#dce6fc;
          --red:#dc2626;
          --teal:#0d8f80;
          --teal-deep:#0a6e62;
          --teal-tint:#dcf3ef;
          --border:#d7e1f4;
          --line:#c7d5f0;
          --shadow:0 18px 40px -22px rgba(18,33,61,0.28);
          display:flex;
          justify-content:center;
          padding:28px 16px 48px;
          font-family:var(--font-work-sans),system-ui,-apple-system,"Segoe UI",sans-serif;
          color:var(--ink);
        }
        .guide-page *{box-sizing:border-box;}
        .guide-page h1,.guide-page h2,.guide-page h3{text-wrap:balance; margin:0;}
        .guide-poster{width:100%; max-width:640px; display:flex; flex-direction:column;}

        .g-header{background:var(--paper); border:1px solid var(--border); border-bottom:none; border-radius:22px 22px 0 0; padding:28px 30px 24px; box-shadow:var(--shadow);}
        .g-rule{height:4px; border-radius:4px; margin:0 0 18px; background:linear-gradient(to right, var(--red), var(--primary));}
        .g-header h1{font-family:var(--font-baloo),system-ui,sans-serif; font-weight:700; font-size:clamp(24px,5vw,30px); line-height:1.15;}
        .g-header p{margin:10px 0 0; color:var(--ink-soft); font-size:15px; line-height:1.55; max-width:46ch;}
        .g-link-chip{margin-top:18px; display:inline-flex; align-items:center; gap:8px; background:var(--primary-tint); color:var(--primary-deep); font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:14px; font-weight:500; padding:9px 14px; border-radius:999px;}

        .g-steps{background:var(--paper); border-left:1px solid var(--border); border-right:1px solid var(--border); padding:6px 30px 10px;}
        .g-step{display:grid; grid-template-columns:40px 1fr; column-gap:18px; position:relative; padding:22px 0;}
        .g-step:not(:last-child)::after{content:""; position:absolute; left:19px; top:56px; bottom:-6px; width:2px; background:var(--line);}
        .g-step-num{width:40px; height:40px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-family:var(--font-baloo),system-ui,sans-serif; font-weight:700; font-size:17px; font-variant-numeric:tabular-nums; z-index:1;}
        .g-step-icon{position:absolute; left:56px; top:22px; width:22px; height:22px; color:var(--primary);}
        .g-step-body h3{font-family:var(--font-baloo),system-ui,sans-serif; font-weight:700; font-size:17px; padding-left:30px;}
        .g-step-body p{margin:6px 0 0; font-size:14.5px; line-height:1.6; color:var(--ink-soft);}
        .g-chip{display:inline-flex; align-items:center; gap:6px; background:var(--paper-alt); border:1px solid var(--border); color:var(--ink); font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:12.5px; font-weight:500; padding:4px 10px; border-radius:8px;}
        .g-chip.solid{background:var(--primary); color:#fff; border-color:var(--primary); border-radius:999px; font-weight:600;}

        .g-mock-search{margin-top:10px; border:1px solid var(--border); background:var(--paper-alt); border-radius:12px; padding:10px 12px;}
        .g-mock-search .g-bar{display:flex; align-items:center; gap:8px; background:var(--paper); border:1px solid var(--border); border-radius:999px; padding:7px 12px; font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:12.5px; color:var(--ink-faint);}
        .g-mock-search .g-bar svg{width:14px; height:14px; flex-shrink:0; color:var(--ink-faint);}
        .g-mock-filters{display:flex; gap:6px; margin-top:8px;}
        .g-mock-filters span{font-size:11.5px; font-family:var(--font-plex-mono),ui-monospace,monospace; color:var(--ink-soft); background:var(--paper); border:1px solid var(--border); border-radius:999px; padding:3px 9px;}

        .g-tip{background:var(--teal-tint); border:1px solid var(--border); padding:26px 30px 28px;}
        .g-tip-label{display:inline-flex; align-items:center; gap:7px; font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:11.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--teal-deep);}
        .g-tip-label svg{width:14px; height:14px;}
        .g-tip h2{font-family:var(--font-baloo),system-ui,sans-serif; font-weight:700; font-size:20px; margin-top:8px;}
        .g-tip p{margin:9px 0 0; font-size:14.5px; line-height:1.65; color:var(--ink-soft); max-width:52ch;}
        .g-tip p strong{color:var(--ink); font-weight:600;}

        .g-compare{margin-top:18px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px;}
        .g-compare .g-card{background:var(--paper); border:1px solid var(--border); border-radius:14px; padding:12px 14px;}
        .g-compare .g-card .g-eyebrow{font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:11px; color:var(--ink-faint); text-transform:uppercase; letter-spacing:0.06em;}
        .g-compare .g-card .g-query{font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:14px; font-weight:600; margin-top:4px;}
        .g-compare .g-card .g-results{margin-top:9px; display:flex; flex-direction:column; gap:5px;}
        .g-compare .g-card .g-results .g-row{display:flex; justify-content:space-between; font-size:12.5px; color:var(--ink-soft);}
        .g-compare .g-card .g-results .g-row span:last-child{font-variant-numeric:tabular-nums; color:var(--ink); font-weight:600;}
        .g-compare .g-arrow{color:var(--teal); flex-shrink:0;}
        .g-compare .g-card.win{border-color:var(--teal);}
        .g-compare .g-card.win .g-results .g-row.best span:last-child{color:var(--teal-deep);}

        .g-footer{background:var(--primary); border-radius:0 0 22px 22px; border:1px solid var(--primary-deep); padding:24px 30px 26px; color:#fff; text-align:center;}
        .g-footer .g-brand{font-family:var(--font-baloo),system-ui,sans-serif; font-weight:800; font-size:18px; letter-spacing:0.02em;}
        .g-footer .g-brand span{opacity:0.75;}
        .g-footer p{margin:10px 0 0; font-size:13.5px; color:rgba(255,255,255,0.86); line-height:1.6;}
        .g-footer a{color:#fff; text-decoration:underline;}
        .g-footer .g-url{margin-top:14px; display:inline-block; font-family:var(--font-plex-mono),ui-monospace,monospace; font-size:15px; font-weight:600; background:rgba(255,255,255,0.14); padding:9px 18px; border-radius:999px;}

        @media (max-width:420px){
          .g-header,.g-steps,.g-tip,.g-footer{padding-left:20px; padding-right:20px;}
          .g-step{grid-template-columns:34px 1fr; column-gap:14px;}
          .g-step-num{width:34px; height:34px; font-size:15px;}
          .g-step-icon{left:44px;}
          .g-compare{grid-template-columns:1fr;}
          .g-compare .g-arrow{transform:rotate(90deg); justify-self:center;}
        }
      `}</style>

      <div className="guide-poster">
        <div className="g-header">
          <div className="g-rule" />
          <h1>Start ordering from your phone</h1>
          <p>Five steps to get the JP Traders shop app running on your phone and place your first order — no Play Store, no paperwork.</p>
          <div className="g-link-chip">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            app.jpkop.in
          </div>
        </div>

        <div className="g-steps">
          <div className="g-step">
            <div className="g-step-num">1</div>
            <svg className="g-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 18h.01" /></svg>
            <div className="g-step-body">
              <h3>Open the link</h3>
              <p>On your phone, open Chrome and type in <strong>app.jpkop.in</strong>. It opens straight to sign-in — nothing to search for on the Play Store.</p>
            </div>
          </div>

          <div className="g-step">
            <div className="g-step-num">2</div>
            <svg className="g-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <div className="g-step-body">
              <h3>Install the app</h3>
              <p>Tap the <span className="g-chip solid">⬇ Install</span> button at the top of the screen, then confirm. The app icon lands on your home screen like any other app.</p>
              <p style={{ marginTop: 8 }}>Sign in with the 4-digit <strong>Login Id</strong> and <strong>Password</strong> your distributor gave you.</p>
            </div>
          </div>

          <div className="g-step">
            <div className="g-step-num">3</div>
            <svg className="g-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <div className="g-step-body">
              <h3>Allow notifications</h3>
              <p>When the app asks, tap <span className="g-chip solid">🔔 Enable order updates</span>. You&apos;ll get a push alert the moment an order is confirmed, dispatched, or a new offer goes live — no need to keep checking.</p>
            </div>
          </div>

          <div className="g-step">
            <div className="g-step-num">4</div>
            <svg className="g-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <div className="g-step-body">
              <h3>Search &amp; add to cart</h3>
              <p>Type a product name, or narrow it down with the Company and Salt filters. Tap the <strong>+</strong> on any item to add it — change the quantity any time before checkout.</p>
              <div className="g-mock-search">
                <div className="g-bar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  Search products...
                </div>
                <div className="g-mock-filters">
                  <span>Company ▾</span>
                  <span>Salt ▾</span>
                </div>
              </div>
            </div>
          </div>

          <div className="g-step">
            <div className="g-step-num">5</div>
            <svg className="g-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            <div className="g-step-body">
              <h3>Place your order</h3>
              <p>Open your cart, add a note if you need to, and tap <span className="g-chip solid">Place Order</span>. Your distributor sees it instantly — done in under two minutes.</p>
            </div>
          </div>
        </div>

        <div className="g-tip">
          <span className="g-tip-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Worth knowing
          </span>
          <h2>Search the salt, not just the brand</h2>
          <p>Type the <strong>composition</strong> instead of one brand name — every product with that salt shows up at once, so you can compare rates and never lose a sale just because one brand is out of stock.</p>

          <div className="g-compare">
            <div className="g-card">
              <div className="g-eyebrow">Searching a brand</div>
              <div className="g-query">&quot;Crocin&quot;</div>
              <div className="g-results">
                <div className="g-row"><span>Crocin 500</span><span>—</span></div>
              </div>
            </div>
            <svg className="g-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            <div className="g-card win">
              <div className="g-eyebrow">Searching the salt</div>
              <div className="g-query">&quot;Paracetamol&quot;</div>
              <div className="g-results">
                <div className="g-row best"><span>Para 500 Alkem</span><span>₹4.00</span></div>
                <div className="g-row"><span>Paracetamol Oval</span><span>₹4.60</span></div>
                <div className="g-row"><span>Paracetamol Round</span><span>₹5.10</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="g-footer">
          <span className="g-brand">J P <span>TRADERS</span></span>
          <p>
            Questions? Message us on{" "}
            <a href={buildWhatsAppLink("919422046470", "Hi, I need help setting up the JP Traders shop app.")} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>{" "}
            and we&apos;ll walk you through it.
          </p>
          <span className="g-url">app.jpkop.in</span>
        </div>
      </div>
    </main>
  );
}
