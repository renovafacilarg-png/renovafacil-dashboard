import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Brain,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Lightbulb,
  MessageSquare,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Check,
  X,
  CheckSquare,
  Square,
  Loader2,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  HelpCircle,
  UserX,
  Zap,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  fetchImprovementStats,
  fetchSuggestions,
  fetchMutations,
  approveSuggestion,
  rejectSuggestion,
  triggerAnalysis,
  deactivateMutation,
  rollbackMutation,
  fetchOutcomes,
  fetchImpact,
  type ImprovementStats,
  type Suggestion,
  type Mutation,
  type OutcomesResponse,
  type ImpactResponse,
} from '@/lib/api';

const suggestionTypeConfig = {
  cached_response: {
    icon: MessageSquare,
    label: 'Respuesta Cacheada',
    color: 'bg-blue-50 text-blue-700',
    description: 'Pregunta frecuente que puede responderse automáticamente'
  },
  objection_handler: {
    icon: AlertTriangle,
    label: 'Manejo de Objeción',
    color: 'bg-blue-50 text-blue-700',
    description: 'Objeción del cliente que no se manejó correctamente'
  },
  prompt_addition: {
    icon: FileText,
    label: 'Info del Producto',
    color: 'bg-violet-50 text-violet-700',
    description: 'Información faltante que el bot debería conocer'
  },
  failed_response: {
    icon: XCircle,
    label: 'Respuesta Fallida',
    color: 'bg-red-50 text-red-600',
    description: 'Error o respuesta confusa que debe evitarse'
  }
};

const priorityConfig = {
  high: { label: 'Alta', color: 'bg-red-50 text-red-700' },
  medium: { label: 'Media', color: 'bg-amber-50 text-amber-700' },
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-600' }
};

const hierarchyConfig = {
  1: { label: 'Bajo riesgo', color: 'bg-emerald-50 text-emerald-700', title: 'Cambio de bajo riesgo: respuesta cacheada o adición al prompt' },
  2: { label: 'Riesgo moderado', color: 'bg-amber-50 text-amber-700', title: 'Cambio de riesgo moderado: manejo de objeción o respuesta fallida' },
  3: { label: 'Alto riesgo', color: 'bg-red-50 text-red-700', title: 'Cambio de alto riesgo: requiere modificación de código' },
};

const targetComponentConfig: Record<string, { label: string; color: string }> = {
  system_prompt: { label: 'Prompt', color: 'bg-violet-50 text-violet-700' },
  dynamic_config: { label: 'Config', color: 'bg-blue-50 text-blue-700' },
  code_abandoned_carts: { label: 'Carritos', color: 'bg-amber-50 text-amber-700' },
  code_app: { label: 'Código', color: 'bg-gray-100 text-gray-600' },
  code_proactive_notifications: { label: 'Notif.', color: 'bg-blue-50 text-blue-700' },
  code_other: { label: 'Código', color: 'bg-gray-100 text-gray-600' },
};

export function SelfImprovementView() {
  const [stats, setStats] = useState<ImprovementStats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'outcomes'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  // Outcomes state
  const [outcomes, setOutcomes] = useState<OutcomesResponse | null>(null);
  const [outcomesDate, setOutcomesDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  // Impact state
  const [impactData, setImpactData] = useState<ImpactResponse | null>(null);
  const [impactTarget, setImpactTarget] = useState<string | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  // Dialog states
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, suggestionsData, mutationsData] = await Promise.all([
        fetchImprovementStats(),
        fetchSuggestions(),
        fetchMutations()
      ]);
      setStats(statsData);
      setSuggestions(suggestionsData.suggestions || []);
      setMutations(mutationsData.mutations || []);
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error al cargar datos'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOutcomes = async (date?: string) => {
    try {
      setOutcomesLoading(true);
      const data = await fetchOutcomes(date);
      setOutcomes(data);
    } catch (error) {
      toast.error(`Error al cargar outcomes: ${error instanceof Error ? error.message : 'Error'}`);
    } finally {
      setOutcomesLoading(false);
    }
  };

  const loadImpact = async (suggestionId: string) => {
    try {
      setImpactLoading(true);
      setImpactTarget(suggestionId);
      setImpactData(null);
      const data = await fetchImpact(suggestionId);
      setImpactData(data);
    } catch {
      toast.error('Sin datos suficientes para medir impacto (se necesitan 7 días antes y después)');
      setImpactTarget(null);
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'outcomes') loadOutcomes(outcomesDate);
  }, [activeTab]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      toast.info('Iniciando análisis multi-canal (WA, Messenger, IG, comentarios FB/IG)...');
      const result = await triggerAnalysis();
      if (result.success) {
        const convs = result.conversations_analyzed ?? 0;
        const fbComments = result.fb_comments_analyzed ?? 0;
        const sugs = result.suggestions?.length ?? 0;
        const sourceLabel = fbComments > 0
          ? `${convs} conv + ${fbComments} comentarios FB/IG`
          : `${convs} conversaciones`;
        toast.success(`Análisis completado: ${sugs} sugerencias (${sourceLabel})`);
        loadData();
      } else {
        toast.error(result.message || 'Error en el análisis');
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async (suggestionId: string, edited?: string) => {
    try {
      const result = await approveSuggestion(suggestionId, edited);
      if (result.success) {
        toast.success('Sugerencia aprobada y aplicada');
        setEditingSuggestion(null);
        loadData();
      } else {
        toast.error(result.message || 'Error al aprobar');
      }
    } catch {
      toast.error('Error al aprobar la sugerencia');
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      const result = await rejectSuggestion(suggestionId);
      if (result.success) {
        toast.success('Sugerencia rechazada');
        loadData();
      } else {
        toast.error(result.message || 'Error al rechazar');
      }
    } catch {
      toast.error('Error al rechazar la sugerencia');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      const result = await deactivateMutation(deactivateTarget);
      if (result.success) {
        toast.success('Mejora desactivada');
        loadData();
      } else {
        toast.error(result.message || 'Error al desactivar');
      }
    } catch {
      toast.error('Error al desactivar la mejora');
    } finally {
      setDeactivateTarget(null);
    }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    try {
      const result = await rollbackMutation(rollbackTarget);
      if (result.success) {
        toast.success('Mejora revertida correctamente');
        loadData();
      } else {
        toast.error(result.message || 'Error al revertir');
      }
    } catch {
      toast.error('Error al revertir la mejora');
    } finally {
      setRollbackTarget(null);
    }
  };

  const startEditing = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion.id);
    const content = suggestion.suggested_response || suggestion.content || suggestion.rule || '';
    setEditedContent(content);
  };

  const getEditableContent = (suggestion: Suggestion): string => {
    return suggestion.suggested_response || suggestion.content || suggestion.rule || '';
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map(s => s.id)));
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;
    setBulkConfirmOpen(true);
  };

  const confirmBulkApprove = async () => {
    setBulkConfirmOpen(false);
    const approvableIds = [...selectedIds];
    setBulkApproving(true);
    let approved = 0;
    let failed = 0;

    for (const id of approvableIds) {
      try {
        const result = await approveSuggestion(id);
        if (result.success) approved++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setBulkApproving(false);
    setSelectedIds(new Set());

    if (approved > 0) toast.success(`${approved} sugerencias aprobadas`);
    if (failed > 0) toast.error(`${failed} fallaron`);

    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Desactivar mejora
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés desactivar esta mejora activa? El bot dejará de usarla inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeactivate}>Desactivar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={!!rollbackTarget} onOpenChange={(open) => { if (!open) setRollbackTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              Revertir mejora
            </DialogTitle>
            <DialogDescription>
              ¿Revertir esta mejora aprobada? El bot volverá a su comportamiento anterior. Esta acción registrará el rollback en el historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackTarget(null)}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleRollback}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Revertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Confirmation Dialog */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Aprobar {selectedIds.size} sugerencias
            </DialogTitle>
            <DialogDescription>
              Vas a aplicar {selectedIds.size} cambio{selectedIds.size !== 1 ? 's' : ''} al bot simultáneamente. Revisá que las sugerencias seleccionadas sean correctas antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmBulkApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprobar todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impact Dialog */}
      <Dialog open={!!impactTarget} onOpenChange={(open) => { if (!open) { setImpactTarget(null); setImpactData(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-violet-500" />
              Impacto de la mejora
            </DialogTitle>
            <DialogDescription>
              Comparación de métricas 7 días antes vs 7 días después de aprobar la sugerencia.
            </DialogDescription>
          </DialogHeader>
          {impactLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Midiendo impacto...
            </div>
          )}
          {!impactLoading && impactData && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Aprobada el {new Date(impactData.approval_date).toLocaleDateString('es-AR')}
              </p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {Object.entries(impactData.impact_pct).map(([key, pct]) => {
                  const before = impactData.before[key] ?? 0;
                  const after = impactData.after[key] ?? 0;
                  const positive = pct >= 0;
                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-3 bg-white">
                      <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{before.toFixed(1)} → {after.toFixed(1)}</span>
                        <span className={`flex items-center gap-1 font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                          {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {positive ? '+' : ''}{pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImpactTarget(null); setImpactData(null); }}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-violet-500" />
            Auto-Mejoras
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            El bot aprende de las conversaciones y sugiere mejoras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="text-gray-500">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing} size="sm" className="bg-primary text-white hover:bg-primary/90">
            <Play className={`mr-2 h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? 'Analizando...' : 'Analizar Ahora'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pendientes</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_suggestions}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Mejoras Activas</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.active_mutations}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Aprobadas</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved_total}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tasa Aprobación</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approval_rate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-md transition-colors',
            activeTab === 'pending'
              ? 'bg-white shadow-sm text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Sugerencias Pendientes ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-md transition-colors',
            activeTab === 'active'
              ? 'bg-white shadow-sm text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Mejoras Activas ({mutations.length})
        </button>
        <button
          onClick={() => setActiveTab('outcomes')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-md transition-colors',
            activeTab === 'outcomes'
              ? 'bg-white shadow-sm text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Outcomes del Día
        </button>
      </div>

      {/* Pending Suggestions */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-lg text-gray-900 mb-2">No hay sugerencias pendientes</h3>
              <p className="text-sm text-gray-500 mb-4">
                Hacé clic en "Analizar Ahora" para generar sugerencias basadas en las conversaciones del día
              </p>
              <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="bg-primary text-white hover:bg-primary/90">
                <Play className="mr-2 h-4 w-4" />
                Analizar Conversaciones
              </Button>
            </div>
          ) : (
            <>
              {/* Barra de acciones en lote */}
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {selectedIds.size === suggestions.length ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                    {selectedIds.size === suggestions.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="text-sm text-gray-500">
                      ({selectedIds.size} seleccionadas)
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleBulkApprove}
                  disabled={selectedIds.size === 0 || bulkApproving}
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {bulkApproving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {bulkApproving ? 'Aprobando...' : `Aprobar ${selectedIds.size > 0 ? `(${selectedIds.size})` : 'seleccionadas'}`}
                </Button>
              </div>

              {suggestions.map((suggestion) => {
              const typeConfig = suggestionTypeConfig[suggestion.type as keyof typeof suggestionTypeConfig] || suggestionTypeConfig.cached_response;
              const prioConfig = priorityConfig[suggestion.priority as keyof typeof priorityConfig] || priorityConfig.medium;
              const Icon = typeConfig.icon;
              const isExpanded = expandedSuggestion === suggestion.id;
              const isEditing = editingSuggestion === suggestion.id;
              const isSelected = selectedIds.has(suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  className={cn(
                    'bg-white border border-gray-200 rounded-xl p-5 space-y-3 transition-colors',
                    isSelected && 'border-primary/40 bg-primary/5'
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Checkbox de selección */}
                      <button
                        onClick={() => toggleSelection(suggestion.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.color.split(' ')[0])}>
                        <Icon className={cn('h-4 w-4', typeConfig.color.split(' ')[1])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', typeConfig.color)}>
                            {typeConfig.label}
                          </span>
                          <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', prioConfig.color)}>
                            {prioConfig.label}
                          </span>
                          {suggestion.hierarchy_level && (() => {
                            const hc = hierarchyConfig[suggestion.hierarchy_level];
                            return (
                              <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', hc.color)} title={hc.title}>
                                {hc.label}
                              </span>
                            );
                          })()}
                          {suggestion.target_component && (() => {
                            const tc = targetComponentConfig[suggestion.target_component] || { label: suggestion.target_component, color: 'bg-gray-100 text-gray-600' };
                            return (
                              <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', tc.color)}>
                                {tc.label}
                              </span>
                            );
                          })()}
                          {suggestion.requires_code_change && (
                            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                              Requiere código
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {suggestion.reason || typeConfig.description}
                        </p>
                        {suggestion.has_conflict && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span>Posible conflicto con mejoras activas: {suggestion.conflict_reason || 'revisar antes de aprobar'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(suggestion.id)}
                        className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        title="Rechazar"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(suggestion.id)}
                        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                        title={suggestion.requires_code_change ? 'Marcar como resuelto' : 'Aprobar'}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                        className="h-8 w-8 p-0 text-gray-500"
                        title="Ver detalles"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Preview */}
                  {!isExpanded && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 line-clamp-2">
                      {getEditableContent(suggestion)}
                    </p>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 pt-1">
                      {/* Patterns/Triggers */}
                      {(suggestion.patterns || suggestion.triggers) && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">
                            {suggestion.patterns ? 'Patrones detectados:' : 'Disparadores:'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(suggestion.patterns || suggestion.triggers || []).map((p, i) => (
                              <span key={i} className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-600">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response/Content */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          {suggestion.type === 'failed_response' ? 'Regla sugerida:' : 'Respuesta sugerida:'}
                        </p>
                        {isEditing ? (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[100px] bg-gray-50 border-gray-200 focus:ring-primary/30 text-sm rounded-lg"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                            {getEditableContent(suggestion)}
                          </p>
                        )}
                      </div>

                      {/* Examples */}
                      {suggestion.examples && suggestion.examples.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">
                            Ejemplos de conversaciones:
                          </p>
                          <div className="space-y-2">
                            {suggestion.examples.slice(0, 3).map((ex, i) => (
                              <div key={i} className="border-l-2 border-gray-200 pl-3 space-y-1">
                                <p className="text-sm text-gray-700"><span className="font-medium">Cliente:</span> {ex.user}</p>
                                <p className="text-sm text-gray-700"><span className="font-medium">Bot:</span> {ex.bot}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSuggestion(null)}
                              className="text-gray-500"
                            >
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => handleApprove(suggestion.id, editedContent)}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Guardar y Aprobar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(suggestion.id)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Rechazar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(suggestion)}
                              className="text-gray-500"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => handleApprove(suggestion.id)}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              {suggestion.requires_code_change ? 'Marcar como resuelto' : 'Aprobar'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>
      )}

      {/* Active Mutations */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {mutations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-lg text-gray-900 mb-2">No hay mejoras activas</h3>
              <p className="text-sm text-gray-500">
                Cuando apruebes sugerencias, aparecerán aquí como mejoras activas
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {mutations.map((mutation) => {
                const typeConfig = suggestionTypeConfig[mutation.type as keyof typeof suggestionTypeConfig] || suggestionTypeConfig.cached_response;
                const Icon = typeConfig.icon;

                return (
                  <div key={mutation.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.color.split(' ')[0])}>
                        <Icon className={cn('h-4 w-4', typeConfig.color.split(' ')[1])} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', typeConfig.color)}>
                            {typeConfig.label}
                          </span>
                          {mutation.uses > 0 && (
                            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              {mutation.uses} usos
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {mutation.response || mutation.content || mutation.rule ||
                           (mutation.patterns && mutation.patterns[0]) ||
                           (mutation.triggers && mutation.triggers[0])}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-400 mr-2">
                        {mutation.created_at ? new Date(mutation.created_at).toLocaleDateString() : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRollbackTarget(mutation.id)}
                        className="text-gray-500 hover:bg-amber-50 h-8 w-8 p-0"
                        title="Revertir esta mejora"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadImpact(mutation.id)}
                        className="text-gray-500 hover:bg-violet-50 h-8 w-8 p-0"
                        title="Ver impacto en métricas"
                      >
                        <BarChart2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeactivateTarget(mutation.id)}
                        className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        title="Desactivar esta mejora"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Outcomes Tab */}
      {activeTab === 'outcomes' && (
        <div className="space-y-6">
          {/* Date picker + refresh */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={outcomesDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setOutcomesDate(e.target.value);
                loadOutcomes(e.target.value);
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadOutcomes(outcomesDate)}
              disabled={outcomesLoading}
              className="text-gray-500"
            >
              <RefreshCw className={`h-4 w-4 ${outcomesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {outcomesLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Cargando outcomes...
            </div>
          ) : !outcomes || Object.keys(outcomes.outcomes).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <BarChart2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-lg text-gray-900 mb-2">Sin datos para esta fecha</h3>
              <p className="text-sm text-gray-500">
                Los outcomes se calculan durante el análisis nocturno de conversaciones.
              </p>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    key: 'sale',
                    label: 'Ventas',
                    icon: ShoppingCart,
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    description: 'Conversaciones que terminaron en compra',
                  },
                  {
                    key: 'support',
                    label: 'Soporte',
                    icon: HelpCircle,
                    iconBg: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    description: 'Consultas de pedidos o post-venta',
                  },
                  {
                    key: 'abandoned',
                    label: 'Abandonados',
                    icon: UserX,
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    description: 'Interés pero sin cierre',
                  },
                  {
                    key: 'quick_exit',
                    label: 'Salida rápida',
                    icon: Zap,
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-500',
                    description: 'Conversaciones muy cortas sin interacción real',
                  },
                ].map(({ key, label, icon: Icon, iconBg, iconColor, description }) => {
                  const value = outcomes.outcomes[key] ?? 0;
                  const total = Object.values(outcomes.outcomes).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 1;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={key} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                          <Icon className={cn('h-4 w-4', iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{pct}% del total</p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de distribución */}
              {(() => {
                const total = Object.values(outcomes.outcomes).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
                if (total === 0) return null;
                const segments = [
                  { key: 'sale', color: 'bg-emerald-500', label: 'Ventas' },
                  { key: 'support', color: 'bg-blue-400', label: 'Soporte' },
                  { key: 'abandoned', color: 'bg-amber-400', label: 'Abandonados' },
                  { key: 'quick_exit', color: 'bg-gray-400', label: 'Salida rápida' },
                ];
                return (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-sm font-medium text-gray-900 mb-4">
                      Distribución del día — {total} conversaciones
                    </p>
                    <div className="flex rounded-full overflow-hidden h-4 gap-px">
                      {segments.map(({ key, color }) => {
                        const val = outcomes.outcomes[key] ?? 0;
                        const pct = (val / total) * 100;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={key}
                            className={`${color} transition-all`}
                            style={{ width: `${pct}%` }}
                            title={`${key}: ${val}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {segments.map(({ key, color, label }) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className={`w-2 h-2 rounded-full ${color}`} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
