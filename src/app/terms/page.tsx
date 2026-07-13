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
        <p>
          <strong className="text-ink">Live auctions.</strong> GinTix charges a 5%
          seller fee on the final hammer price of any lot that sells. Standard payment
          processing charges are billed separately, in addition to the 5% fee. The
          seller fee is calculated and recorded against the lot at the moment it
          settles, and is shown to the creator before and after the sale. Lots that end
          without meeting their reserve do not sell and incur no seller fee. Buyers pay
          only their winning bid — seller fees are never added on top of the bid.
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
