import { Scale } from "lucide-react";

export const metadata = {
  title: "Terms of Service · FPS Database",
  description: "Rules and guidelines for using the FPS Game Database.",
};

export default function TermsPage() {
  return (
    <div className="w-full px-6 py-16 sm:px-10 lg:px-16 xl:px-20">

      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted mb-4">
          <Scale size={14} /> Legal
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-muted">Last updated: November 2026</p>
      </div>

      <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using the FPS Game Database, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. User Accounts</h2>
          <p>When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
          <p className="mt-3">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li>Harass, abuse, or harm another person.</li>
            <li>Post unauthorized or unsolicited advertising, spam, or junk mail.</li>
            <li>Impersonate or misrepresent your affiliation with a person or entity.</li>
            <li>Engage in any automated use of the system, such as using scripts to send comments or messages.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Content</h2>
          <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material (&quot;Content&quot;). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Termination</h2>
          <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Limitation of Liability</h2>
          <p>In no event shall FPS Game Database, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        </section>
      </div>
    </div>
  );
}




