import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy · FPS Database",
  description: "How we handle your data at the FPS Game Database.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full px-6 py-16 sm:px-10 lg:px-16 xl:px-20">

      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted mb-4">
          <Shield size={14} /> Privacy
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-muted">Last updated: November 2026</p>
      </div>

      <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
          <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong>Account Data:</strong> Email address, username, and encrypted password.</li>
            <li><strong>Profile Data:</strong> Avatar images, banners, and display names you choose to upload.</li>
            <li><strong>Usage Data:</strong> Information on how the Service is accessed and used (e.g., page visit durations, match history).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Data</h2>
          <p>FPS Game Database uses the collected data for various purposes:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li>To provide and maintain the Service.</li>
            <li>To notify you about changes to our Service.</li>
            <li>To allow you to participate in interactive features (like Global Chat and DMs).</li>
            <li>To provide customer care and support.</li>
            <li>To monitor the usage of the Service and detect, prevent and address technical issues.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Security of Data</h2>
          <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Third-Party Services</h2>
          <p>We may employ third party companies and individuals to facilitate our Service (&quot;Service Providers&quot;), to provide the Service on our behalf, or to perform Service-related services. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top.</p>
        </section>
      </div>
    </div>
  );
}




