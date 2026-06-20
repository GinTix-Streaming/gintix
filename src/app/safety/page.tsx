import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "Safety — GinTix" };

export default function SafetyPage() {
  return (
    <PageShell
      title="Safety & community"
      subtitle="GinTix should feel premium and safe for everyone — viewers and creators alike."
    >
      <Section heading="Community guidelines">
        <p>
          We don't allow harassment, hate speech, threats, sexual content
          involving minors, or content that promotes violence or self-harm.
          Streams must comply with all applicable laws.
        </p>
      </Section>

      <Section heading="Creator responsibilities">
        <p>
          Creators are responsible for the content they broadcast, including any
          simulcast to third-party platforms. Products sold through the in-player
          shop must be real, legal, and accurately described.
        </p>
      </Section>

      <Section heading="Reporting">
        <p>
          See something that breaks the rules? Use the report option on any
          channel, or email{" "}
          <span className="text-amethyst-soft">safety@gintix.com</span>. Our team
          reviews reports and can issue warnings, suspensions, or permanent bans.
        </p>
      </Section>

      <Section heading="Account protection">
        <p>
          Keep your stream key secret and enable two-factor authentication on your
          email. GinTix will never ask for your password or stream key.
        </p>
      </Section>
    </PageShell>
  );
}
