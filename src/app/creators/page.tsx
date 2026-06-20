import Link from "next/link";
import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "For Creators — GinTix" };

const PERKS = [
  ["Keep 100%", "No platform cut on subscriptions or fan funding — ever."],
  ["Go live in one click", "Your channel and a secure RTMP stream key are generated instantly."],
  ["Multi-stream everywhere", "Push to Twitch, YouTube, TikTok and Kick simultaneously."],
  ["Sell in-player", "Drop products into your stream's shop and check out without leaving the page."],
  ["Ad-free for fans", "Offer supporters a premium ad-free pass — you keep the relationship."],
  ["Own your audience", "Your channel, your URL: gintix.vercel.app/yourname."],
];

export default function CreatorsPage() {
  return (
    <PageShell
      title="Built for creators"
      subtitle="Everything you need to go live, grow, and get paid — minus the platform tax."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERKS.map(([t, d]) => (
          <div key={t} className="panel p-5">
            <h3 className="font-bold text-ink">{t}</h3>
            <p className="mt-1 text-sm text-ink-muted">{d}</p>
          </div>
        ))}
      </div>

      <Section heading="Ready to start?">
        <p>
          Create your free account and your channel is live in under a minute.
        </p>
        <Link href="/login?mode=signup" className="btn-amethyst mt-1 inline-flex">
          Start your channel
        </Link>
      </Section>
    </PageShell>
  );
}
