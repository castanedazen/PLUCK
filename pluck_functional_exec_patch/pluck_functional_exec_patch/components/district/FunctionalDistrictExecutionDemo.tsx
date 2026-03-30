import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/pluck-functional-exec.css';

type Role = 'District Manager' | 'Regional VP' | 'National Retail';
type Stage = 'idle' | 'scan' | 'match' | 'execute' | 'complete';

type Node = {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'grower' | 'store';
  product?: string;
  units?: number;
};

type DistrictConfig = {
  id: string;
  name: string;
  region: string;
  stores: number;
  growers: number;
  annualUnits: number;
  shortages: number;
  heroCopy: string;
  storeNode: Node;
  growerNodes: Node[];
};

const districts: DistrictConfig[] = [
  {
    id: 'sfv',
    name: 'San Fernando Valley district',
    region: 'West Coast retail execution',
    stores: 12,
    growers: 3,
    annualUnits: 22,
    shortages: 8,
    heroCopy: 'See store shortages, nearby grower supply, and live route execution in one view.',
    storeNode: { id: 'store-1423', name: 'Store 1423', x: 66, y: 56, type: 'store', product: 'Avocados', units: 16 },
    growerNodes: [
      { id: 'g1', name: 'Crown Grove', x: 20, y: 70, type: 'grower', product: 'Avocados', units: 8 },
      { id: 'g2', name: 'Marti\'s Garden', x: 40, y: 50, type: 'grower', product: 'Avocados', units: 6 },
      { id: 'g3', name: 'North Valley Growers', x: 28, y: 30, type: 'grower', product: 'Avocados', units: 8 },
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix metro district',
    region: 'Southwest retail execution',
    stores: 18,
    growers: 5,
    annualUnits: 36,
    shortages: 11,
    heroCopy: 'Move from shortage detection to store-ready local fill in a guided executive flow.',
    storeNode: { id: 'store-2510', name: 'Store 2510', x: 64, y: 48, type: 'store', product: 'Tomatoes', units: 24 },
    growerNodes: [
      { id: 'g1', name: 'Mesa Bloom', x: 18, y: 68, type: 'grower', product: 'Tomatoes', units: 5 },
      { id: 'g2', name: 'Sonoran Produce', x: 28, y: 28, type: 'grower', product: 'Tomatoes', units: 7 },
      { id: 'g3', name: 'Desert Vine', x: 42, y: 60, type: 'grower', product: 'Tomatoes', units: 4 },
      { id: 'g4', name: 'Agua Fria Farms', x: 36, y: 44, type: 'grower', product: 'Tomatoes', units: 3 },
      { id: 'g5', name: 'West Mesa Harvest', x: 23, y: 50, type: 'grower', product: 'Tomatoes', units: 5 },
    ],
  },
  {
    id: 'atlanta',
    name: 'Atlanta regional district',
    region: 'Southeast retail execution',
    stores: 24,
    growers: 6,
    annualUnits: 44,
    shortages: 13,
    heroCopy: 'National districts can scan, match, and execute hyperlocal fill from a single operating view.',
    storeNode: { id: 'store-884', name: 'Store 884', x: 68, y: 54, type: 'store', product: 'Berries', units: 28 },
    growerNodes: [
      { id: 'g1', name: 'Peachtree Fields', x: 18, y: 66, type: 'grower', product: 'Berries', units: 4 },
      { id: 'g2', name: 'Riverbend Berry Co', x: 33, y: 30, type: 'grower', product: 'Berries', units: 6 },
      { id: 'g3', name: 'East County Produce', x: 38, y: 56, type: 'grower', product: 'Berries', units: 5 },
      { id: 'g4', name: 'South Orchard Group', x: 26, y: 46, type: 'grower', product: 'Berries', units: 5 },
      { id: 'g5', name: 'Northline Acres', x: 48, y: 42, type: 'grower', product: 'Berries', units: 4 },
      { id: 'g6', name: 'Pine Grove Produce', x: 22, y: 22, type: 'grower', product: 'Berries', units: 4 },
    ],
  },
];

const roleDescriptions: Record<Role, string> = {
  'District Manager': 'Store-by-store fill visibility with route execution and local supplier responsiveness.',
  'Regional VP': 'Regional supply orchestration across district coverage, speed, and recovery confidence.',
  'National Retail': 'National operating view for scalable hyperlocal supply response and execution consistency.',
};

function clampPercent(v: number) {
  return Math.max(0, Math.min(100, v));
}

export default function FunctionalDistrictExecutionDemo() {
  const [districtId, setDistrictId] = useState(districts[0].id);
  const [role, setRole] = useState<Role>('District Manager');
  const [stage, setStage] = useState<Stage>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [coverage, setCoverage] = useState(14);
  const [matched, setMatched] = useState(0);
  const [eta, setEta] = useState('--');
  const [suppliersNotified, setSuppliersNotified] = useState(0);
  const [unitsSecured, setUnitsSecured] = useState(0);
  const [summary, setSummary] = useState('Ready to execute district fill.');
  const [activeRoutes, setActiveRoutes] = useState<string[]>([]);

  const district = useMemo(() => districts.find((d) => d.id === districtId) || districts[0], [districtId]);

  useEffect(() => {
    setStage('idle');
    setIsRunning(false);
    setCoverage(14);
    setMatched(0);
    setEta('--');
    setSuppliersNotified(0);
    setUnitsSecured(0);
    setSummary('Ready to execute district fill.');
    setActiveRoutes([]);
  }, [districtId, role]);

  const executeFlow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveRoutes([]);

    setStage('scan');
    setSummary(`Scanning ${district.stores} stores across ${district.region}.`);
    setCoverage(clampPercent(32 + district.growers * 3));
    await wait(850);

    setStage('match');
    setSummary(`Matching ${district.growers} verified growers to live shortage demand.`);
    setSuppliersNotified(district.growers);
    setMatched(Math.max(1, Math.ceil(district.growers * 0.65)));
    setCoverage(clampPercent(58 + district.growers * 4));
    await animateRoutes(district.growerNodes.map((g) => g.id), setActiveRoutes, 260);

    setStage('execute');
    setSummary(`Executing local fill to ${district.storeNode.name} for ${district.storeNode.product}.`);
    setUnitsSecured(district.growerNodes.reduce((sum, g) => sum + (g.units || 0), 0));
    setEta(role === 'National Retail' ? '2.8 hrs' : role === 'Regional VP' ? '2.2 hrs' : '1.7 hrs');
    setCoverage(clampPercent(84 + district.growers));
    await wait(950);

    setStage('complete');
    setSummary('District execution complete. Local supply routed and buyer-ready for presentation.');
    setMatched(district.growers);
    setIsRunning(false);
  };

  const stageLabel = stage === 'idle'
    ? 'Execute Local Fill'
    : stage === 'scan'
      ? 'Scanning Market…'
      : stage === 'match'
        ? 'Matching Suppliers…'
        : stage === 'execute'
          ? 'Executing Routes…'
          : 'Fill Executed';

  return (
    <div className="pluck-exec-wrap">
      <section className="pluck-exec-hero">
        <div>
          <div className="pluck-badge">PLUCK · DISTRICT EXECUTION</div>
          <h1>Hyperlocal supply intelligence that actually executes.</h1>
          <p>{district.heroCopy}</p>
          <div className="pluck-chip-row">
            <span>{district.stores} stores</span>
            <span>{district.growers} growers</span>
            <span>{district.region}</span>
          </div>
        </div>
        <div className="pluck-hero-card">
          <div className="pluck-hero-eyebrow">BUYER PRESENTATION MODE</div>
          <h3>{role}</h3>
          <p>{roleDescriptions[role]}</p>
          <button className={`pluck-primary-btn ${stage === 'complete' ? 'is-complete' : ''}`} onClick={executeFlow} disabled={isRunning}>
            {stageLabel}
          </button>
        </div>
      </section>

      <section className="pluck-toolbar">
        <div className="pluck-toggle-group">
          {(['District Manager', 'Regional VP', 'National Retail'] as Role[]).map((r) => (
            <button key={r} className={role === r ? 'is-active' : ''} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="pluck-toggle-group district-group">
          {districts.map((d) => (
            <button key={d.id} className={districtId === d.id ? 'is-active' : ''} onClick={() => setDistrictId(d.id)}>
              {d.name.replace(' district', '')}
            </button>
          ))}
        </div>
      </section>

      <section className="pluck-kpi-grid">
        <KpiCard label="Coverage" value={`${coverage}%`} sub="District fill coverage" />
        <KpiCard label="Matched" value={String(matched)} sub="Growers assigned" />
        <KpiCard label="ETA" value={eta} sub="Average route time" />
        <KpiCard label="Suppliers Notified" value={String(suppliersNotified)} sub="Live outreach" />
        <KpiCard label="Units Secured" value={String(unitsSecured)} sub="Local inventory routed" />
      </section>

      <section className="pluck-main-grid">
        <div className="pluck-map-card">
          <div className="pluck-section-eyebrow">INTERACTIVE EXECUTION MAP</div>
          <h2>{district.name}</h2>
          <p>Buttons on this page are functional. Change roles, change districts, then run execution.</p>
          <ExecutionMap district={district} activeRoutes={activeRoutes} />
        </div>

        <div className="pluck-side-stack">
          <div className="pluck-side-card">
            <div className="pluck-section-eyebrow">EXECUTION SUMMARY</div>
            <h3>{summary}</h3>
            <ol className="pluck-stage-list">
              <li className={stage === 'scan' || stage === 'match' || stage === 'execute' || stage === 'complete' ? 'is-done' : ''}>Market scan</li>
              <li className={stage === 'match' || stage === 'execute' || stage === 'complete' ? 'is-done' : ''}>Supplier match</li>
              <li className={stage === 'execute' || stage === 'complete' ? 'is-done' : ''}>Store execution</li>
              <li className={stage === 'complete' ? 'is-done' : ''}>Value summary</li>
            </ol>
          </div>

          <div className="pluck-side-card">
            <div className="pluck-section-eyebrow">STORE SHORTAGE</div>
            <div className="pluck-row"><strong>{district.storeNode.name}</strong><span>{district.storeNode.units} units</span></div>
            <div className="pluck-muted">{district.storeNode.product}</div>
          </div>

          <div className="pluck-side-card">
            <div className="pluck-section-eyebrow">MATCHED GROWERS</div>
            {district.growerNodes.map((g) => (
              <div key={g.id} className="pluck-row pluck-grower-row">
                <span>{g.name}</span>
                <strong>{g.units} units</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="pluck-kpi-card">
      <div className="pluck-section-eyebrow">{label}</div>
      <div className="pluck-kpi-value">{value}</div>
      <div className="pluck-muted">{sub}</div>
    </div>
  );
}

function ExecutionMap({ district, activeRoutes }: { district: DistrictConfig; activeRoutes: string[] }) {
  return (
    <div className="pluck-map-shell">
      <svg viewBox="0 0 100 100" className="pluck-map-svg" role="img" aria-label="district execution map">
        <defs>
          <linearGradient id="bgGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5f1cf" />
            <stop offset="100%" stopColor="#d9eef3" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" rx="4" fill="url(#bgGrad)" />
        {district.growerNodes.map((g) => {
          const isActive = activeRoutes.includes(g.id);
          return (
            <g key={g.id}>
              <line
                x1={g.x}
                y1={g.y}
                x2={district.storeNode.x}
                y2={district.storeNode.y}
                className={`pluck-route-line ${isActive ? 'is-active' : ''}`}
              />
              <circle cx={g.x} cy={g.y} r="2.2" className={`pluck-grower-dot ${isActive ? 'is-active' : ''}`} />
              <text x={g.x - 4} y={g.y + 6} className="pluck-map-label">{g.name}</text>
            </g>
          );
        })}
        <circle cx={district.storeNode.x} cy={district.storeNode.y} r="2.8" className="pluck-store-dot" />
        <text x={district.storeNode.x - 4} y={district.storeNode.y + 6} className="pluck-map-label">{district.storeNode.name}</text>
      </svg>
    </div>
  );
}

async function animateRoutes(routeIds: string[], setActiveRoutes: React.Dispatch<React.SetStateAction<string[]>>, delayMs: number) {
  const active: string[] = [];
  for (const id of routeIds) {
    active.push(id);
    setActiveRoutes([...active]);
    await wait(delayMs);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
