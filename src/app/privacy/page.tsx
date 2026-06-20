import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "Privacy Policy — GinTix" };

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: June 2026">
      <p>
        This summary explains what GinTix collects and why. GinTix is a demo
        product; this is a plain-language overview, not legal advice.
      </p>

      <Section heading="What we collect">
        <p>
          Account info (email, username, optional avatar), content you broadcast,
          and basic usage data needed to run the service. Authentication is handled
          by Supabase; payments by Stripe.
        </p>
      </Section>

      <Section heading="How we use it">
        <p>
          To operate your channel, deliver streams, process payments, show relevant
          ads to free viewers, and keep the platform safe. We do not sell your
          personal data.
        </p>
      </Section>

      <Section heading="Your controls">
        <p>
          You can edit your profile, manage your channel, and delete your account at
          any time. Deleting your account removes your profile, stream config, and
          listings.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about privacy? Email{" "}
          <span className="text-amethyst-soft">privacy@gintix.com</span>.
        </p>
      </Section>
    </PageShell>
  );
}
