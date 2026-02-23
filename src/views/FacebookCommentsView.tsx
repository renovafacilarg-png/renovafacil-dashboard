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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <MessageCircle className="h-3 w-3" /> Respondio{dry}
          </span>
        );
      case 'borrar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <Trash2 className="h-3 w-3" /> Borro{dry}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Comentarios Facebook</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Moderacion automatica de comentarios en la pagina
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData()}
          disabled={loading}
          className="text-gray-500 hover:text-gray-900"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="md:col-span-1 lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hoy procesados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.today.total ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hoy respondidos</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.today.responded ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hoy borrados</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats?.today.deleted ?? '-'}</p>
        </div>
        <div className="md:col-span-1 lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total almacenados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.responded ?? 0} resp / {stats?.deleted ?? 0} borr / {stats?.ignored ?? 0} ign
          </p>
        </div>
      </div>

      {/* Instagram Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-500" />
            <p className="text-sm font-semibold text-gray-900">Instagram</p>
            {igStatus?.ig_linked ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
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
              className="text-gray-500 hover:text-gray-900"
            >
              {igReprocessing ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              {igReprocessing ? 'Procesando...' : 'Reprocesar IG'}
            </Button>
          )}
        </div>

        {igStatus && (
          <div className="space-y-3">
            {igStatus.ig_linked ? (
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Cuenta</span>
                  <span className="text-sm text-gray-900 font-medium">@{igStatus.ig_username}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Posts monitoreados</span>
                  <span className="text-sm text-gray-900 font-medium">{igStatus.media_count}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Scheduler</span>
                  <span className="text-sm text-gray-900 font-medium">{igStatus.scheduler_running ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {igStatus.error || 'Instagram no vinculado. Configurar en Meta Business Suite.'}
              </p>
            )}

            {/* Reprocess result */}
            {igReprocessResult && (
              <div className={cn(
                "rounded-lg p-3 text-sm border",
                igReprocessResult.error
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : igReprocessResult.status === 'running'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              )}>
                {igReprocessResult.error ? (
                  <p>Error: {igReprocessResult.error}</p>
                ) : igReprocessResult.status === 'running' ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Respondiendo comentarios... {igReprocessResult.replied ?? 0} respondidos
                      {igReprocessResult.total_comments ? ` de ${igReprocessResult.total_comments} escaneados` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <p className="font-medium">{igReprocessResult.replied ?? 0}</p>
                      <p className="text-xs opacity-75">Respondidos</p>
                    </div>
                    <div>
                      <p className="font-medium">{igReprocessResult.skipped_already_replied ?? 0}</p>
                      <p className="text-xs opacity-75">Ya tenian respuesta</p>
                    </div>
                    <div>
                      <p className="font-medium">{igReprocessResult.skipped_ignored ?? 0}</p>
                      <p className="text-xs opacity-75">Ignorados</p>
                    </div>
                    <div>
                      <p className="font-medium">{igReprocessResult.total_comments ?? 0}</p>
                      <p className="text-xs opacity-75">Total escaneados</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No hay comentarios procesados</h3>
          <p className="text-sm text-gray-500">
            El bot procesa comentarios cada 3 minutos
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Mostrando {entries.length} de {totalCount}
          </p>

          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {entries.map((entry, idx) => (
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
                      <span className="text-sm font-medium text-gray-900">{entry.author_name}</span>
                      {actionBadge(entry.action, entry.dry_run)}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Comment text */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-2">
                      <p className="text-sm text-gray-700 break-words">{entry.comment_text}</p>
                    </div>

                    {/* Bot reply */}
                    {entry.reply_text && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Respuesta del bot:</p>
                        <p className="text-sm text-emerald-800 break-words">{entry.reply_text}</p>
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900">
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
                className="text-gray-500 hover:text-gray-900"
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
      )}

      <p className="text-center text-xs text-gray-500">
        Auto-refresh cada 60 segundos
      </p>
    </div>
  );
}
