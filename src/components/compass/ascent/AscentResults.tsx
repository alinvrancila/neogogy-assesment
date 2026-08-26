'use client';

/**
 * Composes the ascent experience.
 *
 * Hierarchy, deliberately: position first, interpretation second, action
 * third, detailed evidence last.
 */

import type { CompassResult } from '@/engine';
import AscentMapHero from './AscentMapHero';
import {
  ResultHeader, OrientationCard, RouteStages, PracticeGates,
  FootholdCard, RouteLogCard, NextClimbCard,
} from './modules';

export default function AscentResults({ result }: { result: CompassResult }) {
  return (
    <div className="asc">
      <ResultHeader result={result} />

      {/* position */}
      <div className="asc-hero-grid">
        <AscentMapHero result={result} />
        <OrientationCard result={result} />
      </div>

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
