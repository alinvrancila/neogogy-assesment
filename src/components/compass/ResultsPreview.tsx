'use client';

import Results from './Results';
import type { CompassResult } from '@/engine';

/** Client wrapper so the dev route can render Results from a server-computed result. */
export default function ResultsPreview({ result }: { result: CompassResult }) {
  return (
    <div className="nfc">
      <Results result={result} firstName="Alin" emailed onRetake={() => window.location.reload()} />
    </div>
  );
}
