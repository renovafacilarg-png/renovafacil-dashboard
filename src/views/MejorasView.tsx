import { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle, XCircle, Trash2, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  fetchSuggestions,
  fetchMutations,
  fetchImprovementStats,
  approveSuggestion,
  rejectSuggestion,
  deactivateMutation,
  triggerAnalysis,
  type Suggestion,
  type Mutation,
  type ImprovementStats,
} from '@/lib/api';

// ── Labels ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  cached_response: 'Respuesta cacheada',
  objection_handler: 'Manejo de objeción',
  prompt_addition: 'Adición al prompt',
  failed_response: 'Respuesta fallida',
};

const PRIORITY_CLASS: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

// ── SuggestionCard ─────────────────────────────────────────────────────────

function SuggestionCard({
  s,
  onApprove,
  onReject,
}: {
  s: Suggestion;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const content = s.suggested_response || s.content || s.rule || '';
  const preview = content.length > 120 ? content.slice(0, 120) + '…' : content;

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await approveSuggestion(s.id);
      toast.success('Mejora aprobada', { description: TYPE_LABELS[s.type] || s.type });
      onApprove(s.id);
    } catch {
      toast.error('No se pudo aprobar');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await rejectSuggestion(s.id);
      toast.success('Mejora rechazada');
      onReject(s.id);
    } catch {
      toast.error('No se pudo rechazar');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-foreground/70 bg-muted px-2 py-0.5 rounded-full border border-border">
            {TYPE_LABELS[s.type] || s.type}
          </span>
          {s.priority && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', PRIORITY_CLASS[s.priority])}>
              {PRIORITY_LABEL[s.priority] || s.priority}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Patterns / Triggers */}
      {(s.patterns?.length || s.triggers?.length) && (
        <div className="flex flex-wrap gap-1.5">
          {(s.patterns || s.triggers || []).slice(0, 4).map((p, i) => (
            <code key={i} className="text-[11px] font-mono bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
              {p}
            </code>
          ))}
          {(s.patterns?.length || s.triggers?.length || 0) > 4 && (
            <span className="text-[11px] text-muted-foreground">+{(s.patterns?.length || s.triggers?.length || 0) - 4}</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="bg-background/50 border border-border/50 rounded-lg p-3">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {expanded ? content : preview}
        </p>
      </div>

      {/* Examples */}
      {expanded && s.examples && s.examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ejemplos</p>
          {s.examples.slice(0, 2).map((ex, i) => {
              const r = ex as Record<string, string>;
              const userText = r.user || r.usuario || r.cliente || r.message || r.input || Object.values(r)[0] || '';
              const botText  = r.bot  || r.respuesta || r.response || r.output || Object.values(r)[1] || '';
              return (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs">
                  {userText && <p><span className="text-muted-foreground">Usuario:</span> {userText}</p>}
                  {botText  && <p><span className="text-muted-foreground">Bot:</span> {botText}</p>}
                  {!userText && !botText && (
                    <pre className="text-muted-foreground whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Reason */}
      {expanded && s.reason && (
        <p className="text-xs text-muted-foreground italic">{s.reason}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 text-red-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={handleReject}
          disabled={!!loading}
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          {loading === 'reject' ? 'Rechazando…' : 'Rechazar'}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-primary/90 hover:bg-primary text-white"
          onClick={handleApprove}
          disabled={!!loading}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          {loading === 'approve' ? 'Aprobando…' : 'Aprobar'}
        </Button>
      </div>
    </div>
  );
}

// ── MutationCard ──────────────────────────────────────────────────────────

function MutationCard({ m, onDeactivate }: { m: Mutation; onDeactivate: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await deactivateMutation(m.id);
      toast.success('Mutación desactivada');
      onDeactivate(m.id);
    } catch {
      toast.error('No se pudo desactivar');
    } finally {
      setLoading(false);
    }
  };

  const content = m.response || m.content || m.rule || '';

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-foreground/70 bg-muted px-2 py-0.5 rounded-full border border-border">
            {TYPE_LABELS[m.type] || m.type}
          </span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {m.uses} usos
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          onClick={handleDeactivate}
          disabled={loading}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {(m.patterns || m.triggers || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(m.patterns || m.triggers || []).slice(0, 4).map((p, i) => (
            <code key={i} className="text-[11px] font-mono bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
              {p}
            </code>
          ))}
        </div>
      )}

      {content && (
        <div className="bg-background/50 border border-border/50 rounded-lg p-3">
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{content}</p>
        </div>
      )}

      {m.created_at && (
        <p className="text-[11px] text-muted-foreground">
          Activada {new Date(m.created_at).toLocaleDateString('es-AR')}
        </p>
      )}
    </div>
  );
}

// ── MejorasView ────────────────────────────────────────────────────────────

type Tab = 'pendientes' | 'activas';

export function MejorasView() {
  const [tab, setTab] = useState<Tab>('pendientes');
  const [stats, setStats] = useState<ImprovementStats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, suggData, mutData] = await Promise.all([
        fetchImprovementStats(),
        fetchSuggestions('pending'),
        fetchMutations(),
      ]);
      setStats(statsData);
      setSuggestions(suggData.suggestions);
      setMutations(mutData.mutations);
    } catch {
      toast.error('Error cargando mejoras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await triggerAnalysis();
      if (result.success) {
        toast.success('Análisis completado', {
          description: `${result.conversations_analyzed ?? 0} conversaciones analizadas`,
        });
        await load();
      } else {
        toast.error('El análisis no generó nuevas sugerencias');
      }
    } catch {
      toast.error('Error al lanzar análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeSuggestion = (id: string) => setSuggestions(prev => prev.filter(s => s.id !== id));
  const removeMutation = (id: string) => setMutations(prev => prev.filter(m => m.id !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Auto-mejoras del Bot
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sugerencias generadas automáticamente a partir de conversaciones reales
          </p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          size="sm"
          variant="outline"
          className="shrink-0 border-border hover:bg-muted"
        >
          <RefreshCw className={cn('mr-2 h-3.5 w-3.5', analyzing && 'animate-spin')} />
          {analyzing ? 'Analizando…' : 'Analizar ahora'}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Pendientes', value: stats.pending_suggestions, icon: Sparkles, color: 'text-primary' },
            { label: 'Activas', value: stats.active_mutations, icon: Zap, color: 'text-emerald-400' },
            { label: 'Aprobadas', value: stats.approved_total, icon: CheckCircle, color: 'text-blue-400' },
            { label: 'Tasa aprobación', value: `${Math.round(stats.approval_rate ?? 0)}%`, icon: CheckCircle, color: 'text-muted-foreground' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1 w-fit">
        {(['pendientes', 'activas'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'pendientes'
              ? `Pendientes${suggestions.length > 0 ? ` (${suggestions.length})` : ''}`
              : `Activas${mutations.length > 0 ? ` (${mutations.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-16 bg-muted rounded mb-3" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : tab === 'pendientes' ? (
        suggestions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="text-foreground font-medium">Todo revisado</p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay sugerencias pendientes. Usá "Analizar ahora" para buscar nuevas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                s={s}
                onApprove={removeSuggestion}
                onReject={removeSuggestion}
              />
            ))}
          </div>
        )
      ) : (
        mutations.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-foreground font-medium">Sin mutaciones activas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las mejoras aprobadas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mutations.map(m => (
              <MutationCard key={m.id} m={m} onDeactivate={removeMutation} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
