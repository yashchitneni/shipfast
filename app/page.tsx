import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-ocean-blue flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Flexport</h1>
        <p className="text-2xl mb-8">Build Your Global Shipping Empire</p>
        <Link
          href="/game"
          className="inline-block px-8 py-4 bg-gold-yellow text-black font-bold text-xl rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Start Game
        </Link>
      </div>
    </main>
  );
}