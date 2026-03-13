import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Store,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  Save,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Webhook,
} from 'lucide-react';
import { BUSINESS_INFO } from '@/data/businessConfig';

export function SettingsView() {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Configuración guardada');
  };

  const handleTestConnection = async (service: string) => {
    setTesting(service);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTesting(null);
    toast.success(`Conexión con ${service} exitosa`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administra la configuración de tu negocio e integraciones
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Negocio</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Envios</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
        </TabsList>

        {/* ---- Business Info ---- */}
        <TabsContent value="business">
          <div className="bg-card border border-border rounded-xl p-6 space-y-0">
            {/* Section: Información del Negocio */}
            <div className="space-y-4 pb-6 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground mb-3">Información del Negocio</p>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">
                Datos básicos de tu tienda que usa el bot de WhatsApp
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="business-name" className="text-sm font-medium text-foreground">
                    Nombre del negocio
                  </Label>
                  <Input
                    id="business-name"
                    defaultValue={BUSINESS_INFO.nombre}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="business-web" className="text-sm font-medium text-foreground">
                    Sitio web
                  </Label>
                  <Input
                    id="business-web"
                    defaultValue={BUSINESS_INFO.web}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-email" className="text-sm font-medium text-foreground">
                  Email de contacto
                </Label>
                <Input
                  id="business-email"
                  defaultValue={BUSINESS_INFO.contacto.email}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-phone" className="text-sm font-medium text-foreground">
                  Teléfono de contacto
                </Label>
                <Input
                  id="business-phone"
                  defaultValue={BUSINESS_INFO.contacto.whatsapp}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-hours" className="text-sm font-medium text-foreground">
                  Horario de atención
                </Label>
                <Input
                  id="business-hours"
                  defaultValue={BUSINESS_INFO.contacto.horario_atencion}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Section: Garantía y Devoluciones */}
            <div className="space-y-4 pt-6">
              <p className="text-sm font-semibold text-foreground mb-3">Garantia y Devoluciones</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="warranty-days" className="text-sm font-medium text-foreground">
                    Dias de devolucion
                  </Label>
                  <Input
                    id="warranty-days"
                    defaultValue={BUSINESS_INFO.garantia.dias_devolucion}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="warranty-conditions" className="text-sm font-medium text-foreground">
                    Condiciones
                  </Label>
                  <Input
                    id="warranty-conditions"
                    defaultValue={BUSINESS_INFO.garantia.condiciones}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- Products ---- */}
        <TabsContent value="products">
          <div className="bg-card border border-border rounded-xl p-6 space-y-0">
            {/* Section: Producto Principal */}
            <div className="space-y-4 pb-6 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground mb-3">Producto Principal</p>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">
                Configuracion del producto estrella que vende tu negocio
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="product-name" className="text-sm font-medium text-foreground">
                  Nombre del producto
                </Label>
                <Input
                  id="product-name"
                  defaultValue={BUSINESS_INFO.producto_principal.nombre}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="product-dimensions" className="text-sm font-medium text-foreground">
                    Dimensiones
                  </Label>
                  <Input
                    id="product-dimensions"
                    defaultValue={BUSINESS_INFO.producto_principal.dimensiones}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-coverage" className="text-sm font-medium text-foreground">
                    Cobertura
                  </Label>
                  <Input
                    id="product-coverage"
                    defaultValue={BUSINESS_INFO.producto_principal.cobertura}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="product-price" className="text-sm font-medium text-foreground">
                    Precio actual
                  </Label>
                  <Input
                    id="product-price"
                    defaultValue={BUSINESS_INFO.producto_principal.precio_actual}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-old-price" className="text-sm font-medium text-foreground">
                    Precio anterior
                  </Label>
                  <Input
                    id="product-old-price"
                    defaultValue={BUSINESS_INFO.producto_principal.precio_anterior}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-discount" className="text-sm font-medium text-foreground">
                    Descuento
                  </Label>
                  <Input
                    id="product-discount"
                    defaultValue={BUSINESS_INFO.producto_principal.descuento}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-colors" className="text-sm font-medium text-foreground">
                  Colores disponibles (separados por coma)
                </Label>
                <Input
                  id="product-colors"
                  defaultValue={BUSINESS_INFO.producto_principal.colores_disponibles.join(', ')}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Section: Características */}
            <div className="space-y-4 pt-6">
              <p className="text-sm font-semibold text-foreground mb-3">Caracteristicas del Producto</p>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">
                Lista de caracteristicas que el bot mencionara automaticamente
              </p>
              <div className="space-y-2">
                {BUSINESS_INFO.producto_principal.caracteristicas.map((feat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      defaultValue={feat}
                      className="bg-muted/50 border-border focus:ring-primary/30"
                    />
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0 px-3">
                      <span>×</span>
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground border border-dashed border-border mt-1">
                  + Agregar caracteristica
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- Shipping ---- */}
        <TabsContent value="shipping">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm font-semibold text-foreground mb-4">Configuracion de Envios</p>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-cost" className="text-sm font-medium text-foreground">
                    Costo de envio
                  </Label>
                  <Input
                    id="shipping-cost"
                    defaultValue={BUSINESS_INFO.envios.costo}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-company" className="text-sm font-medium text-foreground">
                    Empresa de envio
                  </Label>
                  <Input
                    id="shipping-company"
                    defaultValue={BUSINESS_INFO.envios.empresa}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-caba" className="text-sm font-medium text-foreground">
                    Tiempo CABA/AMBA
                  </Label>
                  <Input
                    id="shipping-caba"
                    defaultValue={BUSINESS_INFO.envios.tiempo_caba_amba}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-interior" className="text-sm font-medium text-foreground">
                    Tiempo Interior
                  </Label>
                  <Input
                    id="shipping-interior"
                    defaultValue={BUSINESS_INFO.envios.tiempo_interior}
                    className="bg-muted/50 border-border focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shipping-dispatch" className="text-sm font-medium text-foreground">
                  Tiempo de despacho
                </Label>
                <Input
                  id="shipping-dispatch"
                  defaultValue={BUSINESS_INFO.envios.despacho}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- Payments ---- */}
        <TabsContent value="payments">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm font-semibold text-foreground mb-4">Opciones de Pago</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="payment-installments" className="text-sm font-medium text-foreground">
                  Cuotas
                </Label>
                <Input
                  id="payment-installments"
                  defaultValue={BUSINESS_INFO.pagos.cuotas}
                  className="bg-muted/50 border-border focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Metodos de pago aceptados</p>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_INFO.pagos.metodos.map((metodo, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-foreground"
                    >
                      {metodo}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- Integrations ---- */}
        <TabsContent value="integrations">
          <div className="bg-card border border-border rounded-xl p-6 space-y-0">

            {/* TiendaNube */}
            <div className="space-y-4 pb-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">TiendaNube</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Conectado
                </span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">Integracion con tu tienda online</p>
              <div className="space-y-1.5">
                <Label htmlFor="tn-store-id" className="text-sm font-medium text-foreground">
                  Store ID
                </Label>
                <Input
                  id="tn-store-id"
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tn-token" className="text-sm font-medium text-foreground">
                  Access Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tn-token"
                    type="password"
                    value="••••••••••••••••••••••"
                    readOnly
                    className="flex-1 bg-muted/50 border-border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleTestConnection('TiendaNube')}
                    disabled={testing === 'TiendaNube'}
                  >
                    <RefreshCw className={`h-4 w-4 ${testing === 'TiendaNube' ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-4 py-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">WhatsApp Business API</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Conectado
                </span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">Configuracion de WhatsApp Cloud API</p>
              <div className="space-y-1.5">
                <Label htmlFor="wa-phone-id" className="text-sm font-medium text-foreground">
                  Phone ID
                </Label>
                <Input
                  id="wa-phone-id"
                  value="123456789012345"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-token" className="text-sm font-medium text-foreground">
                  Access Token
                </Label>
                <Input
                  id="wa-token"
                  type="password"
                  value="••••••••••••••••••••••"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-webhook" className="text-sm font-medium text-foreground">
                  Webhook URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wa-webhook"
                    value="https://tu-bot.up.railway.app/webhook"
                    readOnly
                    className="flex-1 bg-muted/50 border-border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText('https://tu-bot.up.railway.app/webhook');
                      toast.success('URL copiada');
                    }}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Packsy Sheets */}
            <div className="space-y-4 py-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Packsy Google Sheets</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Conectado
                </span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">Sincronizacion de tracking con Google Sheets</p>
              <div className="space-y-1.5">
                <Label htmlFor="packsy-sheet-id" className="text-sm font-medium text-foreground">
                  Sheet ID
                </Label>
                <Input
                  id="packsy-sheet-id"
                  value="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Estado de sincronizacion</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ultima sincronizacion: hace 5 minutos
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleTestConnection('Packsy')}
                disabled={testing === 'Packsy'}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${testing === 'Packsy' ? 'animate-spin' : ''}`} />
                Sincronizar ahora
              </Button>
            </div>

            {/* OpenAI */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">OpenAI</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Activo
                </span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 mb-3">Configuracion de la inteligencia artificial del bot</p>
              <div className="space-y-1.5">
                <Label htmlFor="openai-model" className="text-sm font-medium text-foreground">
                  Modelo
                </Label>
                <Input
                  id="openai-model"
                  value="gpt-4o-mini"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="openai-key" className="text-sm font-medium text-foreground">
                  API Key
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  value="••••••••••••••••••••••"
                  readOnly
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
