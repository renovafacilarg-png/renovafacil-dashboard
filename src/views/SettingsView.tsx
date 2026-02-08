import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Shield, 
  MessageSquare,
  Save,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Webhook
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
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración de tu negocio e integraciones
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
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
            <span className="hidden sm:inline">Envíos</span>
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

        {/* Business Info */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Información del Negocio
              </CardTitle>
              <CardDescription>
                Datos básicos de tu tienda que usa el bot de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nombre del negocio</Label>
                  <Input id="business-name" defaultValue={BUSINESS_INFO.nombre} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-web">Sitio web</Label>
                  <Input id="business-web" defaultValue={BUSINESS_INFO.web} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email">Email de contacto</Label>
                <Input id="business-email" defaultValue={BUSINESS_INFO.contacto.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone">Teléfono de contacto</Label>
                <Input id="business-phone" defaultValue={BUSINESS_INFO.contacto.whatsapp} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-hours">Horario de atención</Label>
                <Input id="business-hours" defaultValue={BUSINESS_INFO.contacto.horario_atencion} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Garantía y Devoluciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warranty-days">Días de devolución</Label>
                  <Input id="warranty-days" defaultValue={BUSINESS_INFO.garantia.dias_devolucion} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty-conditions">Condiciones</Label>
                  <Input id="warranty-conditions" defaultValue={BUSINESS_INFO.garantia.condiciones} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Producto Principal
              </CardTitle>
              <CardDescription>
                Configuración del producto estrella que vende tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre del producto</Label>
                <Input id="product-name" defaultValue={BUSINESS_INFO.producto_principal.nombre} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-dimensions">Dimensiones</Label>
                  <Input id="product-dimensions" defaultValue={BUSINESS_INFO.producto_principal.dimensiones} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-coverage">Cobertura</Label>
                  <Input id="product-coverage" defaultValue={BUSINESS_INFO.producto_principal.cobertura} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Precio actual</Label>
                  <Input id="product-price" defaultValue={BUSINESS_INFO.producto_principal.precio_actual} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-old-price">Precio anterior</Label>
                  <Input id="product-old-price" defaultValue={BUSINESS_INFO.producto_principal.precio_anterior} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-discount">Descuento</Label>
                  <Input id="product-discount" defaultValue={BUSINESS_INFO.producto_principal.descuento} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-colors">Colores disponibles (separados por coma)</Label>
                <Input 
                  id="product-colors" 
                  defaultValue={BUSINESS_INFO.producto_principal.colores_disponibles.join(', ')} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Características del Producto</CardTitle>
              <CardDescription>
                Lista de características que el bot mencionará automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {BUSINESS_INFO.producto_principal.caracteristicas.map((feat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input defaultValue={feat} />
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <span className="text-red-500">×</span>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  + Agregar característica
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Configuración de Envíos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipping-cost">Costo de envío</Label>
                  <Input id="shipping-cost" defaultValue={BUSINESS_INFO.envios.costo} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-company">Empresa de envío</Label>
                  <Input id="shipping-company" defaultValue={BUSINESS_INFO.envios.empresa} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipping-caba">Tiempo CABA/AMBA</Label>
                  <Input id="shipping-caba" defaultValue={BUSINESS_INFO.envios.tiempo_caba_amba} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-interior">Tiempo Interior</Label>
                  <Input id="shipping-interior" defaultValue={BUSINESS_INFO.envios.tiempo_interior} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-dispatch">Tiempo de despacho</Label>
                <Input id="shipping-dispatch" defaultValue={BUSINESS_INFO.envios.despacho} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Opciones de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-installments">Cuotas</Label>
                <Input id="payment-installments" defaultValue={BUSINESS_INFO.pagos.cuotas} />
              </div>
              <div className="space-y-2">
                <Label>Métodos de pago aceptados</Label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_INFO.pagos.metodos.map((metodo, idx) => (
                    <span key={idx} className="bg-muted px-3 py-1 rounded-full text-sm">
                      {metodo}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          {/* TiendaNube */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  TiendaNube
                </div>
                <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  Conectado
                </span>
              </CardTitle>
              <CardDescription>
                Integración con tu tienda online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tn-store-id">Store ID</Label>
                <Input id="tn-store-id" type="password" value="••••••••••••" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tn-token">Access Token</Label>
                <div className="flex gap-2">
                  <Input id="tn-token" type="password" value="••••••••••••••••••••••" readOnly className="flex-1" />
                  <Button variant="outline" onClick={() => handleTestConnection('TiendaNube')} disabled={testing === 'TiendaNube'}>
                    <RefreshCw className={`h-4 w-4 ${testing === 'TiendaNube' ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp Business API
                </div>
                <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  Conectado
                </span>
              </CardTitle>
              <CardDescription>
                Configuración de WhatsApp Cloud API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wa-phone-id">Phone ID</Label>
                <Input id="wa-phone-id" value="123456789012345" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-token">Access Token</Label>
                <Input id="wa-token" type="password" value="••••••••••••••••••••••" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input id="wa-webhook" value="https://tu-bot.up.railway.app/webhook" readOnly className="flex-1" />
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText('https://tu-bot.up.railway.app/webhook');
                    toast.success('URL copiada');
                  }}>
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packsy Sheets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Packsy Google Sheets
                </div>
                <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  Conectado
                </span>
              </CardTitle>
              <CardDescription>
                Sincronización de tracking con Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packsy-sheet-id">Sheet ID</Label>
                <Input id="packsy-sheet-id" value="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Estado de sincronización</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Última sincronización: hace 5 minutos
                </div>
              </div>
              <Button variant="outline" onClick={() => handleTestConnection('Packsy')} disabled={testing === 'Packsy'}>
                <RefreshCw className={`mr-2 h-4 w-4 ${testing === 'Packsy' ? 'animate-spin' : ''}`} />
                Sincronizar ahora
              </Button>
            </CardContent>
          </Card>

          {/* Groq AI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Groq AI
                </div>
                <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  Activo
                </span>
              </CardTitle>
              <CardDescription>
                Configuración de la inteligencia artificial del bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groq-model">Modelo</Label>
                <Input id="groq-model" value="llama-3.3-70b-versatile" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groq-key">API Key</Label>
                <Input id="groq-key" type="password" value="••••••••••••••••••••••" readOnly />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
