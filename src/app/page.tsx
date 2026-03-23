import { COMPANY } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="font-display text-6xl font-bold tracking-tight">
          <span className="text-gradient-gold">{COMPANY.name}</span>
        </h1>
        <p className="font-body text-xl text-hub-gray-400 tracking-wide uppercase">
          {COMPANY.slogan}
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <div className="h-px w-12 bg-hub-gold/30" />
          <span className="font-mono text-sm text-hub-gold/60">
            {COMPANY.location}
          </span>
          <div className="h-px w-12 bg-hub-gold/30" />
        </div>
      </div>
    </main>
  );
}
