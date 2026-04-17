import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Trash2,
  MinusCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  ChevronDown,
  Instagram,
  Facebook,
} from 'lucide-react';
import { API_URL, getHeaders } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FBCommentEntry {
  comment_id: string;
  action: string;
  comment_text: string;
  reply_text: string;
  post_id: string;
  timestamp: string;
  author_name: string;
  dry_run?: boolean;
  source?: string;
  permalink?: string;
}

interface FBStats {
  total: number;
  responded: number;
  deleted: number;
  ignored: number;
  today: {
    total: number;
    responded: number;
    deleted: number;
    ignored: number;
  };
}

const PAGE_SIZE = 50;

type SourceFilter = 'all' | 'facebook' | 'instagram';

export function FacebookCommentsView() {
  const [entries, setEntries] = useState<FBCommentEntry[]>([]);
  const [stats, setStats] = useState<FBStats | null>(null);
  const [igStatus, setIgStatus] = useState<any>(null);
  const [igReprocessing, setIgReprocessing] = useState(false);
  const [igReprocessResult, setIgReprocessResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const loadedCountRef = useRef(PAGE_SIZE);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/fb-comments?limit=${loadedCountRef.current}&offset=0`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        setStats(data.stats || null);
        setHasMore(data.has_more ?? false);
        setTotalCount(data.total_count ?? 0);
      }
    } catch (error) {
      console.error('Error fetching FB comments:', error);
    }

    // Fetch IG status via authenticated API
    try {
      const igResp = await fetch(`${API_URL}/api/fb-comments/ig-status`, { headers: getHeaders() });
      if (igResp.ok) {
        const igData = await igResp.json();
        setIgStatus(igData);
      }
    } catch (e) {
      console.error('Error fetching IG status:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await fetch(
        `${API_URL}/api/fb-comments?limit=${PAGE_SIZE}&offset=${loadedCountRef.current}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        const newEntries = data.entries || [];
        setEntries(prev => [...prev, ...newEntries]);
        loadedCountRef.current += newEntries.length;
        setHasMore(data.has_more ?? false);
        setTotalCount(data.total_count ?? 0);
      }
    } catch (error) {
      console.error('Error fetching FB comments:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const pollIgReprocessStatus = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/fb-comments/ig-reprocess-status`, { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setIgReprocessResult(data);
        if (data.status === 'running') {
          setTimeout(pollIgReprocessStatus, 5000);
        } else {
          setIgReprocessing(false);
          fetchData(false);
        }
      } else {
        setIgReprocessing(false);
      }
    } catch {
      setIgReprocessing(false);
    }
  };

  const triggerIgReprocess = async () => {
    setIgReprocessing(true);
    setIgReprocessResult(null);
    try {
      const resp = await fetch(`${API_URL}/api/fb-comments/ig-reprocess`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'started' || data.status === 'already_running') {
          setIgReprocessResult({ status: 'running' });
          setTimeout(pollIgReprocessStatus, 5000);
        } else {
          setIgReprocessResult(data);
          setIgReprocessing(false);
        }
      } else {
        setIgReprocessResult({ error: `HTTP ${resp.status}` });
        setIgReprocessing(false);
      }
    } catch (e: any) {
      setIgReprocessResult({ error: e.message || 'Error de conexión' });
      setIgReprocessing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 600000);
    return () => clearInterval(interval);
  }, []);

  const actionBadge = (action: string, dryRun?: boolean) => {
    const dry = dryRun ? ' [DRY]' : '';
    switch (action) {
      case 'responder':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <MessageCircle className="h-3 w-3" /> Respondio{dry}
          </span>
        );
      case 'borrar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <Trash2 className="h-3 w-3" /> Borro{dry}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <MinusCircle className="h-3 w-3" /> Ignoro
          </span>
        );
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts?.slice(0, 16) || '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comentarios FB / Instagram</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Moderacion automatica de comentarios en Facebook e Instagram
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData()}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="md:col-span-1 lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoy procesados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.today.total ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoy respondidos</p>
          <p className="text-2xl font-bold text-secondary mt-1">{stats?.today.responded ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoy borrados</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.today.deleted ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total almacenados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.total ?? '-'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.responded ?? 0} resp / {stats?.deleted ?? 0} borr / {stats?.ignored ?? 0} ign
          </p>
        </div>
      </div>

      {/* Fuentes monitoreadas — FB + IG unificados */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Facebook */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Facebook className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-semibold text-foreground">Facebook</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
              Conectado
            </span>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">Fuente</span>
              <span className="text-sm text-foreground font-medium">Published posts + Ads activos</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">Cobertura</span>
              <span className="text-sm text-foreground font-medium">Todos los posts</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">Scheduler</span>
              <span className="text-sm text-foreground font-medium">{igStatus?.scheduler_running ? 'Activo' : 'Activo'}</span>
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              <p className="text-sm font-semibold text-foreground">Instagram</p>
              {igStatus?.ig_linked ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                  Desconectado
                </span>
              )}
            </div>
            {igStatus?.ig_linked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerIgReprocess}
                disabled={igReprocessing}
                className="text-muted-foreground hover:text-foreground h-7 px-2"
              >
                {igReprocessing ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                )}
                <span className="text-xs">{igReprocessing ? 'Procesando...' : 'Reprocesar'}</span>
              </Button>
            )}
          </div>

          {igStatus?.ig_linked ? (
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Cuenta</span>
                <span className="text-sm text-foreground font-medium">@{igStatus.ig_username}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Posts monitoreados</span>
                <span className="text-sm text-foreground font-medium">{igStatus.media_count ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Scheduler</span>
                <span className="text-sm text-foreground font-medium">{igStatus.scheduler_running ? 'Activo' : 'Inactivo'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {igStatus?.error || 'No vinculado. Configurar en Meta Business Suite.'}
            </p>
          )}

          {/* Reprocess result */}
          {igReprocessResult && (
            <div className={cn(
              "mt-3 rounded-lg p-3 text-sm border",
              igReprocessResult.error
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : igReprocessResult.status === 'running'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-secondary/10 border-secondary/20 text-secondary'
            )}>
              {igReprocessResult.error ? (
                <p>Error: {igReprocessResult.error}</p>
              ) : igReprocessResult.status === 'running' ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Respondiendo... {igReprocessResult.replied ?? 0} respondidos
                    {igReprocessResult.total_comments ? ` de ${igReprocessResult.total_comments}` : ''}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium">{igReprocessResult.replied ?? 0}</p>
                    <p className="text-xs opacity-75">Respondidos</p>
                  </div>
                  <div>
                    <p className="font-medium">{igReprocessResult.skipped_already_replied ?? 0}</p>
                    <p className="text-xs opacity-75">Ya respondidos</p>
                  </div>
                  <div>
                    <p className="font-medium">{igReprocessResult.skipped_ignored ?? 0}</p>
                    <p className="text-xs opacity-75">Ignorados</p>
                  </div>
                  <div>
                    <p className="font-medium">{igReprocessResult.total_comments ?? 0}</p>
                    <p className="text-xs opacity-75">Escaneados</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No hay comentarios procesados</h3>
          <p className="text-sm text-muted-foreground">
            El bot procesa comentarios cada 3 minutos
          </p>
        </div>
      ) : (() => {
        const filteredEntries = entries.filter(e =>
          sourceFilter === 'all' ? true :
          sourceFilter === 'instagram' ? e.source === 'instagram' :
          e.source !== 'instagram'
        );
        const fbCount = entries.filter(e => e.source !== 'instagram').length;
        const igCount = entries.filter(e => e.source === 'instagram').length;

        return (
        <div className="space-y-2">
          {/* Source filter tabs */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(['all', 'facebook', 'instagram'] as SourceFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                    sourceFilter === f
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'facebook' && <Facebook className="h-3 w-3 text-blue-500" />}
                  {f === 'instagram' && <Instagram className="h-3 w-3 text-pink-500" />}
                  {f === 'all' ? `Todos (${entries.length})` :
                   f === 'facebook' ? `Facebook (${fbCount})` :
                   `Instagram (${igCount})`}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Mostrando {filteredEntries.length} de {totalCount}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {filteredEntries.map((entry, idx) => (
              <div key={entry.comment_id || idx} className="py-4 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header: author + badge + time */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {entry.source === 'instagram' ? (
                        <Instagram className="h-3 w-3 text-pink-500 shrink-0" />
                      ) : (
                        <Facebook className="h-3 w-3 text-blue-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground">{entry.author_name}</span>
                      {actionBadge(entry.action, entry.dry_run)}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Comment text */}
                    <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 mb-2">
                      <p className="text-sm text-foreground/80 break-words">{entry.comment_text}</p>
                    </div>

                    {/* Bot reply */}
                    {entry.reply_text && (
                      <div className="bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-secondary font-medium mb-1">Respuesta del bot:</p>
                        <p className="text-sm text-secondary break-words">{entry.reply_text}</p>
                      </div>
                    )}
                  </div>

                  {/* External link */}
                  {entry.post_id && (
                    <a
                      href={entry.source === 'instagram'
                        ? entry.permalink || `https://www.instagram.com/${igStatus?.ig_username || 'renova.facil.arg'}/`
                        : `https://www.facebook.com/${entry.post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="text-muted-foreground hover:text-foreground"
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Cargar mas
              </Button>
            </div>
          )}
        </div>
      );
      })()}

      <p className="text-center text-xs text-muted-foreground">
        Auto-refresh cada 10 minutos
      </p>
    </div>
  );
}
