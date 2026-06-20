import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "Terms of Service — GinTix" };

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      subtitle="Last updated: June 2026"
    >
      <p>
        These Terms govern your use of GinTix. By creating an account or watching
        a stream, you agree to them. This is a demo product; these terms are a
        plain-language summary, not legal advice.
      </p>

      <Section heading="1. Your account">
        <p>
          You're responsible for activity on your account and for keeping your
          credentials and stream key secure. You must be old enough to use GinTix
          in your jurisdiction.
        </p>
      </Section>

      <Section heading="2. Content & conduct">
        <p>
          You retain ownership of content you broadcast. You grant GinTix a license
          to host, transcode, and distribute it so we can run the service. You must
          follow our Safety guidelines.
        </p>
      </Section>

      <Section heading="3. Payments">
        <p>
          Creators keep 100% of subscriptions and fan funding. GinTix monetizes via
          ads, the Premium Pass, live-commerce rail fees, and the multi-stream
          add-on. Paid plans renew until cancelled.
        </p>
      </Section>

      <Section heading="4. Termination">
        <p>
          You can delete your account anytime. We may suspend accounts that violate
          these Terms or the Safety guidelines.
        </p>
      </Section>

      <Section heading="5. Disclaimer">
        <p>
          GinTix is provided "as is" without warranties. To the extent permitted by
          law, we aren't liable for indirect or consequential damages.
        </p>
      </Section>
    </PageShell>
  );
}
