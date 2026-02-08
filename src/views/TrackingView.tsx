import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  Search, 
  Truck, 
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEvent {
  date: string;
  description: string;
  location?: string;
}

interface TrackingData {
  success: boolean;
  mensaje: string;
  data?: {
    tracking_number: string;
    estado: string;
    ubicacion: string;
    eventos: TrackingEvent[];
  };
}

export function TrackingView() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const searchTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Ingresa un número de tracking');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/track/${trackingNumber.trim()}`);
      const data = await response.json();
      setTracking(data);
      
      if (!data.success) {
        toast.error('No se encontró información para este tracking');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const getStatusIcon = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('entregado')) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    } else if (estadoLower.includes('transito') || estadoLower.includes('camino')) {
      return <Truck className="h-5 w-5 text-amber-500" />;
    } else if (estadoLower.includes('sucursal')) {
      return <MapPin className="h-5 w-5 text-violet-500" />;
    } else {
      return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tracking de Envíos</h1>
        <p className="text-muted-foreground">
          Rastrea el estado de tus envíos con Andreani
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ingresa el número de tracking (ej: 360002399767740)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTracking()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchTracking} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Rastrear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {tracking && tracking.success && tracking.data && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              {getStatusIcon(tracking.data.estado)}
              <div>
                <h2 className="text-xl font-bold">{tracking.data.estado}</h2>
                <p className="text-muted-foreground">{tracking.data.ubicacion}</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono">{tracking.data.tracking_number}</code>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(tracking.data!.tracking_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <a 
                      href={`https://www.andreani.com/#!/702/buscar-envio?codigo=${tracking.data.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver en Andreani
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Events */}
            {tracking.data.eventos && tracking.data.eventos.length > 0 && (
              <div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-sm font-medium mb-4"
                >
                  <Clock className="h-4 w-4" />
                  Historial de movimientos
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {expanded && (
                  <div className="space-y-3">
                    {tracking.data.eventos.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-3 h-3 rounded-full 
                            ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}
                          `} />
                          {index < tracking.data!.eventos.length - 1 && (
                            <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-sm">{event.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{event.date}</span>
                            {event.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {tracking && !tracking.success && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">No se encontró el envío</h3>
                <p className="text-red-700 text-sm mt-1">{tracking.mensaje}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {!tracking && !loading && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">¿Cómo rastrear?</p>
                <p>Ingresa el número de tracking de Andreani (generalmente 15 dígitos)</p>
                <p className="mt-2">Ejemplo: <code className="bg-background px-2 py-1 rounded">360002399767740</code></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
