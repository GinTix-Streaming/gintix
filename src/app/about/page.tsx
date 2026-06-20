import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "About — GinTix" };

export default function AboutPage() {
  return (
    <PageShell
      title="About GinTix"
      subtitle="The creator-first home for live streaming."
    >
      <p>
        GinTix exists for one reason: creators should keep what they earn. The
        platforms that came before us built billion-dollar businesses by taking a
        cut of every subscription and every dollar of fan support. We flipped the
        model.
      </p>

      <Section heading="Our mission">
        <p>
          Give every creator an instant, premium streaming home — a channel, a
          secure stream key, and a live audience in one click — while keeping
          100% of their subs and fan funding in their pocket.
        </p>
      </Section>

      <Section heading="How we make money instead">
        <p>
          We monetize the platform, not your community: dynamic programmatic ads
          for free viewers, an optional ad-free viewer pass, a small live-commerce
          checkout fee, and a $29/month multi-stream distribution add-on. Your
          subs and tips are always yours.
        </p>
      </Section>

      <Section heading="Built different">
        <p>
          One-click go-live, multi-stream to Twitch, YouTube, TikTok and Kick at
          once, and in-player shopping baked into every channel. GinTix is the
          stack a modern creator actually needs — without the platform tax.
        </p>
      </Section>
    </PageShell>
  );
}
