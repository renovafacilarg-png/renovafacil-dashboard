import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, CheckCircle, XCircle, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Zap, AlertTriangle, Code2,
  TrendingUp, LayoutGrid, List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  fetchSuggestions,
  fetchMutations,
  fetchImprovementStats,
  approveSuggestion,
  rejectSuggestion,
  deactivateMutation,
  triggerAnalysis,
  rollbackMutation,
  type Suggestion,
  type Mutation,
} from '@/lib/api';

// ── Query keys ────────────────────────────────────────────────────────────────

export const IMPROVEMENT_QUERY_KEYS = {
  stats: ['improvement-stats'] as const,
  suggestions: (status: string) => ['improvement-suggestions', status] as const,
  mutations: ['improvement-mutations'] as const,
};

// ── Labels ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  cached_response: 'Respuesta cacheada',
  objection_handler: 'Manejo de objeción',
  prompt_addition: 'Adición al prompt',
  failed_response: 'Respuesta fallida',
};

const PRIORITY_CLASS: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Extrae el texto principal de una sugerencia sin importar la clave que use el backend */
function getSuggestionContent(s: Suggestion | Mutation): string {
  return ('suggested_response' in s ? s.suggested_response : undefined)
    || s.content
    || s.rule
    || ('response' in s ? s.response : undefined)
    || '';
}

// ── SuggestionCard ────────────────────────────────────────────────────────────

interface SuggestionCardProps {
  s: Suggestion;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  isFocused?: boolean;
  /** list mode: no expand, direct actions */
  listMode?: boolean;
}

function SuggestionCard({ s, selected, onToggleSelect, isFocused, listMode }: SuggestionCardProps) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  // A2 — conflict warning dialog
  const [conflictWarningOpen, setConflictWarningOpen] = useState(false);

  const content = getSuggestionContent(s);

  // Bug 2 fix — only send edited_content if actually different
  const getEditedPayload = () =>
    editMode && editedContent && editedContent !== content ? editedContent : undefined;

  const approveMutation = useMutation({
    mutationFn: () => approveSuggestion(s.id, getEditedPayload()),
    onSuccess: () => {
      // A7 — toast with content preview
      const preview = content.slice(0, 50) + (content.length > 50 ? '…' : '');
      // A3 — undo toast
      toast.success('Mejora aprobada', {
        description: preview,
        action: {
          label: 'Deshacer',
          onClick: () => {
            rollbackMutation(s.id)
              .then(() => {
                qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
                qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
              })
              .catch(() => {
                qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
                qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
              });
          },
        },
        duration: 5000,
      });
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
    },
    onError: (e: Error) => toast.error('No se pudo aprobar', { description: e.message }),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectSuggestion(s.id, rejectReason || undefined),
    onSuccess: () => {
      // A3 — undo toast (reject undo: placebo refetch)
      toast.success('Mejora rechazada', {
        action: {
          label: 'Deshacer',
          onClick: () => {
            qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
            qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
          },
        },
        duration: 5000,
      });
      setRejectOpen(false);
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
    },
    onError: (e: Error) => toast.error('No se pudo rechazar', { description: e.message }),
  });

  const isLoading = approveMutation.isPending || rejectMut.isPending;

  // Bug 1 fix — don't reset editedContent if already edited
  const handleExpandToggle = () => {
    setExpanded(v => !v);
    if (!expanded && !editedContent) {
      setEditedContent(content);
    }
  };

  // A1 — approve flow: warn if has_conflict or requires_code_change
  const handleApproveClick = () => {
    if (s.has_conflict || s.requires_code_change) {
      setConflictWarningOpen(true);
    } else {
      approveMutation.mutate();
    }
  };

  const isEdited = editMode && editedContent !== content;

  // ── List mode rendering ──────────────────────────────────────────────────────
  if (listMode) {
    return (
      <div
        className={cn(
          'border-b border-border py-2.5 px-3 flex items-center gap-3 hover:bg-muted/30 transition-colors',
          isFocused && 'ring-2 ring-primary ring-inset',
        )}
      >
        {/* Checkbox B1 */}
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect?.(s.id)}
          className="accent-primary shrink-0"
        />
        {/* Type badge */}
        <span className="text-xs font-medium text-foreground/70 bg-muted px-2 py-0.5 rounded-full border border-border shrink-0">
          {TYPE_LABELS[s.type] || s.type}
        </span>
        {/* Priority badge */}
        {s.priority && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', PRIORITY_CLASS[s.priority])}>
            {PRIORITY_LABEL[s.priority] || s.priority}
          </span>
        )}
        {/* Content preview */}
        <span className="text-sm text-foreground/80 flex-1 truncate">
          {content.slice(0, 80)}{content.length > 80 ? '…' : ''}
        </span>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Reject dialog */}
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isLoading}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar mejora</DialogTitle>
                <DialogDescription>
                  Podés dejar una razón opcional para que el analyzer aprenda del rechazo.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Razón del rechazo (opcional)…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="min-h-[80px]"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending}>
                  {rejectMut.isPending ? 'Rechazando…' : 'Confirmar rechazo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Approve */}
          <Button size="sm" variant="default" className="h-7 px-2" onClick={handleApproveClick} disabled={isLoading}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* A1 — conflict warning dialog */}
        <AlertDialog open={conflictWarningOpen} onOpenChange={setConflictWarningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar aprobación</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>Esta sugerencia tiene los siguientes flags activos:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {s.has_conflict && <li className="text-destructive">Conflicto detectado</li>}
                    {s.requires_code_change && <li className="text-warning">Requiere cambio de código</li>}
                  </ul>
                  <p>¿Querés aprobarla de todas formas?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConflictWarningOpen(false); approveMutation.mutate(); }}>
                Aprobar igual
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── Card mode rendering ──────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 space-y-3',
        // A8 — hover state
        'hover:border-border/80 transition-colors',
        // B3 — keyboard focus ring
        isFocused && 'ring-2 ring-primary',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* B1 — checkbox */}
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(s.id)}
            className="accent-primary"
          />
          <span className="text-xs font-medium text-foreground/70 bg-muted px-2 py-0.5 rounded-full border border-border">
            {TYPE_LABELS[s.type] || s.type}
          </span>
          {s.priority && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', PRIORITY_CLASS[s.priority])}>
              {PRIORITY_LABEL[s.priority] || s.priority}
            </span>
          )}
          {s.has_conflict && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-destructive/15 text-destructive border-destructive/30 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Conflicto
            </span>
          )}
          {s.requires_code_change && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              Requiere código
            </span>
          )}
        </div>
        <button
          onClick={handleExpandToggle}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? 'Colapsar' : 'Expandir'}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Patterns / Triggers */}
      {Boolean(s.patterns?.length || s.triggers?.length) && (
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

      {/* Content / Editor */}
      <div className="bg-background/50 border border-border/50 rounded-lg p-3">
        {expanded && editMode ? (
          <Textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            className="text-sm text-foreground/80 min-h-[120px] bg-transparent border-0 p-0 resize-none focus-visible:ring-1 focus-visible:ring-border"
            placeholder="Editá el contenido antes de aprobar…"
          />
        ) : (
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {expanded ? content : (content.length > 120 ? content.slice(0, 120) + '…' : content)}
          </p>
        )}
      </div>

      {/* Edit mode toggle + A9 — edited badge + restore */}
      {expanded && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (!editMode && !editedContent) setEditedContent(content);
              setEditMode(v => !v);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {editMode ? 'Ver original' : 'Editar antes de aprobar'}
          </button>
          {/* A9 */}
          {isEdited && (
            <>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                Editado
              </span>
              <button
                onClick={() => setEditedContent(content)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Restaurar original
              </button>
            </>
          )}
        </div>
      )}

      {/* Examples */}
      {expanded && s.examples && s.examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ejemplos</p>
          {s.examples.slice(0, 2).map((ex, i) => {
            if (typeof ex === 'string') {
              return (
                <div key={i} className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                  {ex}
                </div>
              );
            }
            const r = ex as Record<string, string>;
            const userText = r.user || r.usuario || r.CLIENTE || r.cliente || r.message || r.input || '';
            const botText  = r.bot  || r.BOT || r.respuesta || r.response || r.output || '';
            return (
              <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs">
                {userText && <p><span className="text-muted-foreground font-medium">Usuario: </span>{userText}</p>}
                {botText  && <p><span className="text-muted-foreground font-medium">Bot: </span>{botText}</p>}
                {!userText && !botText && (
                  <pre className="text-muted-foreground whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reason + conflict detail */}
      {expanded && (s.reason || s.conflict_reason) && (
        <div className="space-y-1">
          {s.reason && <p className="text-xs text-muted-foreground italic">{s.reason}</p>}
          {s.conflict_reason && (
            <p className="text-xs text-destructive/80 italic">Conflicto: {s.conflict_reason}</p>
          )}
        </div>
      )}

      {/* Data support footer */}
      {(s.data_support?.occurrences || s.data_support?.conversations_analyzed) && (
        <p className="text-[11px] text-muted-foreground">
          {s.data_support.occurrences ? `${s.data_support.occurrences} ocurrencias` : ''}
          {s.data_support.occurrences && s.data_support.conversations_analyzed ? ' · ' : ''}
          {s.data_support.conversations_analyzed ? `${s.data_support.conversations_analyzed} conversaciones analizadas` : ''}
        </p>
      )}

      {/* A5 — created_at footer */}
      {s.created_at && (
        <p className="text-[11px] text-muted-foreground">
          Generada {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: es })}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {/* Rechazar con razón (Dialog) */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="flex-none text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isLoading}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Rechazar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar mejora</DialogTitle>
              <DialogDescription>
                Podés dejar una razón opcional para que el analyzer aprenda del rechazo.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Razón del rechazo (opcional)…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="min-h-[80px]"
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => rejectMut.mutate()}
                disabled={rejectMut.isPending}
              >
                {rejectMut.isPending ? 'Rechazando…' : 'Confirmar rechazo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* A1 — Aprobar: con confirmación si has_conflict || requires_code_change */}
        <Button
          size="sm"
          variant="default"
          className="flex-1"
          onClick={handleApproveClick}
          disabled={isLoading}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          {approveMutation.isPending
            ? 'Aprobando…'
            : isEdited
              ? 'Aprobar con cambios'
              : 'Aprobar'}
        </Button>
      </div>

      {/* A1 — conflict warning AlertDialog (uncontrolled trigger not used; controlled via state) */}
      <AlertDialog open={conflictWarningOpen} onOpenChange={setConflictWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aprobación</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Esta sugerencia tiene los siguientes flags activos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {s.has_conflict && <li className="text-destructive">Conflicto detectado</li>}
                  {s.requires_code_change && <li className="text-warning">Requiere cambio de código</li>}
                </ul>
                <p>¿Querés aprobarla de todas formas?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConflictWarningOpen(false);
                approveMutation.mutate();
              }}
            >
              Aprobar igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── MutationCard ──────────────────────────────────────────────────────────────

function MutationCard({ m }: { m: Mutation }) {
  const qc = useQueryClient();

  const deactivateMut = useMutation({
    mutationFn: () => deactivateMutation(m.id),
    onSuccess: () => {
      toast.success('Mutación desactivada');
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.mutations });
    },
    onError: (e: Error) => toast.error('No se pudo desactivar', { description: e.message }),
  });

  const content = getSuggestionContent(m);

  return (
    // A8 — hover state
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-foreground/70 bg-muted px-2 py-0.5 rounded-full border border-border">
            {TYPE_LABELS[m.type] || m.type}
          </span>
          <span className="text-xs text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full">
            {m.uses} usos
          </span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              disabled={deactivateMut.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desactivar esta mutación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta mutación se usó <strong>{m.uses} {m.uses === 1 ? 'vez' : 'veces'}</strong>.
                Si la desactivás, el bot dejará de usarla. Esta acción no se puede deshacer fácilmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deactivateMut.mutate()}
              >
                Desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          Activada {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es })}
        </p>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
      <div className="h-16 bg-muted rounded mb-3" />
      <div className="h-8 bg-muted rounded" />
    </div>
  );
}

// ── MejorasView ───────────────────────────────────────────────────────────────

type Tab = 'pendientes' | 'activas';

export function MejorasView() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('pendientes');
  const [analyzing, setAnalyzing] = useState(false);

  // A2 — filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterConflict, setFilterConflict] = useState(false);

  // B1 — bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  // Bug #1 — bulk conflict warning dialog
  const [bulkWarningOpen, setBulkWarningOpen] = useState(false);
  const [pendingBulkIds, setPendingBulkIds] = useState<string[]>([]);

  // B2 — view mode
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // B3 — keyboard focused index
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const statsQuery = useQuery({
    queryKey: IMPROVEMENT_QUERY_KEYS.stats,
    queryFn: fetchImprovementStats,
    refetchOnWindowFocus: true,
  });

  const suggestionsQuery = useQuery({
    queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending'),
    queryFn: () => fetchSuggestions('pending'),
    refetchOnWindowFocus: true,
  });

  const mutationsQuery = useQuery({
    queryKey: IMPROVEMENT_QUERY_KEYS.mutations,
    queryFn: fetchMutations,
    refetchOnWindowFocus: true,
  });

  const stats = statsQuery.data;
  const rawSuggestions = suggestionsQuery.data?.suggestions ?? [];
  const mutations = mutationsQuery.data?.mutations ?? [];
  const loading = suggestionsQuery.isLoading || mutationsQuery.isLoading || statsQuery.isLoading;

  // A2 — filter + sort suggestions
  const suggestions = rawSuggestions
    .filter(s => filterType === 'all' || s.type === filterType)
    .filter(s => filterPriority === 'all' || s.priority === filterPriority)
    .filter(s => !filterConflict || s.has_conflict)
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority ?? 'low'] ?? 2;
      const pb = PRIORITY_ORDER[b.priority ?? 'low'] ?? 2;
      return pa - pb;
    });

  // B1 — toggle select
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bug #3 — only operate on visible (filtered) ids
  const getVisibleSelectedIds = () => {
    const visibleIds = new Set(suggestions.map(s => s.id));
    return [...selectedIds].filter(id => visibleIds.has(id));
  };

  // Bug #1/#2/#3/#4/#13 — bulk approve with conflict check, partial failure reporting, undo
  const executeBulkApprove = async (ids: string[]) => {
    setBulkProcessing(true);
    const results = await Promise.allSettled(ids.map(id => approveSuggestion(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const ok = ids.length - failed;
    await Promise.all([
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats }),
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') }),
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.mutations }),
    ]);
    setSelectedIds(new Set());
    setBulkProcessing(false);
    if (failed > 0) {
      toast.warning(`${ok} aprobadas, ${failed} fallaron`);
    } else {
      toast.success(`${ok} mejoras aprobadas`, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            await Promise.allSettled(ids.map(id => rollbackMutation(id)));
            qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats });
            qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') });
            qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.mutations });
          },
        },
        duration: 5000,
      });
    }
  };

  const handleBulkApprove = () => {
    const ids = getVisibleSelectedIds();
    if (ids.length === 0) return;
    // Bug #1 — check for flagged suggestions
    const flaggedCount = ids.filter(id => {
      const s = rawSuggestions.find(s => s.id === id);
      return s && (s.has_conflict || s.requires_code_change);
    }).length;
    if (flaggedCount > 0) {
      setPendingBulkIds(ids);
      setBulkWarningOpen(true);
    } else {
      executeBulkApprove(ids);
    }
  };

  // Bug #2/#3/#4 — bulk reject with partial failure reporting
  const handleBulkReject = async () => {
    const ids = getVisibleSelectedIds();
    if (ids.length === 0) return;
    setBulkProcessing(true);
    const results = await Promise.allSettled(ids.map(id => rejectSuggestion(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const ok = ids.length - failed;
    await Promise.all([
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats }),
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') }),
      qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.mutations }),
    ]);
    setSelectedIds(new Set());
    setBulkProcessing(false);
    if (failed > 0) {
      toast.warning(`${ok} rechazadas, ${failed} fallaron`);
    } else {
      toast.success(`${ok} mejoras rechazadas`);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await triggerAnalysis();
      const analyzed = result.conversations_analyzed ?? result.summary?.total_conversations ?? 0;
      if (analyzed === 0) {
        toast.info('Sin conversaciones nuevas para analizar');
      } else {
        toast.success('Análisis completado', { description: `${analyzed} conversaciones analizadas` });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.stats }),
        qc.invalidateQueries({ queryKey: IMPROVEMENT_QUERY_KEYS.suggestions('pending') }),
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast.error('Error al lanzar análisis', { description: msg });
    } finally {
      setAnalyzing(false);
    }
  };

  // B3 — keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if typing in an input/textarea
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (tab !== 'pendientes' || suggestions.length === 0) return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (prev === null) return 0;
          return Math.min(prev + 1, suggestions.length - 1);
        });
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (prev === null) return suggestions.length - 1;
          return Math.max(prev - 1, 0);
        });
        break;
      case 'Escape':
        setFocusedIndex(null);
        break;
      default:
        break;
    }
  }, [tab, suggestions.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Bug #3/#7 — reset focused index and selection when filters/tab/viewMode change
  useEffect(() => {
    setFocusedIndex(null);
    setSelectedIds(new Set());
  }, [tab, filterType, filterPriority, filterConflict, viewMode]);

  // Bug #6 — clamp focusedIndex if suggestions shrink (e.g. after bulk action)
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= suggestions.length) {
      setFocusedIndex(suggestions.length > 0 ? suggestions.length - 1 : null);
    }
  }, [suggestions.length, focusedIndex]);

  return (
    <div className={cn("space-y-6", selectedIds.size > 0 && "pb-24")}>
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
          title="Dispara análisis con IA (consume créditos GPT-4o)"
        >
          <RefreshCw className={cn('mr-2 h-3.5 w-3.5', analyzing && 'animate-spin')} />
          {analyzing ? 'Analizando…' : 'Analizar ahora'}
        </Button>
      </div>

      {/* Stats — skeleton while loading, then real data */}
      {statsQuery.isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-5 w-5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {/* Pendientes — clickable */}
          <button
            type="button"
            onClick={() => setTab('pendientes')}
            className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-colors text-left w-full"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pendientes</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">{stats.pending_suggestions}</p>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </button>
          {/* Activas — clickable */}
          <button
            type="button"
            onClick={() => setTab('activas')}
            className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-colors text-left w-full"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Activas</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">{stats.active_mutations}</p>
              <Zap className="h-5 w-5 text-secondary" />
            </div>
          </button>
          {/* Aprobadas */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Aprobadas</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">{stats.approved_total}</p>
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          </div>
          {/* A6 — Tasa aprobación con TrendingUp */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tasa aprobación</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">{Math.round(stats.approval_rate ?? 0)}%</p>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs + B2 view mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1 w-fit">
          {(['pendientes', 'activas'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'pendientes'
                ? `Pendientes${rawSuggestions.length > 0
                    ? (suggestions.length === rawSuggestions.length
                        ? ` (${rawSuggestions.length})`
                        : ` (${suggestions.length}/${rawSuggestions.length})`)
                    : ''}`
                : `Activas${mutations.length > 0 ? ` (${mutations.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* B2 — view mode toggle (only on pendientes) */}
        {tab === 'pendientes' && (
          <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              title="Vista de cards"
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'card' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista de lista"
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* A2 — Filter bar (pendientes only) */}
      {tab === 'pendientes' && rawSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-muted/20 border border-border/50 rounded-lg px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">Filtros</span>

          {/* Type select */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm bg-card border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-border"
          >
            <option value="all">Todos los tipos</option>
            <option value="cached_response">Respuesta cacheada</option>
            <option value="objection_handler">Manejo de objeción</option>
            <option value="prompt_addition">Adición al prompt</option>
            <option value="failed_response">Respuesta fallida</option>
          </select>

          {/* Priority select */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-sm bg-card border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-border"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          {/* Conflict toggle */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterConflict}
              onChange={e => setFilterConflict(e.target.checked)}
              className="accent-primary"
            />
            Solo conflictos
          </label>

          {/* Reset */}
          {(filterType !== 'all' || filterPriority !== 'all' || filterConflict) && (
            <button
              onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterConflict(false); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-auto"
            >
              Limpiar filtros
            </button>
          )}

          {/* Result count */}
          {suggestions.length !== rawSuggestions.length && (
            <span className="text-xs text-muted-foreground ml-auto">
              {suggestions.length} de {rawSuggestions.length}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : tab === 'pendientes' ? (
        suggestions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-secondary opacity-60" />
            <p className="text-foreground font-medium">
              {rawSuggestions.length > 0 ? 'Sin resultados para los filtros aplicados' : 'Todo revisado'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {rawSuggestions.length > 0
                ? 'Probá cambiando los filtros.'
                : 'No hay sugerencias pendientes. Usá "Analizar ahora" para buscar nuevas.'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          // B2 — List mode
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {suggestions.map((s, idx) => (
              <SuggestionCard
                key={s.id}
                s={s}
                listMode
                selected={selectedIds.has(s.id)}
                onToggleSelect={handleToggleSelect}
                isFocused={focusedIndex === idx}
              />
            ))}
          </div>
        ) : (
          // Card mode
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((s, idx) => (
              <SuggestionCard
                key={s.id}
                s={s}
                selected={selectedIds.has(s.id)}
                onToggleSelect={handleToggleSelect}
                isFocused={focusedIndex === idx}
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
              <MutationCard key={m.id} m={m} />
            ))}
          </div>
        )
      )}

      {/* B1 — Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} seleccionadas</span>
          <Button
            size="sm"
            variant="default"
            onClick={handleBulkApprove}
            disabled={bulkProcessing}
          >
            {bulkProcessing ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            )}
            Aprobar todas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleBulkReject}
            disabled={bulkProcessing}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Rechazar todas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkProcessing}
          >
            Limpiar
          </Button>
        </div>
      )}

      {/* Bug #1 — Bulk conflict warning dialog */}
      <AlertDialog open={bulkWarningOpen} onOpenChange={setBulkWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aprobación masiva</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {(() => {
                  const flaggedCount = pendingBulkIds.filter(id => {
                    const s = rawSuggestions.find(s => s.id === id);
                    return s && (s.has_conflict || s.requires_code_change);
                  }).length;
                  const conflictCount = pendingBulkIds.filter(id => {
                    const s = rawSuggestions.find(s => s.id === id);
                    return s && s.has_conflict;
                  }).length;
                  const codeCount = pendingBulkIds.filter(id => {
                    const s = rawSuggestions.find(s => s.id === id);
                    return s && s.requires_code_change;
                  }).length;
                  return (
                    <>
                      <div>{flaggedCount} de las {pendingBulkIds.length} seleccionadas tienen flags activos (conflictos o requieren código).</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {conflictCount > 0 && <li className="text-destructive">{conflictCount} con conflicto detectado</li>}
                        {codeCount > 0 && <li className="text-warning">{codeCount} que requieren cambio de código</li>}
                      </ul>
                      <div>¿Querés aprobar todas igual?</div>
                    </>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setBulkWarningOpen(false); setPendingBulkIds([]); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBulkWarningOpen(false);
                executeBulkApprove(pendingBulkIds);
                setPendingBulkIds([]);
              }}
            >
              Aprobar igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
