import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockComprobantes } from '@/data/mockData';
import type { Comprobante } from '@/types';
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  Eye,
  Image as ImageIcon,
  Phone,
  Calendar,
  DollarSign,
  Banknote,
  User,
  Copy
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function ComprobantesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);

  const filteredComprobantes = useMemo(() => {
    return mockComprobantes.filter(comp => {
      const matchesSearch =
        comp.sender_phone.includes(searchQuery) ||
        comp.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.titular_origen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.referencia?.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || comp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const today = mockComprobantes.filter(c => {
      const compDate = new Date(c.date);
      const today = new Date();
      return compDate.toDateString() === today.toDateString();
    }).length;

    const pending = mockComprobantes.filter(c => c.status === 'pending').length;
    const verified = mockComprobantes.filter(c => c.status === 'verified').length;
    const totalMonth = mockComprobantes
      .filter(c => c.status === 'verified')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    return { today, pending, verified, totalMonth };
  }, []);

  const handleVerify = (comprobante: Comprobante, verified: boolean) => {
    toast.success(verified ? 'Comprobante verificado' : 'Comprobante rechazado', {
      description: `Pedido #${comprobante.order_number || 'N/A'}`
    });
    setSelectedComprobante(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle className="h-3 w-3" />
            Verificado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
            <XCircle className="h-3 w-3" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes de Pago</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona y verifica las transferencias recibidas
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-500">
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Hoy</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            <Receipt className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pendientes</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Verificados</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Mes</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMonth)}</p>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por teléfono, pedido, referencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:ring-primary/30 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-gray-200 text-sm">
              <Receipt className="mr-2 h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="verified">Verificado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comprobantes Table */}
      {filteredComprobantes.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Origen</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Referencia</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComprobantes.map((comprobante) => (
                  <tr key={comprobante.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {formatDate(comprobante.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{comprobante.titular_origen || 'Desconocido'}</div>
                        <div className="text-xs text-gray-500">{comprobante.sender_phone}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {formatCurrency(comprobante.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-gray-400" />
                        {comprobante.origen || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-600">
                        {comprobante.referencia || '-'}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(comprobante.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComprobante(comprobante)}
                        className="text-gray-500 h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron comprobantes</h3>
          <p className="text-sm text-gray-500">
            Intenta con otros filtros de búsqueda
          </p>
        </div>
      )}

      {/* Comprobante Detail Dialog */}
      <Dialog open={!!selectedComprobante} onOpenChange={() => setSelectedComprobante(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Receipt className="h-5 w-5" />
              Comprobante de Pago
            </DialogTitle>
          </DialogHeader>

          {selectedComprobante && (
            <div className="space-y-5">
              {/* Status */}
              <div className="flex justify-center">
                <div className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                  selectedComprobante.status === 'verified' && 'bg-emerald-50 text-emerald-700',
                  selectedComprobante.status === 'rejected' && 'bg-red-50 text-red-700',
                  selectedComprobante.status === 'pending' && 'bg-amber-50 text-amber-700'
                )}>
                  {getStatusIcon(selectedComprobante.status)}
                  {selectedComprobante.status === 'verified' ? 'Verificado' :
                   selectedComprobante.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </div>
              </div>

              {/* Image Placeholder */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <ImageIcon className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Imagen del comprobante</p>
                <p className="text-xs text-gray-400 mt-0.5">(Procesado con Gemini Vision)</p>
              </div>

              {/* Details */}
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monto
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(selectedComprobante.amount)}
                  </span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha
                  </span>
                  <span className="text-sm text-gray-900">{selectedComprobante.fecha || '-'}</span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Origen
                  </span>
                  <span className="text-sm text-gray-900">{selectedComprobante.origen || '-'}</span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Titular
                  </span>
                  <span className="text-sm text-gray-900">{selectedComprobante.titular_origen || '-'}</span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Referencia
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-600">
                      {selectedComprobante.referencia || '-'}
                    </code>
                    {selectedComprobante.referencia && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => copyToClipboard(selectedComprobante.referencia!, 'Referencia')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </span>
                  <span className="text-sm text-gray-900">{selectedComprobante.sender_phone}</span>
                </div>

                {selectedComprobante.order_number && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Pedido
                    </span>
                    <span className="text-sm font-medium text-gray-900">#{selectedComprobante.order_number}</span>
                  </div>
                )}

                {selectedComprobante.concepto && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm text-gray-500">Concepto</span>
                    <span className="text-sm text-gray-900">{selectedComprobante.concepto}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedComprobante.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-500 hover:bg-red-50"
                    onClick={() => handleVerify(selectedComprobante, false)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                    onClick={() => handleVerify(selectedComprobante, true)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verificar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
