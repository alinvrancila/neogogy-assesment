import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Neogogy Formation Compass: a free diagnostic of how you learn with AI.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const F = (w: string) => `https://raw.githubusercontent.com/google/fonts/main/ofl/spectral/Spectral-${w}.ttf`;
const FONT_MONO = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf';

export default async function Image() {
  const [reg, bold, xbold, mono] = await Promise.all([
    fetch(F('Regular')).then((r) => r.arrayBuffer()),
    fetch(F('Bold')).then((r) => r.arrayBuffer()),
    fetch(F('ExtraBold')).then((r) => r.arrayBuffer()),
    fetch(FONT_MONO).then((r) => r.arrayBuffer())
  ]);

  // ten-dimension radar geometry (the signature "formation profile" shape)
  const RX = 222;
  const RY = 190;
  const RR = 152;
  const vals = [0.86, 0.64, 0.92, 0.58, 0.8, 0.88, 0.52, 0.74, 0.9, 0.68];
  const pt = (i: number, f: number) => {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return [RX + Math.cos(a) * RR * f, RY + Math.sin(a) * RR * f] as const;
  };
  const ringPts = (f: number) => vals.map((_, i) => pt(i, f).map((n) => n.toFixed(1)).join(',')).join(' ');
  const dataPts = vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#1B0706',
          backgroundImage: 'linear-gradient(125deg, #6A100D 0%, #3A0907 45%, #170605 100%)',
          color: '#F2E8DC',
          fontFamily: 'Spectral'
        }}
      >
        {/* depth: faint compass rings bleeding off the corners */}
        <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}>
          <svg width={1200} height={630} viewBox="0 0 1200 630">
            {[140, 230, 320, 410, 500].map((rr) => (
              <circle key={`a${rr}`} cx={-40} cy={680} r={rr} fill="none" stroke="rgba(242,232,220,0.06)" strokeWidth={1.5} />
            ))}
            {[120, 210, 300, 390].map((rr) => (
              <circle key={`b${rr}`} cx={1250} cy={-40} r={rr} fill="none" stroke="rgba(242,232,220,0.05)" strokeWidth={1.5} />
            ))}
          </svg>
        </div>

        {/* LEFT: text */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 660, padding: '62px 0 60px 78px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'Plex', fontSize: 19, letterSpacing: 3, color: '#CDB07A' }}>
              INTERNATIONAL CENTER FOR APPLIED NEOGOGY · ICAN
            </div>
            <div style={{ display: 'flex', width: 64, height: 4, backgroundColor: '#9E1D20', marginTop: 16 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.04, color: 'rgba(242,232,220,0.92)' }}>Is AI making you</div>
            <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, lineHeight: 1.0, color: '#5FB4A1', marginTop: 6 }}>wiser,</div>
            <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.04, color: 'rgba(242,232,220,0.92)' }}>or just faster?</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'Plex', fontSize: 16, letterSpacing: 3, color: '#CDB07A' }}>A FREE 10-MINUTE DIAGNOSTIC</div>
            <div style={{ display: 'flex', fontFamily: 'Plex', fontSize: 24, letterSpacing: 1, color: '#F2E8DC', marginTop: 8 }}>assessment.neogogy.ai</div>
          </div>
        </div>

        {/* RIGHT: ten-dimension formation radar with depth */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <svg width={444} height={384} viewBox="0 0 444 384">
            {/* layered glow for depth */}
            <circle cx={RX} cy={RY} r={RR + 26} fill="#5FB4A1" opacity={0.05} />
            <circle cx={RX} cy={RY} r={RR + 6} fill="#5FB4A1" opacity={0.06} />
            {/* concentric decagon rings */}
            {[0.28, 0.52, 0.76, 1].map((f) => (
              <polygon key={f} points={ringPts(f)} fill="none" stroke="rgba(242,232,220,0.13)" strokeWidth={1.5} />
            ))}
            {/* spokes */}
            {vals.map((_, i) => {
              const [x, y] = pt(i, 1);
              return <line key={i} x1={RX} y1={RY} x2={x} y2={y} stroke="rgba(242,232,220,0.1)" strokeWidth={1.5} />;
            })}
            {/* outer echo of the profile (sense of movement) */}
            <polygon points={vals.map((v, i) => pt(i, Math.min(1, v + 0.05)).map((n) => n.toFixed(1)).join(',')).join(' ')} fill="none" stroke="rgba(127,216,196,0.28)" strokeWidth={2} />
            {/* the formation profile */}
            <polygon points={dataPts} fill="rgba(95,180,161,0.32)" stroke="#7FD8C4" strokeWidth={3.5} />
            {/* vertex markers */}
            {vals.map((v, i) => {
              const [x, y] = pt(i, v);
              return <circle key={i} cx={x} cy={y} r={5.5} fill="#F2E8DC" />;
            })}
            <circle cx={RX} cy={RY} r={4} fill="rgba(242,232,220,0.55)" />
          </svg>
          <div style={{ display: 'flex', fontFamily: 'Plex', fontSize: 16, letterSpacing: 4, color: '#CDB07A', marginTop: 2 }}>TEN DIMENSIONS OF FORMATION</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Spectral', data: reg, weight: 400, style: 'normal' },
        { name: 'Spectral', data: bold, weight: 700, style: 'normal' },
        { name: 'Spectral', data: xbold, weight: 800, style: 'normal' },
        { name: 'Plex', data: mono, weight: 500, style: 'normal' }
      ]
    }
  );
}
