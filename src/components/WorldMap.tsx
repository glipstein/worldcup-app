import { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { DRAFTER_BY_ID, DRAFT_CONFIG } from '../config/draft';

// World atlas 110m TopoJSON – countries identified by ISO 3166-1 numeric id
const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ─── Build per-ISO lookup (supports multiple drafters on the same polygon) ───

/**
 * Map from ISO numeric string → list of drafter ids that have a team there.
 * Most countries have exactly one drafter; GBR (826) has two: England (Lipstein)
 * and Scotland (Martin), which share the same world-atlas polygon.
 */
function buildIsoMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const drafter of DRAFT_CONFIG) {
    for (const team of drafter.teams) {
      const id = String(Number(team.isoNum)); // strip leading zeros
      const existing = map.get(id) ?? [];
      if (!existing.includes(drafter.id)) existing.push(drafter.id);
      map.set(id, existing);
    }
  }
  return map;
}

const ISO_TO_DRAFTERS = buildIsoMap();

export default function WorldMap() {
  // Build stripe pattern definitions for any ISO polygon shared by 2 drafters
  const stripeDefs = useMemo(() => {
    const entries: Array<{ isoNum: string; colors: string[] }> = [];
    for (const [isoNum, ids] of ISO_TO_DRAFTERS.entries()) {
      if (ids.length > 1) {
        entries.push({
          isoNum,
          colors: ids.map(id => DRAFTER_BY_ID.get(id)?.color ?? '#1e293b'),
        });
      }
    }
    return entries;
  }, []);

  function getDrafterFill(geoId: string | number): string {
    const id = String(Number(geoId));
    const ids = ISO_TO_DRAFTERS.get(id);
    if (!ids || ids.length === 0) return '#1e293b'; // undrafted
    if (ids.length > 1) return `url(#stripe-${id})`; // shared polygon
    return DRAFTER_BY_ID.get(ids[0])?.color ?? '#1e293b';
  }

  return (
    <div className="bg-slate-900 rounded-xl p-2 sm:p-4 overflow-hidden">
      <h2 className="text-lg font-bold text-white mb-3 px-2">World Map</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-2 mb-3">
        {Array.from(DRAFTER_BY_ID.values()).map(d => (
          <div key={d.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: d.color }}
            />
            <span className="text-xs text-slate-300">{d.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-800" />
          <span className="text-xs text-slate-500">Undrafted</span>
        </div>
      </div>

      <ComposableMap
        projectionConfig={{ scale: 140, center: [10, 10] }}
        style={{ width: '100%', height: 'auto' }}
        className="stroke-slate-950"
      >
        {/* Diagonal stripe patterns for shared polygons (e.g. GBR = England + Scotland) */}
        <defs>
          {stripeDefs.map(({ isoNum, colors }) => (
            <pattern
              key={isoNum}
              id={`stripe-${isoNum}`}
              patternUnits="userSpaceOnUse"
              width="7"
              height="7"
              patternTransform="rotate(45 0 0)"
            >
              {colors.map((color, i) => (
                <rect
                  key={i}
                  x={i * (7 / colors.length)}
                  width={7 / colors.length}
                  height="7"
                  fill={color}
                />
              ))}
            </pattern>
          ))}
        </defs>

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getDrafterFill(geo.id)}
                strokeWidth={0.4}
                tabIndex={-1}
                style={{ outline: 'none' }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      <p className="text-xs text-slate-600 px-2 mt-2">
        England (Lipstein) and Scotland (Martin) share the GBR polygon — shown as diagonal stripes.
      </p>
    </div>
  );
}
