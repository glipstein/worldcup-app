import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { DRAFTER_BY_ISO_NUM, DRAFTER_BY_ID } from '../config/draft';

// World atlas 110m TopoJSON – countries identified by ISO 3166-1 numeric id
const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function getDrafterColor(geoId: string | number): string {
  // Normalize: strip leading zeros, then look up
  const id = String(Number(geoId));
  const drafterId = DRAFTER_BY_ISO_NUM.get(id);
  if (!drafterId) return '#1e293b'; // undrafted — dark slate
  return DRAFTER_BY_ID.get(drafterId)?.color ?? '#1e293b';
}

export default function WorldMap() {
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
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getDrafterColor(geo.id)}
                strokeWidth={0.4}
                tabIndex={-1}
                style={{ outline: 'none' }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      <p className="text-xs text-slate-600 px-2 mt-2">
        Note: England is shaded as the United Kingdom (GBR) on this map.
      </p>
    </div>
  );
}
