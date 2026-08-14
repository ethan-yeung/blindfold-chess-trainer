import Link from 'next/link';
import StatsBoard from '../../components/StatsBoard';

export default function StatsPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <Link
                href="/"
                className="animate-rise inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                style={{ animationDelay: '0ms' }}
            >
                ← Back
            </Link>

            <h1
                className="animate-rise mt-6 font-display text-3xl text-parchment"
                style={{ animationDelay: '90ms' }}
            >
                Stats
            </h1>

            <div className="animate-rise mt-6" style={{ animationDelay: '150ms' }}>
                <StatsBoard />                                      
            </div>
        </main>
    );
}