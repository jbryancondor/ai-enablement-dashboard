import { useSearchParams } from 'react-router-dom';
import type { History, InfraSnapshot } from '../data/types';
import { TARGETS } from '../data/targets';
import {
  selectTierDistribution,
  selectResponseTrend,
  selectCapabilityHeatmap,
  selectInfraCoverage,
  selectTableRows,
} from '../data/selectors';
import { Card } from '../components/layout/Card';
import { TierDistributionBar } from '../components/charts/TierDistributionBar';
import { CapabilityHeatmap } from '../components/charts/CapabilityHeatmap';
import { InfraCoverageBullet } from '../components/charts/InfraCoverageBullet';
import { GapsTable } from '../components/charts/GapsTable';

interface Props {
  history: History;
  infra: InfraSnapshot | null;
}

export function SquadDashboard({ history, infra }: Props) {
  const [params] = useSearchParams();
  const month = params.get('month');

  const tierDist    = selectTierDistribution(history, month);
  const trend       = selectResponseTrend(history);
  const heatmap     = selectCapabilityHeatmap(history, month);
  const infraTarget = TARGETS.infraCoverage;
  const bullet      = selectInfraCoverage(infra, infraTarget.value, infraTarget.poorMax, infraTarget.okMax);
  const tableRows   = selectTableRows(history, month);

  // Response rate footnote for S1
  const latestWave  = trend.length > 0 ? trend[trend.length - 1] : null;
  const responseNote = latestWave
    ? `${latestWave.label} responded · wave ${latestWave.month}`
    : null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Row 1 — Where does the squad stand? */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch' }}>
        <Card title="Tier Distribution">
          <TierDistributionBar data={tierDist} responseNote={responseNote} />
        </Card>
        <Card title="Agentic Infrastructure Coverage">
          <InfraCoverageBullet data={bullet} />
          {infra && infra.repos.length > 0 && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {infra.repos.filter(r => r.hasAgentsMd).length} of {infra.repos.length} repos
              have AGENTS.md · scanned {infra.capturedAt}
            </p>
          )}
          {(!infra || infra.repos.length === 0) && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Repo scanning not configured. Add repo paths to <code>config/squad.yaml</code> and re-run ingest.
            </p>
          )}
        </Card>
      </div>

      {/* Row 2 — Capability profile (full width) */}
      <Card title="Capability Profile — L1 to L7">
        <CapabilityHeatmap data={heatmap} />
      </Card>

      {/* Row 3 — Gaps & planned actions (full width) */}
      <Card title="Gaps & Planned Actions">
        <GapsTable rows={tableRows} month={month} />
      </Card>

    </div>
  );
}
