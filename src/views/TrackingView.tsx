import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL, getHeaders } from '@/lib/api';

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

  const searchTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Ingresa un número de tracking');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/track/${trackingNumber.trim()}`, { headers: getHeaders() });
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

  const getStatusBadge = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('entregado')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <CheckCircle className="h-3 w-3" />
          {estado}
        </span>
      );
    } else if (estadoLower.includes('transito') || estadoLower.includes('camino')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
          <Truck className="h-3 w-3" />
          {estado}
        </span>
      );
    } else if (estadoLower.includes('sucursal')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <MapPin className="h-3 w-3" />
          {estado}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <Package className="h-3 w-3" />
          {estado}
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tracking de Envíos</h1>
        <p className="text-sm text-gray-500">
          Rastrea el estado de tus envíos con Andreani
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ingresa el número de tracking (ej: 360002399767740)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTracking()}
              className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
            />
          </div>
          <Button onClick={searchTracking} disabled={loading}>
            {loading ? (
              <Search className={cn("mr-2 h-4 w-4", loading && "animate-pulse")} />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Rastrear
          </Button>
        </div>
      </div>

      {/* Result */}
      {tracking && tracking.success && tracking.data && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* Status header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estado actual</p>
              {getStatusBadge(tracking.data.estado)}
              {tracking.data.ubicacion && (
                <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {tracking.data.ubicacion}
                </p>
              )}
            </div>
          </div>

          {/* Tracking number row */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Número de tracking</p>
                <code className="text-sm font-mono text-gray-900">{tracking.data.tracking_number}</code>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900"
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

          {/* Events timeline */}
          {tracking.data.eventos && tracking.data.eventos.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
              >
                <Clock className="h-4 w-4 text-gray-400" />
                Historial de movimientos
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="border-l-2 border-gray-200 pl-4 space-y-3">
                  {tracking.data.eventos.map((event, index) => (
                    <div key={index} className="relative">
                      <div className={cn(
                        "absolute -left-[1.3rem] top-1.5 w-2 h-2 rounded-full",
                        index === 0 ? "bg-primary" : "bg-gray-300"
                      )} />
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{event.date}</span>
                        {event.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {tracking && !tracking.success && (
        <div className="bg-white border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">No se encontró el envío</h3>
              <p className="text-sm text-gray-500 mt-0.5">{tracking.mensaje}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      {!tracking && !loading && (
        <div>
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto" />
          <div className="text-sm text-gray-500 text-center mt-3">
            <p className="font-medium text-gray-700 mb-1">¿Cómo rastrear?</p>
            <p>Ingresa el número de tracking de Andreani (generalmente 15 dígitos)</p>
            <p className="mt-2">
              Ejemplo:{' '}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">360002399767740</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
