// Tipos principales del Dashboard de Renovafacil

export interface Order {
  id: number;
  number: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  products: OrderProduct[];
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  shipping_status: 'unpacked' | 'packed' | 'shipped' | 'delivered';
  shipping_tracking?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderProduct {
  id: number;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface Tracking {
  tracking_number: string;
  order_number: string;
  customer_name: string;
  status: 'preparation' | 'shipped' | 'transit' | 'branch' | 'delivered';
  location?: string;
  last_update: string;
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  description: string;
  location?: string;
}

export interface AbandonedCart {
  id: number;
  contact_name: string;
  contact_phone: string;
  email?: string;
  products: CartProduct[];
  total: number;
  currency: string;
  recovery_url: string;
  created_at: string;
  hours_abandoned: number;
  recovered?: boolean;
  recovery_sent?: boolean;
}

export interface CartProduct {
  name: string;
  quantity: number;
  price: number;
}

export interface Comprobante {
  id: string;
  date: string;
  sender_phone: string;
  order_number?: string;
  amount?: number;
  fecha?: string;
  origen?: string;
  titular_origen?: string;
  referencia?: string;
  tipo?: string;
  concepto?: string;
  status: 'pending' | 'verified' | 'rejected';
  image_url?: string;
}

export interface BotMetrics {
  date: string;
  messages_received: number;
  messages_sent: number;
  ai_responses: number;
  order_queries: number;
  tracking_queries: number;
  new_users: number;
  errors: {
    ai: number;
    send: number;
    webhook: number;
  };
}

export interface DashboardSummary {
  sales: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
  };
  orders: {
    today: number;
    pending: number;
    in_transit: number;
    delivered: number;
  };
  tracking: {
    active: number;
    pending: number;
    delivered_today: number;
  };
  abandoned_carts: {
    total: number;
    last_24h: number;
    recovered: number;
    conversion_rate: number;
  };
  bot_metrics: BotMetrics;
}

export interface SalesData {
  date: string;
  amount: number;
  orders: number;
}

export type OrderStatus = 'open' | 'closed' | 'cancelled' | 'pending';
export type ShippingStatus = 'unpacked' | 'packed' | 'shipped' | 'delivered' | 'in_transit';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
