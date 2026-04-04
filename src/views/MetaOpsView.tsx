import { useState } from 'react';
import { API_URL, getHeaders } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Tag, Star, TrendingDown, ShieldCheck } from 'lucide-react';

// ── Tagger ────────────────────────────────────────────────────────────────────
function TaggerPanel() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meta/tagger/classify`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error('Error al clasificar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Tag className="h-4 w-4 text-primary" />
        Angle Tagger — CP2
      </div>
      <p className="text-xs text-muted-foreground">Clasificá el ángulo de un copy o creative.</p>
      <textarea
        className="w-full rounded-lg border border-border bg-background text-sm p-3 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Pegá el copy o descripción del creative…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <Button size="sm" onClick={run} disabled={loading || !text.trim()}>
        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Clasificar
      </Button>
      {result && (
        <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40 text-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Scorer ────────────────────────────────────────────────────────────────────
function ScorerPanel() {
  const [copy, setCopy] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!copy.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meta/scorer/evaluate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ copy }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error('Error al evaluar');
    } finally {
      setLoading(false);
    }
  }

  const score = result && typeof result.score === 'number' ? result.score : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Star className="h-4 w-4 text-yellow-500" />
        Creative Scorer — CP3
      </div>
      <p className="text-xs text-muted-foreground">Puntúa un copy de 0 a 10.</p>
      <textarea
        className="w-full rounded-lg border border-border bg-background text-sm p-3 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Pegá el copy del anuncio…"
        value={copy}
        onChange={e => setCopy(e.target.value)}
      />
      <Button size="sm" onClick={run} disabled={loading || !copy.trim()}>
        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Evaluar
      </Button>
      {result && (
        <div className="space-y-2">
          {score !== null && (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">{score}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
          )}
          <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40 text-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Saturation ────────────────────────────────────────────────────────────────
function SaturationPanel() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!csv.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meta/saturation/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ csv_data: csv }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error('Error al analizar saturación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <TrendingDown className="h-4 w-4 text-orange-500" />
        Saturation Engine — CP4
      </div>
      <p className="text-xs text-muted-foreground">Pegá datos CSV de Meta Ads para detectar saturación de audiencia.</p>
      <textarea
        className="w-full rounded-lg border border-border bg-background text-sm p-3 h-28 resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
        placeholder="ad_name,frequency,reach,impressions&#10;Creative A,3.2,10000,32000"
        value={csv}
        onChange={e => setCsv(e.target.value)}
      />
      <Button size="sm" onClick={run} disabled={loading || !csv.trim()}>
        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Analizar
      </Button>
      {result && (
        <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40 text-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Policy ────────────────────────────────────────────────────────────────────
function PolicyPanel() {
  const [adsetId, setAdsetId] = useState('');
  const [currentBudget, setCurrentBudget] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!adsetId.trim() || !currentBudget || !proposedBudget) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meta/policy/validate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          adset_id: adsetId,
          current_budget: parseFloat(currentBudget),
          proposed_budget: parseFloat(proposedBudget),
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error('Error al validar política');
    } finally {
      setLoading(false);
    }
  }

  const allowed = result && result.allowed === true;
  const denied = result && result.allowed === false;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Policy Engine — CP5
      </div>
      <p className="text-xs text-muted-foreground">Validá si un cambio de budget respeta las reglas de negocio.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          className="rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Adset ID"
          value={adsetId}
          onChange={e => setAdsetId(e.target.value)}
        />
        <input
          className="rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Budget actual"
          type="number"
          value={currentBudget}
          onChange={e => setCurrentBudget(e.target.value)}
        />
        <input
          className="rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Budget propuesto"
          type="number"
          value={proposedBudget}
          onChange={e => setProposedBudget(e.target.value)}
        />
      </div>
      <Button size="sm" onClick={run} disabled={loading || !adsetId || !currentBudget || !proposedBudget}>
        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Validar
      </Button>
      {result && (
        <div className="space-y-2">
          {(allowed || denied) && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${allowed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
              {allowed ? 'Permitido' : 'Denegado'}
            </div>
          )}
          <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40 text-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
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
        <p className="text-sm text-muted-foreground mt-1">Herramientas de IA para gestión de campañas de Meta Ads.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaggerPanel />
        <ScorerPanel />
        <SaturationPanel />
        <PolicyPanel />
      </div>
    </div>
  );
}
