'use client';

/**
 * Composes the ascent experience.
 *
 * Hierarchy, deliberately: position first, interpretation second, action
 * third, detailed evidence last.
 */

import type { CompassResult } from '@/engine';
import type { AttemptComparison } from '@/lib/history';
import AscentMapHero from './AscentMapHero';
import {
  ResultHeader, OrientationCard, RouteStages, PracticeGates,
  FootholdCard, RouteLogCard, NextClimbCard, ComparisonCard,
} from './modules';

export default function AscentResults(
  { result, comparison }: { result: CompassResult; comparison?: AttemptComparison | null }
) {
  return (
    <div className="asc">
      <ResultHeader result={result} />

      {/* position */}
      <div className="asc-hero-grid">
        <AscentMapHero result={result} comparison={comparison} />
        <OrientationCard result={result} />
      </div>

      {/* movement, when this is a return visit */}
      {comparison ? <ComparisonCard comparison={comparison} /> : null}

      {/* interpretation */}
      <RouteStages result={result} />
      <PracticeGates result={result} />

      {/* action, and the evidence behind the foothold */}
      <div className="asc-modules">
        <FootholdCard result={result} />
        <RouteLogCard result={result} />
        <NextClimbCard result={result} />
      </div>
    </div>
  );
}
