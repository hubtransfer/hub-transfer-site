import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Waiting & Guarantee Policy | HUB Transfer",
  description:
    "90 minutes of waiting time included, counted from your flight's actual landing. Extended waiting, no-show, our commitment and cancellation terms.",
  alternates: { canonical: "/waiting-policy" },
};

const WA = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

/* Numbers in mono (data/conditions), preserving the verbatim text. */
function N({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\d+)/g).map((p, i) =>
        /^\d+$/.test(p) ? <span key={i} className="font-mono text-white">{p}</span> : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function WaitingPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
      <header className="border-b border-[var(--hub-line)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <a href="/" className="text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Back</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Waiting &amp; Guarantee Policy</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Included waiting time: <span className="font-mono">90</span> minutes</h2>
          <p><N>Every airport pickup includes 90 minutes of waiting time at no cost, counted from your flight's actual landing — not the scheduled time. Our system tracks your flight in real time: flight delays never consume your waiting time. For reference, the industry standard is 60 minutes.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Extended waiting</h2>
          <p><N>When the 90 minutes end, we don't cancel automatically: we contact you on WhatsApp. Waiting can be extended for €10 per started hour, counted from the end of the 90 minutes. A started hour is due in full because, during extended waiting, your driver remains exclusively dedicated to your pickup and accepts no other jobs. Confirmation and payment are arranged in that same conversation.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">No-show</h2>
          <p><N>If the 90 minutes end and we receive no reply within 15 minutes, the pickup is closed as a no-show and the trip amount is non-refundable.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Our commitment</h2>
          <p><N>We wait up to 90 minutes for you. And on days of major air disruptions — when delays force us to reorganise logistics —, we may ask the same of you: up to 20 minutes for your driver, always with advance notice and real-time tracking. It's reciprocity, and it's rare.</N></p>
          <p><N>What never happens is being left stranded: no pickup and no contact from us. If that failure ever occurs, your trip is fully refunded and alternative transport to your destination is on us.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Cancellation</h2>
          <p><N>Free cancellation up to 3 hours before pickup. Under 3 hours, the amount may be non-refundable.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p>Everything is resolved on our official WhatsApp: <a href={WA} target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--hub-gold)] hover:underline">{COMPANY.whatsappFormatted}</a>.</p>
        </section>
      </main>
    </div>
  );
}
