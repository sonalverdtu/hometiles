// Mini taste heatmap around home (FR-502). Cells come from Qloo's urn:heatmap.

export function HeatMap({ cells, home }: { cells: { lat: number; lon: number; affinity: number }[]; home?: { lat: number; lon: number } }) {
  if (!cells.length) return null;
  const lats = cells.map((c) => c.lat);
  const lons = cells.map((c) => c.lon);
  const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const W = 220,
    H = 160;
  const x = (lon: number) => ((lon - minLon) / (maxLon - minLon || 1)) * (W - 20) + 10;
  const y = (lat: number) => H - (((lat - minLat) / (maxLat - minLat || 1)) * (H - 20) + 10);
  return (
    <figure className="rounded-xl border border-[var(--line)] bg-white p-2">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Taste heatmap around home: darker means stronger affinity">
        {cells.map((c, i) => (
          <circle key={i} cx={x(c.lon)} cy={y(c.lat)} r={11} fill={`rgba(226, 87, 43, ${Math.max(0.08, Math.min(0.9, c.affinity))})`} />
        ))}
        {home && <text x={x(home.lon)} y={y(home.lat) + 5} textAnchor="middle" fontSize="16">🏠</text>}
      </svg>
      <figcaption className="text-[11px] text-[var(--muted)]">Where this taste clusters near home (Qloo heatmap)</figcaption>
    </figure>
  );
}
