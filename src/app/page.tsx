import Link from 'next/link';
import ModeCarousel from '@/components/ModeCarousel';

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
            <h1
                className="animate-fade font-display text-5xl font-semibold tracking-tight text-parchment sm:text-6xl lg:text-7xl"
                style={{ animationDelay: '0ms' }}
            >
                Blindfold Trainer
            </h1>

            <p
                className="animate-fade mt-4 max-w-2xl font-body text-base text-muted sm:text-lg"
                style={{ animationDelay: '90ms' }}
            >
                Train your chess memory and visualization.
            </p>

            <div className="animate-fade mt-7 flex w-full justify-center" style={{ animationDelay: '150ms' }}>
                <ModeCarousel />
            </div>

            <Link
                href="/stats"
                className="animate-fade mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-slate bg-surface px-6 font-mono font-bold text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                style={{ animationDelay: '230ms' }}
            >
                View Stats
            </Link>
        </main>
    );
}