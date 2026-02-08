// Datos mock para el Dashboard de Renovafacil
import type { Order, Tracking, AbandonedCart, Comprobante, BotMetrics, DashboardSummary, SalesData } from '@/types';

export const mockOrders: Order[] = [
  {
    id: 12345,
    number: '12345',
    customer: {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+54 9 11 2345-6789'
    },
    products: [
      { id: 1, name: 'Placas Símil Ladrillo Blanco', quantity: 2, price: 69942, variant: 'Pack 10 unidades' },
      { id: 2, name: 'Placas Símil Ladrillo Negro', quantity: 1, price: 69942, variant: 'Pack 10 unidades' }
    ],
    total: 209826,
    status: 'closed',
    payment_status: 'paid',
    shipping_status: 'shipped',
    shipping_tracking: '360002399767740',
    created_at: '2025-01-31T14:30:00Z',
    updated_at: '2025-01-31T16:45:00Z'
  },
  {
    id: 12344,
    number: '12344',
    customer: {
      name: 'Juan Pérez',
      email: 'juan.perez@gmail.com',
      phone: '+54 9 11 8765-4321'
    },
    products: [
      { id: 3, name: 'Placas Símil Mármol 30x60', quantity: 1, price: 45000, variant: 'Blanco Carrara' }
    ],
    total: 45000,
    status: 'open',
    payment_status: 'pending',
    shipping_status: 'unpacked',
    created_at: '2025-01-31T11:15:00Z',
    updated_at: '2025-01-31T11:15:00Z'
  },
  {
    id: 12343,
    number: '12343',
    customer: {
      name: 'Ana López',
      email: 'ana.lopez@hotmail.com',
      phone: '+54 9 11 5555-9999'
    },
    products: [
      { id: 4, name: 'Placas Símil Ladrillo Gris', quantity: 3, price: 69942, variant: 'Pack 10 unidades' },
      { id: 5, name: 'Paneles de Follaje Artificial', quantity: 2, price: 15000, variant: '50x50cm' }
    ],
    total: 239826,
    status: 'closed',
    payment_status: 'paid',
    shipping_status: 'delivered',
    shipping_tracking: '360002399767738',
    created_at: '2025-01-30T09:45:00Z',
    updated_at: '2025-01-31T10:20:00Z'
  },
  {
    id: 12342,
    number: '12342',
    customer: {
      name: 'Carlos Ruiz',
      email: 'carlos.ruiz@yahoo.com',
      phone: '+54 9 11 3333-7777'
    },
    products: [
      { id: 6, name: 'Placas Símil Ladrillo Madera', quantity: 1, price: 69942, variant: 'Pack 10 unidades' }
    ],
    total: 69942,
    status: 'cancelled',
    payment_status: 'refunded',
    shipping_status: 'unpacked',
    created_at: '2025-01-30T16:20:00Z',
    updated_at: '2025-01-30T18:00:00Z'
  },
  {
    id: 12341,
    number: '12341',
    customer: {
      name: 'Laura Martínez',
      email: 'laura.martinez@email.com',
      phone: '+54 9 11 4444-8888'
    },
    products: [
      { id: 7, name: 'Placas Símil Ladrillo Blanco', quantity: 1, price: 69942, variant: 'Pack 10 unidades' }
    ],
    total: 69942,
    status: 'closed',
    payment_status: 'paid',
    shipping_status: 'shipped',
    shipping_tracking: '360002399767741',
    created_at: '2025-01-29T13:00:00Z',
    updated_at: '2025-01-30T09:00:00Z'
  },
  {
    id: 12340,
    number: '12340',
    customer: {
      name: 'Pedro Sánchez',
      email: 'pedro.sanchez@gmail.com',
      phone: '+54 9 11 6666-2222'
    },
    products: [
      { id: 8, name: 'Placas Símil Ladrillo Negro', quantity: 2, price: 69942, variant: 'Pack 10 unidades' }
    ],
    total: 139884,
    status: 'open',
    payment_status: 'pending',
    shipping_status: 'unpacked',
    created_at: '2025-01-29T10:30:00Z',
    updated_at: '2025-01-29T10:30:00Z'
  },
  {
    id: 12339,
    number: '12339',
    customer: {
      name: 'Sofía Díaz',
      email: 'sofia.diaz@email.com',
      phone: '+54 9 11 7777-3333'
    },
    products: [
      { id: 9, name: 'Placas Símil Mármol 70x70', quantity: 3, price: 75000, variant: 'Negro Marquina' }
    ],
    total: 225000,
    status: 'closed',
    payment_status: 'paid',
    shipping_status: 'delivered',
    shipping_tracking: '360002399767735',
    created_at: '2025-01-28T15:45:00Z',
    updated_at: '2025-01-30T14:00:00Z'
  },
  {
    id: 12338,
    number: '12338',
    customer: {
      name: 'Martín Torres',
      email: 'martin.torres@gmail.com',
      phone: '+54 9 11 8888-4444'
    },
    products: [
      { id: 10, name: 'Placas Símil Ladrillo Gris', quantity: 1, price: 69942, variant: 'Pack 10 unidades' },
      { id: 11, name: 'Placas Símil Ladrillo Blanco', quantity: 1, price: 69942, variant: 'Pack 10 unidades' }
    ],
    total: 139884,
    status: 'closed',
    payment_status: 'paid',
    shipping_status: 'shipped',
    shipping_tracking: '360002399767742',
    created_at: '2025-01-28T11:20:00Z',
    updated_at: '2025-01-29T08:00:00Z'
  }
];

export const mockTracking: Tracking[] = [
  {
    tracking_number: '360002399767740',
    order_number: '12345',
    customer_name: 'María González',
    status: 'transit',
    location: 'Centro de Distribución CABA',
    last_update: '2025-01-31T10:30:00Z',
    events: [
      { date: '2025-01-31T10:30:00Z', description: 'En tránsito hacia sucursal de destino', location: 'CABA' },
      { date: '2025-01-30T18:00:00Z', description: 'Ingresado al centro de distribución', location: 'Depósito Andreani' },
      { date: '2025-01-30T09:00:00Z', description: 'Envío despachado', location: 'Renovafacil' }
    ]
  },
  {
    tracking_number: '360002399767741',
    order_number: '12341',
    customer_name: 'Laura Martínez',
    status: 'branch',
    location: 'Sucursal Andreani - Palermo',
    last_update: '2025-01-31T08:00:00Z',
    events: [
      { date: '2025-01-31T08:00:00Z', description: 'En sucursal para retiro', location: 'Palermo' },
      { date: '2025-01-30T14:00:00Z', description: 'En tránsito', location: 'CABA' },
      { date: '2025-01-29T16:00:00Z', description: 'Envío despachado', location: 'Renovafacil' }
    ]
  },
  {
    tracking_number: '360002399767742',
    order_number: '12338',
    customer_name: 'Martín Torres',
    status: 'transit',
    location: 'En ruta a Rosario',
    last_update: '2025-01-31T06:00:00Z',
    events: [
      { date: '2025-01-31T06:00:00Z', description: 'En tránsito hacia destino', location: 'Ruta Nacional' },
      { date: '2025-01-29T10:00:00Z', description: 'Envío despachado', location: 'Renovafacil' }
    ]
  },
  {
    tracking_number: '360002399767738',
    order_number: '12343',
    customer_name: 'Ana López',
    status: 'delivered',
    location: 'Entregado',
    last_update: '2025-01-31T10:20:00Z',
    events: [
      { date: '2025-01-31T10:20:00Z', description: 'Entregado al destinatario', location: 'Domicilio' },
      { date: '2025-01-31T08:00:00Z', description: 'En distribución', location: 'CABA' },
      { date: '2025-01-30T09:00:00Z', description: 'Envío despachado', location: 'Renovafacil' }
    ]
  },
  {
    tracking_number: '360002399767735',
    order_number: '12339',
    customer_name: 'Sofía Díaz',
    status: 'delivered',
    location: 'Entregado',
    last_update: '2025-01-30T14:00:00Z',
    events: [
      { date: '2025-01-30T14:00:00Z', description: 'Entregado al destinatario', location: 'Domicilio' },
      { date: '2025-01-29T10:00:00Z', description: 'Envío despachado', location: 'Renovafacil' }
    ]
  }
];

export const mockAbandonedCarts: AbandonedCart[] = [
  {
    id: 1,
    contact_name: 'Laura Martínez',
    contact_phone: '+54 9 11 4444-8888',
    email: 'laura.martinez@email.com',
    products: [
      { name: 'Placas Símil Ladrillo Blanco', quantity: 2, price: 69942 }
    ],
    total: 139884,
    currency: 'ARS',
    recovery_url: 'https://renovafacil.store/checkout/recover/abc123',
    created_at: '2025-01-31T12:00:00Z',
    hours_abandoned: 2,
    recovered: false,
    recovery_sent: false
  },
  {
    id: 2,
    contact_name: 'Pedro Sánchez',
    contact_phone: '+54 9 11 6666-2222',
    email: 'pedro.sanchez@gmail.com',
    products: [
      { name: 'Placas Símil Ladrillo Negro', quantity: 1, price: 69942 }
    ],
    total: 69942,
    currency: 'ARS',
    recovery_url: 'https://renovafacil.store/checkout/recover/def456',
    created_at: '2025-01-31T10:00:00Z',
    hours_abandoned: 4,
    recovered: false,
    recovery_sent: false
  },
  {
    id: 3,
    contact_name: 'Sofía Díaz',
    contact_phone: '+54 9 11 7777-3333',
    email: 'sofia.diaz@email.com',
    products: [
      { name: 'Placas Símil Mármol 70x70', quantity: 3, price: 75000 }
    ],
    total: 225000,
    currency: 'ARS',
    recovery_url: 'https://renovafacil.store/checkout/recover/ghi789',
    created_at: '2025-01-31T08:00:00Z',
    hours_abandoned: 6,
    recovered: false,
    recovery_sent: true
  },
  {
    id: 4,
    contact_name: 'Diego Fernández',
    contact_phone: '+54 9 11 9999-1111',
    email: 'diego.fernandez@email.com',
    products: [
      { name: 'Placas Símil Ladrillo Gris', quantity: 1, price: 69942 },
      { name: 'Paneles de Follaje Artificial', quantity: 2, price: 15000 }
    ],
    total: 99942,
    currency: 'ARS',
    recovery_url: 'https://renovafacil.store/checkout/recover/jkl012',
    created_at: '2025-01-30T20:00:00Z',
    hours_abandoned: 18,
    recovered: true,
    recovery_sent: true
  },
  {
    id: 5,
    contact_name: 'Valentina Romero',
    contact_phone: '+54 9 11 2222-6666',
    email: 'valentina.romero@gmail.com',
    products: [
      { name: 'Placas Símil Ladrillo Madera', quantity: 2, price: 69942 }
    ],
    total: 139884,
    currency: 'ARS',
    recovery_url: 'https://renovafacil.store/checkout/recover/mno345',
    created_at: '2025-01-30T15:00:00Z',
    hours_abandoned: 23,
    recovered: false,
    recovery_sent: false
  }
];

export const mockComprobantes: Comprobante[] = [
  {
    id: 'comp-001',
    date: '2025-01-31T14:30:00Z',
    sender_phone: '+54 9 11 2345-6789',
    order_number: '12345',
    amount: 209826,
    fecha: '31/01/2025',
    origen: 'MercadoPago',
    titular_origen: 'María González',
    referencia: '1234567890',
    tipo: 'Transferencia',
    concepto: 'Pedido #12345',
    status: 'verified'
  },
  {
    id: 'comp-002',
    date: '2025-01-31T11:15:00Z',
    sender_phone: '+54 9 11 8765-4321',
    order_number: '12344',
    amount: 45000,
    fecha: '31/01/2025',
    origen: 'Santander',
    titular_origen: 'Juan Pérez',
    referencia: '9876543210',
    tipo: 'Transferencia',
    concepto: 'Pedido #12344',
    status: 'pending'
  },
  {
    id: 'comp-003',
    date: '2025-01-31T09:45:00Z',
    sender_phone: '+54 9 11 5555-9999',
    order_number: '12343',
    amount: 239826,
    fecha: '30/01/2025',
    origen: 'BBVA',
    titular_origen: 'Ana López',
    referencia: '4567891234',
    tipo: 'Transferencia',
    concepto: 'Pedido #12343',
    status: 'verified'
  },
  {
    id: 'comp-004',
    date: '2025-01-30T16:20:00Z',
    sender_phone: '+54 9 11 3333-7777',
    amount: 69942,
    fecha: '30/01/2025',
    origen: 'Galicia',
    titular_origen: 'Carlos Ruiz',
    referencia: '7891234567',
    tipo: 'Transferencia',
    concepto: 'Pedido #12342',
    status: 'rejected'
  },
  {
    id: 'comp-005',
    date: '2025-01-30T13:00:00Z',
    sender_phone: '+54 9 11 4444-8888',
    order_number: '12341',
    amount: 69942,
    fecha: '30/01/2025',
    origen: 'Naranja X',
    titular_origen: 'Laura Martínez',
    referencia: '3216549870',
    tipo: 'Transferencia',
    concepto: 'Pedido #12341',
    status: 'verified'
  }
];

export const mockBotMetrics: BotMetrics = {
  date: '2025-01-31',
  messages_received: 45,
  messages_sent: 52,
  ai_responses: 23,
  order_queries: 8,
  tracking_queries: 12,
  new_users: 5,
  errors: {
    ai: 0,
    send: 1,
    webhook: 0
  }
};

export const mockDashboardSummary: DashboardSummary = {
  sales: {
    today: 254826,
    yesterday: 198500,
    week: 1453200,
    month: 5234500
  },
  orders: {
    today: 5,
    pending: 2,
    in_transit: 3,
    delivered: 45
  },
  tracking: {
    active: 8,
    pending: 2,
    delivered_today: 2
  },
  abandoned_carts: {
    total: 45,
    last_24h: 12,
    recovered: 8,
    conversion_rate: 18
  },
  bot_metrics: mockBotMetrics
};

export const mockSalesData: SalesData[] = [
  { date: '2025-01-25', amount: 180000, orders: 4 },
  { date: '2025-01-26', amount: 245000, orders: 6 },
  { date: '2025-01-27', amount: 198000, orders: 5 },
  { date: '2025-01-28', amount: 312000, orders: 8 },
  { date: '2025-01-29', amount: 267000, orders: 7 },
  { date: '2025-01-30', amount: 198500, orders: 5 },
  { date: '2025-01-31', amount: 254826, orders: 5 }
];

export const mockBotHistory = [
  { date: '2025-01-25', messages: 32, ai_responses: 18, orders: 4, tracking: 8 },
  { date: '2025-01-26', messages: 41, ai_responses: 22, orders: 6, tracking: 10 },
  { date: '2025-01-27', messages: 38, ai_responses: 20, orders: 5, tracking: 9 },
  { date: '2025-01-28', messages: 52, ai_responses: 28, orders: 8, tracking: 14 },
  { date: '2025-01-29', messages: 45, ai_responses: 24, orders: 7, tracking: 11 },
  { date: '2025-01-30', messages: 39, ai_responses: 21, orders: 5, tracking: 10 },
  { date: '2025-01-31', messages: 45, ai_responses: 23, orders: 8, tracking: 12 }
];
