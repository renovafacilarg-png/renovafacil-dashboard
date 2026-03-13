import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Send, Plus, Clock, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCampaigns, createCampaign, sendCampaign, type Campaign, type ClientStateFilter } from '@/lib/api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const STATE_OPTIONS: { value: ClientStateFilter; label: string }[] = [
  { value: 'all', label: 'Todos los clientes' },
  { value: 'nuevo', label: 'Nuevos' },
  { value: 'interesado', label: 'Interesados' },
  { value: 'link_enviado', label: 'Link enviado' },
  { value: 'pago', label: 'Pagaron' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'recurrente', label: 'Recurrentes' },
];

const STATUS_CONFIG: Record<Campaign['status'], { label: string; icon: typeof Send; className: string }> = {
  draft: { label: 'Borrador', icon: Clock, className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Programada', icon: Clock, className: 'bg-amber-500/10 text-amber-400' },
  sent: { label: 'Enviada', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-400' },
  failed: { label: 'Fallida', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

function CampaignCard({ campaign, onSend }: { campaign: Campaign; onSend: (id: string) => void }) {
  const status = STATUS_CONFIG[campaign.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{campaign.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{campaign.message}</p>
        </div>
        <span className={cn('shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-md', status.className)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {STATE_OPTIONS.find(o => o.value === campaign.state_filter)?.label ?? campaign.state_filter}
        </span>
        {campaign.recipient_count !== undefined && (
          <span>{campaign.recipient_count} destinatarios</span>
        )}
        {campaign.sent_at && (
          <span>Enviada {format(parseISO(campaign.sent_at), 'dd MMM', { locale: es })}</span>
        )}
      </div>

      {campaign.status === 'draft' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSend(campaign.id)}
          className="w-full"
        >
          <Send className="h-3.5 w-3.5 mr-2" />
          Enviar ahora
        </Button>
      )}
    </div>
  );
}

export function ReEngagementView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // New campaign form state
  const [newName, setNewName] = useState('');
  const [newFilter, setNewFilter] = useState<ClientStateFilter>('interesado');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCampaigns();
        setCampaigns(data.campaigns || []);
      } catch {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newMessage.trim()) {
      toast.error('Completa nombre y mensaje');
      return;
    }
    setCreating(true);
    try {
      const campaign = await createCampaign({
        name: newName.trim(),
        state_filter: newFilter,
        message: newMessage.trim(),
      });
      setCampaigns(prev => [campaign, ...prev]);
      setShowDialog(false);
      setNewName('');
      setNewMessage('');
      toast.success('Campaña creada');
    } catch {
      toast.error('No se pudo crear la campaña. Phase 3 del backend requerida.');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const result = await sendCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sent', sent_count: result.sent_count } : c));
      toast.success(`Campaña enviada a ${result.sent_count} clientes`);
    } catch {
      toast.error('No se pudo enviar la campaña');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Send className="h-6 w-6" />
            Re-engagement
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Campañas segmentadas por estado del cliente
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva campaña
        </Button>
      </div>

      {/* Post-purchase info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground">Secuencias post-compra automáticas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Los mensajes del día 1, 7 y 14 post-entrega son gestionados automáticamente por el backend (Phase 3).
          Las campañas manuales de esta vista son para broadcasts adicionales.
        </p>
      </div>

      <Separator />

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-lg" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Send className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No hay campañas todavía</p>
          <p className="text-xs text-muted-foreground mt-1">
            Phase 3 del backend requerida para envíos reales.
            Podés crear campañas en borrador ahora.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} onSend={handleSend} />
          ))}
        </div>
      )}

      {/* New campaign dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva campaña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nombre de la campaña</Label>
              <Input
                id="campaign-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Seguimiento Link enviado - Marzo"
              />
            </div>
            <div className="space-y-2">
              <Label>Segmento destino</Label>
              <Select value={newFilter} onValueChange={v => setNewFilter(v as ClientStateFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-message">Mensaje</Label>
              <Textarea
                id="campaign-message"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Hola {nombre}, te escribimos porque..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Podés usar {'{nombre}'} para personalizar el mensaje con el nombre del contacto.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
