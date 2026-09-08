import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — J P Traders",
  description: "Privacy Policy for the J P Traders Retailer app and portal.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 9, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 sm:text-base">
        <section>
          <p>
            This Privacy Policy explains how J P Traders (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
            collects, uses, and protects information when you use the J P Traders Retailer
            app and web portal (the &quot;Service&quot;), used by retail medical stores to place
            orders, view outstanding bills, and receive updates from us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Information We Collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-slate-900">Store &amp; business details</span> — store
              name, owner name, phone number, address, and registration details you provide (such as
              GST, PAN, or drug licence numbers) when you register or activate your account.
            </li>
            <li>
              <span className="font-medium text-slate-900">Order &amp; transaction history</span> — the
              products you order, quantities, order status, and outstanding bill/ledger records
              associated with your store.
            </li>
            <li>
              <span className="font-medium text-slate-900">Device &amp; notification data</span> — a
              push-notification token for your device so we can send you order updates and
              announcements, and basic device/app information needed to deliver notifications.
            </li>
            <li>
              <span className="font-medium text-slate-900">Communication details</span> — your WhatsApp
              or phone number if you choose to contact us for support.
            </li>
            <li>
              <span className="font-medium text-slate-900">Usage data</span> — general app/website usage
              analytics (such as pages visited and features used) collected through Google Analytics,
              to help us understand and improve the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>To process and fulfil your orders, and to maintain accurate outstanding-bill records.</li>
            <li>To send you order confirmations, delivery updates, offers, and scheduled announcements via push notification.</li>
            <li>To provide one-tap reorder and personalised recommendations based on your own past orders.</li>
            <li>To respond to product requests and support queries you submit.</li>
            <li>To understand how the Service is used, so we can improve it and fix issues.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data Sharing</h2>
          <p className="mt-2">
            We do not sell your information, and we do not share it with third parties for their own
            marketing purposes. Your data is only shared with service providers that help us operate the
            Service — such as our hosting/database provider and Google Analytics for usage
            statistics — solely to the extent needed to provide the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data Retention &amp; Security</h2>
          <p className="mt-2">
            We retain your store, order, and ledger records for as long as your account is active and
            as needed to maintain accurate business and billing records. We use reasonable technical
            and organisational measures — including encrypted storage and access controls — to protect
            your information from unauthorised access, loss, or misuse.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your Choices</h2>
          <p className="mt-2">
            You can disable push notifications at any time from your device settings. To request access
            to, correction of, or deletion of your data, please contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Children&apos;s Privacy</h2>
          <p className="mt-2">
            The Service is intended for use by retail businesses and their authorised staff, and is not
            directed at children. We do not knowingly collect information from children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page
            with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact Us</h2>
          <p className="mt-2">
            If you have any questions about this Privacy Policy or your data, please contact us:
          </p>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-900">J P Traders</p>
            <p>JP Heights, CS 2189/1, 2189/2, Ram Galli, Mangalwar Peth, Kolhapur 416012</p>
            <p>Phone: +91 94220 46470 / +91 77218 81599</p>
            <p>Email: jptraderskop@gmail.com</p>
            <p>Website: jptraders.net</p>
          </div>
        </section>
      </div>
    </main>
  );
}
