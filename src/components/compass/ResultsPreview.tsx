'use client';

import Results from './Results';
import type { CompassResult } from '@/engine';
import type { AttemptComparison } from '@/lib/history';

/** Client wrapper so the dev route can render Results from a server-computed result. */
export default function ResultsPreview(
  { result, comparison }: { result: CompassResult; comparison?: AttemptComparison | null }
) {
  return (
    <div className="nfc">
      <Results result={result} firstName="Alin" emailed comparison={comparison}
        onRetake={() => window.location.reload()} />
    </div>
  );
}
