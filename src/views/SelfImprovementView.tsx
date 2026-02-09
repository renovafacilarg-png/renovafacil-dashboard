import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchImprovementStats,
  fetchSuggestions,
  fetchMutations,
  approveSuggestion,
  rejectSuggestion,
  triggerAnalysis,
  deactivateMutation,
  type ImprovementStats,
  type Suggestion,
  type Mutation
} from '@/lib/api';

const suggestionTypeConfig = {
  cached_response: {
    icon: MessageSquare,
    label: 'Respuesta Cacheada',
    color: 'bg-blue-100 text-blue-800',
    description: 'Pregunta frecuente que puede responderse automáticamente'
  },
  objection_handler: {
    icon: AlertTriangle,
    label: 'Manejo de Objeción',
    color: 'bg-amber-100 text-amber-800',
    description: 'Objeción del cliente que no se manejó correctamente'
  },
  prompt_addition: {
    icon: FileText,
    label: 'Info del Producto',
    color: 'bg-green-100 text-green-800',
    description: 'Información faltante que el bot debería conocer'
  },
  failed_response: {
    icon: XCircle,
    label: 'Respuesta Fallida',
    color: 'bg-red-100 text-red-800',
    description: 'Error o respuesta confusa que debe evitarse'
  }
};

const priorityConfig = {
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
  medium: { label: 'Media', color: 'bg-amber-100 text-amber-800' },
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' }
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
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  const loadData = async () => {
    console.log('📊 Cargando datos de auto-mejora...');
    try {
      setLoading(true);
      const [statsData, suggestionsData, mutationsData] = await Promise.all([
        fetchImprovementStats(),
        fetchSuggestions(),
        fetchMutations()
      ]);
      console.log('📈 Stats:', statsData);
      console.log('💡 Sugerencias:', suggestionsData);
      console.log('🔧 Mutaciones:', mutationsData);
      setStats(statsData);
      setSuggestions(suggestionsData.suggestions || []);
      setMutations(mutationsData.mutations || []);
    } catch (error) {
      console.error('💥 Error cargando datos:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error al cargar datos'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = async () => {
    console.log('🔍 Iniciando análisis...');
    try {
      setAnalyzing(true);
      toast.info('Iniciando análisis de conversaciones...');
      console.log('📡 Llamando API...');
      const result = await triggerAnalysis();
      console.log('📥 Resultado:', result);
      if (result.success) {
        toast.success(`Análisis completado: ${result.suggestions?.length || 0} sugerencias generadas`);
        loadData();
      } else {
        console.error('❌ Error en resultado:', result);
        toast.error(result.message || 'Error en el análisis');
      }
    } catch (error) {
      console.error('💥 Error en análisis:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setAnalyzing(false);
      console.log('✅ Análisis finalizado');
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
    } catch (error) {
      console.error('Error:', error);
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
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al rechazar la sugerencia');
    }
  };

  const handleDeactivate = async (mutationId: string) => {
    if (!confirm('¿Estás seguro de desactivar esta mejora?')) return;

    try {
      const result = await deactivateMutation(mutationId);
      if (result.success) {
        toast.success('Mejora desactivada');
        loadData();
      } else {
        toast.error(result.message || 'Error al desactivar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al desactivar la mejora');
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

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    setBulkApproving(true);
    let approved = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const result = await approveSuggestion(id);
        if (result.success) {
          approved++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setBulkApproving(false);
    setSelectedIds(new Set());

    if (approved > 0) {
      toast.success(`${approved} sugerencias aprobadas`);
    }
    if (failed > 0) {
      toast.error(`${failed} fallaron`);
    }

    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-violet-500" />
            Auto-Mejoras
          </h1>
          <p className="text-muted-foreground">
            El bot aprende de las conversaciones y sugiere mejoras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing} className="bg-violet-600 hover:bg-violet-700">
            <Play className={`mr-2 h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? 'Analizando...' : 'Analizar Ahora'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_suggestions}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_mutations}</p>
                  <p className="text-sm text-muted-foreground">Mejoras Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved_total}</p>
                  <p className="text-sm text-muted-foreground">Total Aprobadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approval_rate}%</p>
                  <p className="text-sm text-muted-foreground">Tasa Aprobación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sugerencias Pendientes ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mejoras Activas ({mutations.length})
        </button>
      </div>

      {/* Pending Suggestions */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">No hay sugerencias pendientes</h3>
                <p className="text-muted-foreground mb-4">
                  Hacé clic en "Analizar Ahora" para generar sugerencias basadas en las conversaciones del día
                </p>
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  <Play className="mr-2 h-4 w-4" />
                  Analizar Conversaciones
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Barra de acciones en lote */}
              <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 text-sm font-medium hover:text-violet-700 transition-colors"
                  >
                    {selectedIds.size === suggestions.length ? (
                      <CheckSquare className="h-5 w-5 text-violet-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    {selectedIds.size === suggestions.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({selectedIds.size} seleccionadas)
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleBulkApprove}
                  disabled={selectedIds.size === 0 || bulkApproving}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
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
                <Card key={suggestion.id} className={`overflow-hidden transition-colors ${isSelected ? 'ring-2 ring-violet-500 bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {/* Checkbox de selección */}
                        <button
                          onClick={() => toggleSelection(suggestion.id)}
                          className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-violet-600" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground hover:text-violet-500" />
                          )}
                        </button>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color.replace('text-', 'bg-').replace('-800', '-200')}`}>
                          <Icon className={`h-5 w-5 ${typeConfig.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="secondary" className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                            <Badge variant="outline" className={prioConfig.color}>
                              {prioConfig.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {suggestion.reason || typeConfig.description}
                          </CardDescription>
                        </div>
                      </div>
                      {/* Botones de acción rápida */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(suggestion.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          title="Rechazar"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(suggestion.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                          title="Aprobar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                          className="h-8 w-8 p-0"
                          title="Ver detalles"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Preview */}
                    {!isExpanded && (
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="line-clamp-2">
                          {getEditableContent(suggestion)}
                        </p>
                      </div>
                    )}

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="space-y-4">
                        {/* Patterns/Triggers */}
                        {(suggestion.patterns || suggestion.triggers) && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {suggestion.patterns ? 'Patrones detectados:' : 'Disparadores:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(suggestion.patterns || suggestion.triggers || []).map((p, i) => (
                                <Badge key={i} variant="outline">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response/Content */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {suggestion.type === 'failed_response' ? 'Regla sugerida:' : 'Respuesta sugerida:'}
                          </p>
                          {isEditing ? (
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[100px]"
                            />
                          ) : (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {getEditableContent(suggestion)}
                            </div>
                          )}
                        </div>

                        {/* Examples */}
                        {suggestion.examples && suggestion.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Ejemplos de conversaciones:
                            </p>
                            <div className="space-y-2">
                              {suggestion.examples.slice(0, 3).map((ex, i) => (
                                <div key={i} className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                                  <p><span className="font-medium">Cliente:</span> {ex.user}</p>
                                  <p><span className="font-medium">Bot:</span> {ex.bot}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingSuggestion(null)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(suggestion.id, editedContent)}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Guardar y Aprobar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(suggestion.id)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Rechazar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(suggestion)}
                              >
                                <Edit className="mr-1 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(suggestion.id)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Aprobar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </>
          )}
        </div>
      )}

      {/* Active Mutations */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {mutations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">No hay mejoras activas</h3>
                <p className="text-muted-foreground">
                  Cuando apruebes sugerencias, aparecerán aquí como mejoras activas
                </p>
              </CardContent>
            </Card>
          ) : (
            mutations.map((mutation) => {
              const typeConfig = suggestionTypeConfig[mutation.type as keyof typeof suggestionTypeConfig] || suggestionTypeConfig.cached_response;
              const Icon = typeConfig.icon;

              return (
                <Card key={mutation.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color.replace('text-', 'bg-').replace('-800', '-200')}`}>
                          <Icon className={`h-5 w-5 ${typeConfig.color.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                            {mutation.uses > 0 && (
                              <Badge variant="outline" className="bg-green-50">
                                {mutation.uses} usos
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {mutation.response || mutation.content || mutation.rule ||
                             (mutation.patterns && mutation.patterns[0]) ||
                             (mutation.triggers && mutation.triggers[0])}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {mutation.created_at ? new Date(mutation.created_at).toLocaleDateString() : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(mutation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
