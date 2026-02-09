/**
 * API Service - Cliente para conectarse al backend Flask
 * ======================================================
 * Consume los endpoints del bot de WhatsApp RenovaFacil
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Headers comunes para todas las requests
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Si hay API key configurada, agregarla
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
};

// Helper para manejar errores de fetch
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// =============================================================================
// DASHBOARD SUMMARY
// =============================================================================

export interface DashboardSummary {
  timestamp: string;
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

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_URL}/api/dashboard/summary`, {
    headers: getHeaders(),
  });
  return handleResponse<DashboardSummary>(response);
}

// =============================================================================
// ORDERS
// =============================================================================

export interface Order {
  id: number;
  number: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    variant: string;
  }>;
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  payment_status: string;
  shipping_status: string;
  shipping_tracking?: string;
  created_at: string;
  updated_at: string;
}

export interface OrdersResponse {
  orders: Order[];
  count: number;
  page: number;
  limit: number;
}

export async function fetchOrders(params?: {
  status?: string;
  limit?: number;
  page?: number;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.page) searchParams.append('page', params.page.toString());

  const url = `${API_URL}/api/orders?${searchParams.toString()}`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse<OrdersResponse>(response);
}

export async function fetchOrderDetail(orderId: string): Promise<Order> {
  const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
    headers: getHeaders(),
  });
  return handleResponse<Order>(response);
}

// =============================================================================
// TRACKING
// =============================================================================

export interface TrackingEvent {
  date: string;
  description: string;
  location: string;
}

export interface Tracking {
  tracking_number: string;
  order_number: string;
  customer_name: string;
  status: 'pending' | 'transit' | 'branch' | 'delivered';
  location: string;
  last_update: string;
  events?: TrackingEvent[];
}

export interface TrackingResponse {
  trackings: Tracking[];
  count: number;
}

export async function fetchTrackingList(): Promise<TrackingResponse> {
  const response = await fetch(`${API_URL}/api/tracking`, {
    headers: getHeaders(),
  });
  return handleResponse<TrackingResponse>(response);
}

export async function fetchTrackingDetail(trackingNumber: string): Promise<Tracking> {
  const response = await fetch(`${API_URL}/api/tracking/${trackingNumber}`, {
    headers: getHeaders(),
  });
  return handleResponse<Tracking>(response);
}

// =============================================================================
// ABANDONED CARTS
// =============================================================================

export interface AbandonedCart {
  id: number;
  contact_name: string;
  contact_phone: string;
  email: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency: string;
  recovery_url: string;
  created_at: string;
  hours_abandoned: number;
  recovered: boolean;
  recovery_sent: boolean;
}

export interface AbandonedCartsResponse {
  carts: AbandonedCart[];
  count: number;
  hours_searched: number;
}

export async function fetchAbandonedCarts(params?: {
  hours?: number;
  limit?: number;
}): Promise<AbandonedCartsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.hours) searchParams.append('hours', params.hours.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const url = `${API_URL}/api/abandoned-carts?${searchParams.toString()}`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse<AbandonedCartsResponse>(response);
}

export async function recoverCart(cartId: number, force?: boolean): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/abandoned-carts/${cartId}/recover`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ force }),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
}

// =============================================================================
// METRICS
// =============================================================================

export interface BotMetrics {
  date: string;
  messages_received: number;
  messages_sent: number;
  ai_responses: number;
  order_queries: number;
  tracking_queries: number;
  new_users: number;
  errors?: {
    ai: number;
    send: number;
    webhook: number;
  };
}

export interface MetricsHistoryItem {
  date: string;
  messages_received: number;
  messages_sent: number;
  ai_responses: number;
  order_queries: number;
  tracking_queries: number;
  new_users: number;
}

export interface MetricsHistoryResponse {
  range: number;
  history: MetricsHistoryItem[];
}

export async function fetchBotMetrics(date?: string): Promise<BotMetrics> {
  const url = date
    ? `${API_URL}/api/metrics?date=${date}`
    : `${API_URL}/api/metrics`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse<BotMetrics>(response);
}

export async function fetchMetricsHistory(days: number): Promise<MetricsHistoryResponse> {
  const response = await fetch(`${API_URL}/api/metrics?range=${days}`, {
    headers: getHeaders(),
  });
  return handleResponse<MetricsHistoryResponse>(response);
}

export interface SalesMetrics {
  today: { sales: number; orders: number };
  week: { sales: number; orders: number };
  month: { sales: number; orders: number };
}

export async function fetchSalesMetrics(): Promise<SalesMetrics> {
  const response = await fetch(`${API_URL}/api/metrics/sales`, {
    headers: getHeaders(),
  });
  return handleResponse<SalesMetrics>(response);
}

// =============================================================================
// SYSTEM STATUS
// =============================================================================

export interface SystemStatus {
  status: string;
  timestamp: string;
  services: {
    redis: string;
    whatsapp: string;
    tiendanube: string;
    andreani: string;
  };
  schedulers: {
    abandoned_carts: { running: boolean };
    proactive_notifications: { running: boolean };
    reviews: { running: boolean };
    reorder_reminders: { running: boolean };
  };
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${API_URL}/api/system/status`, {
    headers: getHeaders(),
  });
  return handleResponse<SystemStatus>(response);
}

// =============================================================================
// CONVERSATIONS
// =============================================================================

export interface Conversation {
  phone_masked: string;
  message_count: number;
  last_message: {
    role: string;
    content: string;
  };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  count: number;
}

export async function fetchConversations(limit?: number): Promise<ConversationsResponse> {
  const url = limit
    ? `${API_URL}/api/system/conversations?limit=${limit}`
    : `${API_URL}/api/system/conversations`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse<ConversationsResponse>(response);
}

// =============================================================================
// SELF IMPROVEMENT / AUTO-MEJORAS
// =============================================================================

export interface ImprovementStats {
  pending_suggestions: number;
  active_mutations: number;
  approved_total: number;
  rejected_total: number;
  approval_rate: number;
  config?: {
    dynamic_responses: number;
    prompt_additions: number;
    objection_handlers: number;
    failed_rules: number;
    total_active: number;
  };
}

export interface Suggestion {
  id: string;
  type: 'cached_response' | 'objection_handler' | 'prompt_addition' | 'failed_response';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  patterns?: string[];
  triggers?: string[];
  suggested_response?: string;
  content?: string;
  rule?: string;
  reason?: string;
  examples?: Array<{ user: string; bot: string }>;
  date?: string;
  created_at?: string;
  approved_at?: string;
  rejected_at?: string;
  edited_content?: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  count: number;
  total: number;
}

export interface Mutation {
  id: string;
  type: 'cached_response' | 'objection_handler' | 'prompt_addition' | 'failed_response';
  patterns?: string[];
  triggers?: string[];
  response?: string;
  content?: string;
  rule?: string;
  created_at?: string;
  uses: number;
}

export interface MutationsResponse {
  mutations: Mutation[];
  count: number;
}

export interface AnalysisResult {
  success: boolean;
  message?: string;
  date?: string;
  conversations_analyzed?: number;
  suggestions?: Suggestion[];
  summary?: {
    total_conversations: number;
    patterns_found: number;
    issues_detected: number;
  };
}

export async function fetchImprovementStats(): Promise<ImprovementStats> {
  const response = await fetch(`${API_URL}/api/improvements/stats`, {
    headers: getHeaders(),
  });
  return handleResponse<ImprovementStats>(response);
}

export async function fetchSuggestions(status?: string): Promise<SuggestionsResponse> {
  const url = status
    ? `${API_URL}/api/improvements/suggestions?status=${status}`
    : `${API_URL}/api/improvements/suggestions`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse<SuggestionsResponse>(response);
}

export async function fetchMutations(): Promise<MutationsResponse> {
  const response = await fetch(`${API_URL}/api/improvements/mutations`, {
    headers: getHeaders(),
  });
  return handleResponse<MutationsResponse>(response);
}

export async function approveSuggestion(
  suggestionId: string,
  editedContent?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/improvements/suggestions/${suggestionId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ edited_content: editedContent }),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
}

export async function rejectSuggestion(
  suggestionId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/improvements/suggestions/${suggestionId}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
}

export async function triggerAnalysis(date?: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/api/improvements/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ date }),
  });
  return handleResponse<AnalysisResult>(response);
}

export async function deactivateMutation(
  mutationId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/improvements/mutations/${mutationId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
}
