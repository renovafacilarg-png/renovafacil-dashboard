import { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL, getHeaders } from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---

type ClientState = 'nuevo' | 'interesado' | 'link_enviado' | 'pago' | 'entregado' | 'recurrente';

interface PipelineClient {
  id: string;
  name: string;
  phone: string;
  state: ClientState;
  last_message: string;
  time_in_state: number;      // minutes
  lead_score?: number;
  is_abandoned_cart?: boolean;
}

const COLUMNS: { state: ClientState; label: string }[] = [
  { state: 'nuevo', label: 'Nuevo' },
  { state: 'interesado', label: 'Interesado' },
  { state: 'link_enviado', label: 'Link enviado' },
  { state: 'pago', label: 'Pagó' },
  { state: 'entregado', label: 'Entregado' },
  { state: 'recurrente', label: 'Recurrente' },
];

// --- ClientCard (draggable) ---

function ClientCard({ client }: { client: PipelineClient }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: client.id,
    data: { type: 'card', client },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const timeLabel = client.time_in_state < 60
    ? `${client.time_in_state}m`
    : `${Math.round(client.time_in_state / 60)}h`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-background border border-border rounded-md p-3 cursor-grab active:cursor-grabbing space-y-2 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
          <p className="text-xs text-muted-foreground">{client.phone}</p>
        </div>
        {client.lead_score !== undefined && (
          <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {client.lead_score}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">{client.last_message}</p>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeLabel}
        </span>
        {client.is_abandoned_cart && (
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5">
            Carrito
          </span>
        )}
      </div>
    </div>
  );
}

// --- KanbanColumn (droppable) ---

function KanbanColumn({ state, label, clients }: { state: ClientState; label: string; clients: PipelineClient[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: state });

  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {clients.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] rounded-lg p-3 space-y-2 transition-colors',
          'bg-card/50 border border-border',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// --- PipelineView ---

export function PipelineView() {
  const [clients, setClients] = useState<PipelineClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pipeline`, { headers: getHeaders() });
        if (!response.ok) {
          // Phase 3 not yet live — graceful empty state
          setClients([]);
          return;
        }
        const data = await response.json();
        setClients(data.clients || []);
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPipeline();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const clientId = active.id as string;
    const newState = over.id as ClientState;
    const client = clients.find(c => c.id === clientId);

    if (!client || client.state === newState) return;

    // Optimistic update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, state: newState } : c));

    try {
      const response = await fetch(`${API_URL}/api/pipeline/${clientId}/state`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });
      if (!response.ok) throw new Error('Failed');
      toast.success(`Cliente movido a "${COLUMNS.find(c => c.state === newState)?.label}"`);
    } catch {
      // Revert on failure
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, state: client.state } : c));
      toast.error('No se pudo actualizar el estado');
    }
  };

  const activeClient = activeId ? clients.find(c => c.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex gap-4">
        {COLUMNS.map(col => (
          <div key={col.state} className="min-w-[260px] w-[260px]">
            <div className="skeleton h-6 w-24 rounded mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-20 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Kanban className="h-6 w-6" />
          Pipeline de Clientes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clients.length === 0
            ? 'Activo cuando Phase 3 del backend esté disponible'
            : `${clients.length} clientes en el pipeline`}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.state}
              state={col.state}
              label={col.label}
              clients={clients.filter(c => c.state === col.state)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeClient ? <ClientCard client={activeClient} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
