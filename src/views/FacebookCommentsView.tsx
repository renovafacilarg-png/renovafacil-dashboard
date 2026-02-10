import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

interface FBCommentEntry {
  comment_id: string;
  action: string;
  comment_text: string;
  reply_text: string;
  post_id: string;
  timestamp: string;
  author_name: string;
  dry_run?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const loadedCountRef = useRef(PAGE_SIZE);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(
        `${API_URL}/api/fb-comments?limit=${loadedCountRef.current}&offset=0`,
        { headers: getAuthHeaders() }
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
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await fetch(
        `${API_URL}/api/fb-comments?limit=${PAGE_SIZE}&offset=${loadedCountRef.current}`,
        { headers: getAuthHeaders() }
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const actionBadge = (action: string, dryRun?: boolean) => {
    const dry = dryRun ? ' [DRY]' : '';
    switch (action) {
      case 'responder':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
            <MessageCircle className="h-3 w-3" /> Respondió{dry}
          </span>
        );
      case 'borrar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
            <Trash2 className="h-3 w-3" /> Borró{dry}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            <MinusCircle className="h-3 w-3" /> Ignoró
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
          <h1 className="text-2xl font-bold">Comentarios Facebook</h1>
          <p className="text-muted-foreground">
            Moderación automática de comentarios en la página
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Card className="md:col-span-1 lg:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Hoy procesados</p>
            <p className="text-2xl font-bold">{stats?.today.total ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600">Hoy respondidos</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.today.responded ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-red-500">Hoy borrados</p>
            <p className="text-2xl font-bold text-red-500">{stats?.today.deleted ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total almacenados</p>
            <p className="text-2xl font-bold">{stats?.total ?? '-'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.responded ?? 0} resp / {stats?.deleted ?? 0} borr / {stats?.ignored ?? 0} ign
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay comentarios procesados</h3>
          <p className="text-muted-foreground">
            El bot procesa comentarios cada 3 minutos
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {entries.length} de {totalCount}
          </p>
          {entries.map((entry, idx) => (
            <Card key={entry.comment_id || idx}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header: author + badge + time */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-medium text-sm">{entry.author_name}</span>
                      {actionBadge(entry.action, entry.dry_run)}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Comment text */}
                    <div className="bg-muted rounded-lg p-3 mb-2">
                      <p className="text-sm break-words">{entry.comment_text}</p>
                    </div>

                    {/* Bot reply */}
                    {entry.reply_text && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs text-emerald-700 font-medium mb-1">Respuesta del bot:</p>
                        <p className="text-sm text-emerald-800 break-words">{entry.reply_text}</p>
                      </div>
                    )}
                  </div>

                  {/* Facebook link */}
                  {entry.post_id && (
                    <a
                      href={`https://www.facebook.com/${entry.post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Auto-refresh cada 60 segundos
      </p>
    </div>
  );
}
