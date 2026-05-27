import { useSearchParams } from 'react-router-dom';
import type { History, InfraSnapshot } from '../data/types';
import {
  selectTierDistribution,
  selectResponseTrend,
  selectCapabilityHeatmap,
  selectHarnessHeatmap,
  selectHarnessTierDistribution,
  selectTableRows,
} from '../data/selectors';
import { Card } from '../components/layout/Card';
import { InfoModal } from '../components/layout/InfoModal';
import { TierDistributionBar } from '../components/charts/TierDistributionBar';
import { CapabilityHeatmap } from '../components/charts/CapabilityHeatmap';
import { HarnessTierDistribution } from '../components/charts/HarnessTierDistribution';
import { HarnessHeatmap } from '../components/charts/HarnessHeatmap';
import { GapsTable } from '../components/charts/GapsTable';

interface Props {
  history: History;
  infra: InfraSnapshot | null;
}

const INDIVIDUAL_INFO = (
  <>
    <p style={{ margin: '0 0 8px' }}>Each engineer self-assesses <strong>L1–L7</strong> on a <strong>0–5 scale</strong> in the squad survey.</p>
    <p style={{ margin: '0 0 8px' }}>Tier is assigned from the average score across all 7 levels:</p>
    <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
      <li>Explorer — avg &lt; 2.5</li>
      <li>Adopter — avg 2.5–3.5</li>
      <li>Champion — avg ≥ 3.5</li>
    </ul>
    <p style={{ margin: 0 }}>Data updates each survey wave.</p>
  </>
);

const HARNESS_INFO = (
  <>
    <p style={{ margin: '0 0 8px' }}>Scores are derived by scanning each repo with <code>context-engineering-map</code>.</p>
    <p style={{ margin: '0 0 8px' }}>Both <strong>AGENTS.md count</strong> and <strong>Skill count</strong> are converted to a <strong>0–3 score</strong>:</p>
    <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
      <li>0 — none</li>
      <li>1 — 1–5 files</li>
      <li>2 — 6–10 files</li>
      <li>3 — more than 10 files</li>
    </ul>
    <p style={{ margin: '0 0 8px' }}>Tier = avg of the two scores:</p>
    <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
      <li>Seed — avg &lt; 0.5</li>
      <li>Rooted — avg 0.5–1.5</li>
      <li>Growing — avg 1.5–2.5</li>
      <li>Mature — avg ≥ 2.5</li>
    </ul>
    <p style={{ margin: 0 }}>Data updates each ingest run.</p>
  </>
);

export function SquadDashboard({ history, infra }: Props) {
  const [params] = useSearchParams();
  const month = params.get('month');

  const tierDist       = selectTierDistribution(history, month);
  const trend          = selectResponseTrend(history);
  const capHeatmap     = selectCapabilityHeatmap(history, month);
  const harnessHeatmap = selectHarnessHeatmap(infra);
  const harnessTiers   = selectHarnessTierDistribution(infra);
  const tableRows      = selectTableRows(history, month);

  const latestWave   = trend.length > 0 ? trend[trend.length - 1] : null;
  const responseNote = latestWave ? `${latestWave.label} responded · wave ${latestWave.month}` : null;
  const scanNote     = infra ? `scanned ${infra.capturedAt}` : null;

  const colHeader = (label: string, info: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{label}</h2>
      <InfoModal title={label}>{info}</InfoModal>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Two-column layout: Individual | Harness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── Left: Individual Capability ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {colHeader('Individual Capability', INDIVIDUAL_INFO)}
          <Card title="Tier Distribution">
            <TierDistributionBar data={tierDist} responseNote={responseNote} />
          </Card>
          <Card title="Capability Profile — L1 to L7">
            <CapabilityHeatmap data={capHeatmap} />
          </Card>
        </div>

        {/* ── Right: Harness Capability ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {colHeader('Harness Capability', HARNESS_INFO)}
          <Card title="Harness Tier Distribution">
            <HarnessTierDistribution data={harnessTiers} scanNote={scanNote} />
          </Card>
          <Card title="Repo Profile — Agents · Skills">
            <HarnessHeatmap data={harnessHeatmap} />
          </Card>
        </div>

      </div>

      {/* Full-width: Gaps & Planned Actions */}
      <Card title="Gaps & Planned Actions">
        <GapsTable rows={tableRows} month={month} />
      </Card>

    </div>
  );
}
