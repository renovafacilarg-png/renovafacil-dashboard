import { useState, useEffect, useCallback } from 'react';
import { API_URL, getHeaders } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Tag, TrendingDown, BarChart2, AlertTriangle } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AdResult {
  id: string;
  name: string;
  copy_preview: string;
  l1: string;
  l2: string;
  l3: string[];
}

interface Creative {
  ad_name: string;
  saturation_score: number;
  recommendation: 'keep' | 'monitor' | 'refresh' | 'kill';
  total_spend: number;
  avg_frequency_recent: number;
  ctr_recent: number;
  cpm_recent: number;
  days_active: number;
  impressions_recent?: number;
}

interface SaturationReport {
  summary: {
    date_range: string;
    total_spend: number;
    total_impressions: number;
    ads_analyzed: number;
  };
  creatives: Creative[];
  most_saturated: string;
}

interface Adset {
  id: string;
  name: string;
  daily_budget?: number;
  lifetime_budget?: number;
  effective_status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const REC_STYLES: Record<string, string> = {
  keep: 'bg-emerald-500/15 text-emerald-500',
  monitor: 'bg-yellow-500/15 text-yellow-600',
  refresh: 'bg-orange-500/15 text-orange-500',
  kill: 'bg-red-500/15 text-red-500',
};

const REC_LABELS: Record<string, string> = {
  keep: 'Mantener',
  monitor: 'Monitorear',
  refresh: 'Rotar',
  kill: 'Pausar',
};

function RecBadge({ rec }: { rec: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${REC_STYLES[rec] ?? ''}`}>
      {REC_LABELS[rec] ?? rec}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, count, onRefresh, loading }: {
  icon: React.ElementType;
  title: string;
  count?: number;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <RefreshCw className="h-3.5 w-3.5" />
        }
      </Button>
    </div>
  );
}

function ErrorRow({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-400 py-4">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {msg}
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function FilterPills<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === o.value
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Ads Panel ────────────────────────────────────────────────────────────────────
function AdsPanel() {
  const [ads, setAds] = useState<AdResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/meta/ads/live?status=ACTIVE`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAds(data.ads ?? []);
    } catch (e) {
      setError((e as Error).message);
      toast.error('Error al cargar ads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <SectionHeader icon={Tag} title="Angle Tagger — Ads activos" count={ads.length} onRefresh={load} loading={loading} />

      {loading && <LoadingRow />}
      {error && !loading && <ErrorRow msg={error} />}
      {!loading && !error && ads.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Sin ads para mostrar.</p>
      )}

      {!loading && ads.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Ad</th>
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Ángulo</th>
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Driver</th>
                <th className="pb-2 text-muted-foreground font-medium">Copy</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-4 font-medium max-w-[160px] truncate">
                    <a
                      href={`https://adsmanager.facebook.com/adsmanager/manage/ads?selected_ad_ids=${ad.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      title={ad.name}
                    >
                      {ad.name}
                    </a>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                      {ad.l1}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{ad.l2}</td>
                  <td className="py-2 text-muted-foreground max-w-[220px] truncate">{ad.copy_preview || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Saturation Panel ─────────────────────────────────────────────────────────────
type DatePreset = 'last_7d' | 'last_14d' | 'last_30d';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'last_7d', label: '7 días' },
  { value: 'last_14d', label: '14 días' },
  { value: 'last_30d', label: '30 días' },
];

function SaturationPanel() {
  const [report, setReport] = useState<SaturationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DatePreset>('last_30d');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/meta/saturation/live?date_preset=${preset}&status=ACTIVE`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
      toast.error('Error al cargar saturación');
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => { load(); }, [load]);

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-red-500' :
    s >= 55 ? 'text-orange-500' :
    s >= 30 ? 'text-yellow-500' :
    'text-emerald-500';

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <SectionHeader
        icon={TrendingDown}
        title="Saturation Engine"
        count={report?.summary.ads_analyzed}
        onRefresh={load}
        loading={loading}
      />

      <FilterPills options={DATE_PRESETS} value={preset} onChange={setPreset} />

      {loading && <LoadingRow />}
      {error && !loading && <ErrorRow msg={error} />}

      {!loading && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Período', value: report.summary.date_range },
              { label: 'Ads', value: String(report.summary.ads_analyzed) },
              { label: 'Gasto total', value: `$${report.summary.total_spend.toLocaleString()}` },
              { label: 'Impresiones', value: report.summary.total_impressions.toLocaleString() },
            ].map(item => (
              <div key={item.label} className="bg-muted rounded-lg px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-3 text-muted-foreground font-medium">Ad</th>
                  <th className="pb-2 pr-3 text-muted-foreground font-medium">Score</th>
                  <th className="pb-2 pr-3 text-muted-foreground font-medium">Acción</th>
                  <th className="pb-2 pr-3 text-muted-foreground font-medium">Freq</th>
                  <th className="pb-2 pr-3 text-muted-foreground font-medium">CTR (imp.)</th>
                  <th className="pb-2 text-muted-foreground font-medium">CPM</th>
                </tr>
              </thead>
              <tbody>
                {report.creatives.map(c => (
                  <tr key={c.ad_name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-3 font-medium text-foreground max-w-[160px] truncate">{c.ad_name}</td>
                    <td className="py-2 pr-3">
                      <span className={`font-bold ${scoreColor(c.saturation_score)}`}>
                        {c.saturation_score}
                      </span>
                    </td>
                    <td className="py-2 pr-3"><RecBadge rec={c.recommendation} /></td>
                    <td className="py-2 pr-3 text-muted-foreground">{c.avg_frequency_recent.toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      <span className={c.impressions_recent != null && c.impressions_recent < 200 ? 'text-yellow-500' : 'text-muted-foreground'}>
                        {c.ctr_recent.toFixed(2)}%
                      </span>
                      {c.impressions_recent != null && (
                        <span className="ml-1 text-muted-foreground/60 text-[10px]">
                          ({c.impressions_recent.toLocaleString()} imp)
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">${c.cpm_recent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Adsets Panel ──────────────────────────────────────────────────────────────────
function AdsetsPanel() {
  const [adsets, setAdsets] = useState<Adset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/meta/adsets/live`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdsets(data.adsets ?? []);
    } catch (e) {
      setError((e as Error).message);
      toast.error('Error al cargar adsets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <SectionHeader icon={BarChart2} title="Adsets & Budgets" count={adsets.length} onRefresh={load} loading={loading} />

      {loading && <LoadingRow />}
      {error && !loading && <ErrorRow msg={error} />}
      {!loading && !error && adsets.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Sin adsets para mostrar.</p>
      )}

      {!loading && adsets.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Adset</th>
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Budget diario</th>
                <th className="pb-2 pr-4 text-muted-foreground font-medium">Budget total</th>
                <th className="pb-2 text-muted-foreground font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {adsets.map(a => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-4 font-medium text-foreground max-w-[200px] truncate">{a.name}</td>
                  <td className="py-2 pr-4 text-foreground">
                    {a.daily_budget != null ? `$${a.daily_budget.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {a.lifetime_budget != null ? `$${a.lifetime_budget.toLocaleString()}` : '—'}
                  </td>
                  <td className={`py-2 font-medium ${a.effective_status === 'ACTIVE' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {a.effective_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function MetaOpsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meta Ops</h1>
        <p className="text-sm text-muted-foreground mt-1">Análisis automático de tus campañas desde la Meta API.</p>
      </div>
      <AdsPanel />
      <SaturationPanel />
      <AdsetsPanel />
    </div>
  );
}
