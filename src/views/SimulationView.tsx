import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL, getHeaders } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimMessage {
  role: 'user' | 'bot' | 'error';
  content: string;
}

interface ScenarioResult {
  idx: number;
  cat: string;
  name: string;
  expected: string;
  messages: SimMessage[];
  last_response: string;
  error: string | null;
  elapsed: number;
  phone: string;
}

interface SimSession {
  session_id: string;
  status: 'running' | 'done';
  progress: number;
  total: number;
  passed: number;
  elapsed: number;
  timestamp: string;
  results: ScenarioResult[];
}

interface SessionSummary {
  session_id: string;
  status: 'running' | 'done';
  progress: number;
  total: number;
  passed: number;
  elapsed: number;
  timestamp: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ventas: 'Ventas',
  objeciones: 'Objeciones',
  pedidos: 'Pedidos',
  tecnico: 'Técnico',
  envios: 'Envíos',
  pagos: 'Pagos',
  escalado: 'Escalado',
  edge: 'Edge Cases',
};

const CATEGORY_ORDER = ['ventas', 'objeciones', 'pedidos', 'tecnico', 'envios', 'pagos', 'escalado', 'edge'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: SimMessage }) {
  if (msg.role === 'error') {
    return (
      <div className="flex items-start gap-2 px-4 py-2">
        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
        <span className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{msg.content}</span>
      </div>
    );
  }

  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex px-4 py-1', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-muted text-foreground rounded-tl-sm'
      )}>
        {msg.content}
      </div>
    </div>
  );
}

function ScenarioRow({
  result,
  isSelected,
  onClick,
}: {
  result: ScenarioResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const passed = !result.error;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors duration-100 group',
        isSelected
          ? 'bg-primary/10 text-foreground'
          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
      )}
    >
      {passed
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
      <span className="flex-1 text-xs truncate">{result.name}</span>
      <span className="text-[10px] text-muted-foreground/50 shrink-0">{result.elapsed}s</span>
      <ChevronRight className={cn(
        'h-3 w-3 shrink-0 transition-opacity',
        isSelected ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-60'
      )} />
    </button>
  );
}

function RunningRow() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 text-primary/70">
      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
      <span className="text-xs">Corriendo...</span>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function SimulationView() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<SimSession | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when selection changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedIdx, activeSession?.results]);

  // Load session list on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/sessions`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list: SessionSummary[] = data.sessions || [];
        setSessions(list);
        setLoadingSessions(false);

        // If there's a running session, load and poll it
        const running = list.find(s => s.status === 'running');
        if (running && !activeSession) {
          loadSession(running.session_id);
        }
      }
    } catch {
      setLoadingSessions(false);
    }
  };

  const loadSession = useCallback(async (session_id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/sessions/${session_id}`, { headers: getHeaders() });
      if (res.ok) {
        const data: SimSession = await res.json();
        setActiveSession(data);

        // Auto-select first scenario if none selected
        if (selectedIdx === null && data.results.length > 0) {
          setSelectedIdx(0);
        }

        return data;
      }
    } catch {
      // ignore
    }
    return null;
  }, [selectedIdx]);

  // Polling for running session
  useEffect(() => {
    if (activeSession?.status === 'running') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const data = await loadSession(activeSession.session_id);
        if (data?.status === 'done') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          fetchSessions(); // Refresh session list
        }
      }, 3000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeSession?.status, activeSession?.session_id]);

  const handleRun = async () => {
    setIsStarting(true);
    setSelectedIdx(null);
    try {
      const res = await fetch(`${API_URL}/api/simulation/run`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // Load the new session immediately
        const session = await loadSession(data.session_id);
        if (session) {
          fetchSessions();
        }
      }
    } catch {
      // ignore
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectSession = async (session_id: string) => {
    setSelectedIdx(null);
    const data = await loadSession(session_id);
    if (data && data.results.length > 0) {
      setSelectedIdx(0);
    }
  };

  const selectedResult = selectedIdx !== null ? activeSession?.results[selectedIdx] : null;
  const isRunning = activeSession?.status === 'running';
  const total = activeSession?.total || 40;
  const progress = activeSession?.progress || 0;

  // Group completed results by category
  const resultsByCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat] || cat,
    results: (activeSession?.results || []).filter(r => r.cat === cat),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Simulación
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Corre 40 conversaciones reales y verifica las respuestas del bot
          </p>
        </div>
        <Button
          onClick={handleRun}
          disabled={isStarting || isRunning}
          size="sm"
          className="gap-2"
        >
          {(isStarting || isRunning)
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Play className="h-4 w-4" />}
          {isRunning ? `Corriendo... (${progress}/${total})` : 'Correr 40 escenarios'}
        </Button>
      </div>

      {/* Progress bar (running) */}
      {isRunning && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress}/{total} escenarios · {formatElapsed(activeSession?.elapsed || 0)} transcurridos
          </p>
        </div>
      )}

      {/* Session selector (if past sessions) */}
      {!loadingSessions && sessions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {sessions.slice(0, 8).map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s.session_id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors duration-100',
                activeSession?.session_id === s.session_id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {s.status === 'running'
                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                : s.passed === s.total
                  ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                  : <XCircle className="h-2.5 w-2.5 text-red-400" />}
              <span>{formatTimestamp(s.timestamp)}</span>
              <span className="text-[10px] opacity-60">
                {s.status === 'running' ? `${s.progress}/${s.total}` : `${s.passed}/${s.total}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {activeSession ? (
        <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Left pane — scenarios list */}
          <div className="w-72 shrink-0 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
            {/* Session stats */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isRunning
                    ? <Badge variant="secondary" className="text-xs gap-1">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Corriendo
                      </Badge>
                    : <Badge
                        className={cn(
                          'text-xs',
                          activeSession.passed === activeSession.total
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/20'
                        )}
                      >
                        {activeSession.passed}/{activeSession.total} OK
                      </Badge>}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatElapsed(activeSession.elapsed)}</span>
                </div>
              </div>
            </div>

            {/* Scenario list */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {CATEGORY_ORDER.map(cat => {
                const group = resultsByCategory.find(g => g.cat === cat)!;
                const label = group.label;
                // How many scenarios total in this category
                const totalInCat = activeSession.results.filter(r => r.cat === cat).length;
                if (totalInCat === 0 && !isRunning) return null;

                // If running, show pending/running placeholders for unreached scenarios
                const nextPendingIdx = activeSession.results.length; // first not-yet-run scenario

                return (
                  <div key={cat} className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-3 pt-2 pb-1">
                      {label}
                    </p>
                    {group.results.map(r => (
                      <ScenarioRow
                        key={r.idx}
                        result={r}
                        isSelected={selectedIdx === r.idx}
                        onClick={() => setSelectedIdx(r.idx)}
                      />
                    ))}
                    {/* Running placeholder */}
                    {isRunning && nextPendingIdx < total && (
                      (() => {
                        // Check if the currently-running scenario belongs to this cat
                        // We don't have exact info, so show running in first cat that hasn't completed
                        const scenariosInCatWithCounts = [
                          { cat: 'ventas', count: 10 },
                          { cat: 'objeciones', count: 5 },
                          { cat: 'pedidos', count: 5 },
                          { cat: 'tecnico', count: 5 },
                          { cat: 'envios', count: 3 },
                          { cat: 'pagos', count: 3 },
                          { cat: 'escalado', count: 4 },
                          { cat: 'edge', count: 5 },
                        ];
                        const catInfo = scenariosInCatWithCounts.find(c => c.cat === cat);
                        if (!catInfo) return null;
                        const catStart = scenariosInCatWithCounts
                          .slice(0, scenariosInCatWithCounts.findIndex(c => c.cat === cat))
                          .reduce((sum, c) => sum + c.count, 0);
                        const catEnd = catStart + catInfo.count;
                        const doneInCat = group.results.length;
                        if (doneInCat >= catInfo.count) return null;

                        return (
                          <>
                            {nextPendingIdx >= catStart && nextPendingIdx < catEnd && <RunningRow />}
                          </>
                        );
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right pane — conversation */}
          <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
            {selectedResult ? (
              <>
                {/* Conversation header */}
                <div className="px-5 py-3.5 border-b border-border bg-muted/30 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selectedResult.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Esperado: {selectedResult.expected}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedResult.error
                        ? <Badge className="bg-red-500/15 text-red-500 border-red-500/20 text-xs">Error</Badge>
                        : <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-xs">OK</Badge>}
                      <span className="text-xs text-muted-foreground">{selectedResult.elapsed}s</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-1">
                  {selectedResult.messages.map((msg, i) => (
                    <ChatBubble key={i} msg={msg} />
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <FlaskConical className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isRunning ? 'Seleccioná un escenario completado para ver la conversación' : 'Seleccioná un escenario de la lista'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FlaskConical className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-lg font-medium mb-2">Sin simulaciones</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Corrí 40 conversaciones reales con el bot. Cada escenario testea una funcionalidad distinta.
          </p>
          <Button onClick={handleRun} disabled={isStarting} className="gap-2">
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Correr 40 escenarios
          </Button>
          <p className="text-xs text-muted-foreground/50 mt-3">
            ~3-5 minutos · Se guarda en Redis por 7 días
          </p>
        </div>
      )}
    </div>
  );
}
