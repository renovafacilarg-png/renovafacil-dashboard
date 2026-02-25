import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageCircle, ArrowLeft, RefreshCw, Loader2, Phone, Search,
  CheckCheck, Check, Send, Tag, ShoppingBag, CheckCircle, Info,
  Package, DollarSign,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { API_URL, getHeaders } from '@/lib/api';
import { getInitials, getAvatarColor } from '@/lib/avatar';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  timestamp: string;
  phone: string;
  phone_masked: string;
  direction: 'incoming' | 'outgoing';
  message: string;
  message_type: string;
  contact_name: string;
}

interface Conversation {
  phone: string;
  phone_masked: string;
  contact_name: string;
  last_message: string;
  last_message_time: string;
  direction: string;
  message_count: number;
}

interface ContactInfo {
  phone: string;
  name: string | null;
  orders: OrderSummary[];
  order_count: number;
  total_spent: number;
  last_order: OrderSummary | null;
}

interface OrderSummary {
  number: string;
  status: string;
  payment_status: string;
  shipping_status: string;
  total: string;
  currency: string;
  created_at: string;
}

type FilterType = 'all' | 'unread' | 'incoming' | 'outgoing';
type ChannelType = 'wa' | 'messenger' | 'instagram';

interface InboxViewProps {
  channel?: ChannelType;
  initialPhone?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLastReadKey(phone: string) {
  return `inbox_last_read_${phone}`;
}

function getLastReadTime(phone: string): number {
  try {
    return Number(localStorage.getItem(getLastReadKey(phone)) || '0');
  } catch {
    return 0;
  }
}

function markAsRead(phone: string) {
  localStorage.setItem(getLastReadKey(phone), String(Date.now()));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InboxView({ channel = 'wa', initialPhone }: InboxViewProps = {}) {
  // Cached conversations from localStorage
  const getCachedConversations = (): Conversation[] => {
    try {
      const cached = localStorage.getItem('inbox_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  // ---- State ----
  const [conversations, setConversations] = useState<Conversation[]>(getCachedConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(getCachedConversations().length === 0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTestChats, setShowTestChats] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Send message state
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Contact info cache
  const [contactInfoCache, setContactInfoCache] = useState<Record<string, ContactInfo>>({});
  const [loadingContactInfo, setLoadingContactInfo] = useState<Record<string, boolean>>({});

  // Panels
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('10');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---- Is user scrolled near bottom? ----
  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
  }, []);

  // ---- Data fetching ----

  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading && conversations.length === 0) setLoading(true);
      const response = await fetch(`${API_URL}/api/conversations?limit=500`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const newConvs = data.conversations || [];
        setConversations(newConvs);
        setLastUpdated(new Date());
        localStorage.setItem('inbox_conversations', JSON.stringify(newConvs));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(async (phone: string, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setLoadingMessages(true);
      const response = await fetch(`${API_URL}/api/conversations/${phone}?limit=500`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const wasAtBottom = isNearBottom();
        setMessages(data.messages || []);
        if (!isAutoRefresh || wasAtBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: isAutoRefresh ? 'auto' : 'smooth' });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!isAutoRefresh) setLoadingMessages(false);
    }
  }, [isNearBottom]);

  const fetchContactInfo = useCallback(async (phone: string) => {
    if (contactInfoCache[phone] || loadingContactInfo[phone]) return;
    setLoadingContactInfo(prev => ({ ...prev, [phone]: true }));
    try {
      const response = await fetch(`${API_URL}/api/contact-info/${phone}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data: ContactInfo = await response.json();
        setContactInfoCache(prev => ({ ...prev, [phone]: data }));
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoadingContactInfo(prev => ({ ...prev, [phone]: false }));
    }
  }, [contactInfoCache, loadingContactInfo]);

  // ---- Send message ----

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;
    const text = messageText.trim();
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/send-manual-message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone: selectedConversation, message: text }),
      });
      if (response.ok) {
        setMessageText('');
        toast.success('Mensaje enviado');
        // Refresh messages immediately
        fetchMessages(selectedConversation);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Error enviando mensaje');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  // ---- Send discount ----

  const handleSendDiscount = async () => {
    if (!selectedConversation) return;
    // Codigos reales del backend (product_catalog.py CUPONES)
    const DISCOUNT_CODES: Record<string, string> = {
      '5': 'CLIENTEFIEL',
      '10': 'CLIENTEESPECIAL',
      '15': 'CLIENTEUNICO',
    };
    const code = DISCOUNT_CODES[discountPercent] || `DESCUENTO${discountPercent}`;
    const msg = `🎁 ¡Tenemos un descuento especial para vos! Usá el código *${code}* y obtené un *${discountPercent}% OFF* en tu próxima compra. ¡Aprovechá! 🛒`;
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/send-manual-message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone: selectedConversation, message: msg }),
      });
      if (response.ok) {
        toast.success(`Descuento ${discountPercent}% enviado`);
        setShowDiscountDialog(false);
        fetchMessages(selectedConversation);
      } else {
        toast.error('Error enviando descuento');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  // ---- Unread detection ----

  const isUnread = useCallback((conv: Conversation) => {
    if (conv.direction !== 'incoming') return false;
    const lastRead = getLastReadTime(conv.phone);
    try {
      const msgTime = new Date(conv.last_message_time).getTime();
      return msgTime > lastRead;
    } catch {
      return false;
    }
  }, []);

  // ---- Effects ----

  useEffect(() => {
    fetchConversations(true);
    const interval = setInterval(() => fetchConversations(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select conversation when arriving from carritos
  useEffect(() => {
    if (!initialPhone || conversations.length === 0) return;
    const normalized = initialPhone.replace(/\D/g, '');
    const match = conversations.find(c => c.phone.replace(/\D/g, '').endsWith(normalized) || normalized.endsWith(c.phone.replace(/\D/g, '')));
    setSelectedConversation(match ? match.phone : initialPhone);
  }, [initialPhone, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      fetchContactInfo(selectedConversation);
      markAsRead(selectedConversation);
      const interval = setInterval(() => fetchMessages(selectedConversation, true), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  // ---- Format helpers ----

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es });
    } catch {
      return timestamp;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ---- Display name (real name or fallback) ----

  const getDisplayName = useCallback((conv: Conversation) => {
    const info = contactInfoCache[conv.phone];
    if (info?.name) return info.name;
    return conv.contact_name || conv.phone;
  }, [contactInfoCache]);

  // ---- Filter conversations ----

  const isTestConversation = (conv: Conversation) => {
    const phone = (conv.phone || '').toLowerCase();
    return phone.startsWith('test') ||
           phone.includes('test_') ||
           phone.startsWith('final') ||
           phone.startsWith('conflict') ||
           phone.startsWith('retest') ||
           phone.startsWith('context') ||
           phone.startsWith('order') ||
           phone.startsWith('simple') ||
           phone.startsWith('buy');
  };

  // Filter by channel: wa = regular phones, messenger = fb:*, instagram = ig:*
  const channelConversations = useMemo(() => {
    return conversations.filter(conv => {
      const p = conv.phone || '';
      if (channel === 'messenger') return p.startsWith('fb:');
      if (channel === 'instagram') return p.startsWith('ig:');
      return !p.startsWith('fb:') && !p.startsWith('ig:');
    });
  }, [conversations, channel]);

  const realConversations = channelConversations.filter(conv => !isTestConversation(conv));
  const testConversations = channelConversations.filter(conv => isTestConversation(conv));

  const baseConversations = showTestChats ? testConversations : realConversations;

  // Apply search + filter
  const filteredConversations = useMemo(() => {
    let result = baseConversations.filter(conv =>
      (conv.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.phone || '').includes(searchTerm) ||
      (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contactInfoCache[conv.phone]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter === 'unread') {
      result = result.filter(isUnread);
    } else if (filter === 'incoming') {
      result = result.filter(c => c.direction === 'incoming');
    } else if (filter === 'outgoing') {
      result = result.filter(c => c.direction === 'outgoing');
    }

    // Sort: unread first, then by time
    result.sort((a, b) => {
      const aUnread = isUnread(a) ? 1 : 0;
      const bUnread = isUnread(b) ? 1 : 0;
      if (aUnread !== bUnread) return bUnread - aUnread;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return result;
  }, [baseConversations, searchTerm, filter, isUnread, contactInfoCache]);

  const unreadCount = useMemo(
    () => baseConversations.filter(isUnread).length,
    [baseConversations, isUnread]
  );

  // ---- Messages grouped by day ----

  const groupedMessages = useMemo(() => {
    const groups: { label: string; date: Date; messages: Message[] }[] = [];

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp);
      const existing = groups.find(g => isSameDay(g.date, msgDate));
      if (existing) {
        existing.messages.push(msg);
      } else {
        let label: string;
        if (isToday(msgDate)) {
          label = 'Hoy';
        } else if (isYesterday(msgDate)) {
          label = 'Ayer';
        } else {
          label = format(msgDate, "d MMM yyyy", { locale: es });
        }
        groups.push({ label, date: msgDate, messages: [msg] });
      }
    }

    return groups;
  }, [messages]);

  // ---- Fetch contact info for visible conversations ----

  useEffect(() => {
    const phones = filteredConversations.slice(0, 20).map(c => c.phone);
    for (const phone of phones) {
      if (!contactInfoCache[phone] && !loadingContactInfo[phone]) {
        fetchContactInfo(phone);
      }
    }
  }, [filteredConversations]);

  // ---- Selected conversation data ----

  const selectedConvData = conversations.find(c => c.phone === selectedConversation);
  const selectedContactInfo = selectedConversation ? contactInfoCache[selectedConversation] : null;

  // ---- Handle select conversation ----

  const handleSelectConversation = (phone: string) => {
    setSelectedConversation(phone);
    markAsRead(phone);
  };

  // ---- Mark as attended ----

  const handleMarkAttended = () => {
    if (selectedConversation) {
      markAsRead(selectedConversation);
      setConversations(prev => [...prev]); // force re-render
      toast.success('Conversación marcada como atendida');
    }
  };

  // ---- Render ----

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {showTestChats
              ? 'Chats de Prueba'
              : channel === 'messenger'
              ? 'Inbox Messenger'
              : channel === 'instagram'
              ? 'Inbox Instagram'
              : 'Inbox WhatsApp'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {showTestChats
              ? `${testConversations.length} conversaciones de prueba`
              : `${realConversations.length} conversaciones`}
            {!showTestChats && channel === 'wa' && testConversations.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({testConversations.length} de prueba ocultas)
              </span>
            )}
            {lastUpdated && (
              <span className="ml-1.5 text-xs text-gray-400">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {channel === 'wa' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTestChats(!showTestChats)}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              {showTestChats ? 'Ver Reales' : 'Ver Pruebas'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchConversations()}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-900 gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Main two-pane layout ── */}
      <div className="flex-1 flex gap-0 min-h-0 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">

        {/* ── Left panel: conversation list ── */}
        <div
          className={cn(
            'flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-800 flex-shrink-0',
            selectedConversation ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Search + filters */}
          <div className="p-3 space-y-2 border-b border-gray-100 dark:border-gray-800">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 text-sm rounded-lg',
                  'bg-gray-50 dark:bg-gray-900 border-0 outline-none',
                  'focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-primary/30',
                  'placeholder:text-gray-400 text-gray-900 dark:text-gray-100',
                  'transition-all duration-150'
                )}
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              {(['all', 'unread', 'incoming', 'outgoing'] as FilterType[]).map((f) => {
                const labels: Record<FilterType, string> = {
                  all: 'Todos',
                  unread: 'No leídos',
                  incoming: 'Consultas',
                  outgoing: 'Enviados',
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'flex-1 text-xs px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 font-medium whitespace-nowrap',
                      filter === f
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    {labels[f]}
                    {f === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 text-[10px] bg-primary text-white rounded-full px-1 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation list body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              // Skeleton loading state
              <div className="p-3 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <MessageCircle className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay conversaciones</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  {filter !== 'all'
                    ? 'Cambiá el filtro para ver más'
                    : showTestChats
                    ? 'No hay chats de prueba'
                    : 'Los chats aparecerán aquí'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const unread = isUnread(conv);
                const isSelected = selectedConversation === conv.phone;
                return (
                  <div
                    key={conv.phone}
                    onClick={() => handleSelectConversation(conv.phone)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150',
                      isSelected
                        ? 'bg-primary/5 border-l-2 border-primary'
                        : 'border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      getAvatarColor(conv.phone)
                    )}>
                      <span className="text-white text-xs font-semibold">
                        {getInitials(getDisplayName(conv))}
                      </span>
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-white dark:border-gray-950" />
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={cn(
                          'text-sm truncate',
                          unread
                            ? 'font-semibold text-gray-900 dark:text-gray-50'
                            : 'font-medium text-gray-900 dark:text-gray-100'
                        )}>
                          {getDisplayName(conv)}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(conv.last_message_time)}
                        </span>
                      </div>
                      <p className={cn(
                        'text-xs truncate',
                        unread
                          ? 'text-gray-700 dark:text-gray-300 font-medium'
                          : 'text-gray-500 dark:text-gray-500'
                      )}>
                        {conv.direction === 'outgoing' && (
                          <CheckCheck className="inline h-3 w-3 mr-0.5 text-gray-400" />
                        )}
                        {conv.last_message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">

            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-gray-500"
                onClick={() => setSelectedConversation(null)}
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                selectedConversation ? getAvatarColor(selectedConversation) : 'bg-primary'
              )}>
                <span className="text-white text-xs font-semibold">
                  {selectedConvData ? getInitials(getDisplayName(selectedConvData)) : ''}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">
                  {selectedConvData ? getDisplayName(selectedConvData) : ''}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  {selectedConvData?.phone}
                  {selectedContactInfo?.order_count !== undefined && selectedContactInfo.order_count > 0 && (
                    <span className="ml-1">
                      · {selectedContactInfo.order_count} {selectedContactInfo.order_count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <TooltipProvider>
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => setShowDiscountDialog(true)}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enviar descuento</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => setShowInfoSheet(true)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Info del cliente</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={handleMarkAttended}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Marcar atendido</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => fetchMessages(selectedConversation)}
                        disabled={loadingMessages}
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', loadingMessages && 'animate-spin')} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Actualizar</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/50 dark:bg-gray-900/30"
            >
              {loadingMessages && messages.length === 0 ? (
                // Skeleton for messages
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn('flex animate-pulse', i % 2 === 0 ? 'justify-start' : 'justify-end')}
                    >
                      <div className={cn(
                        'h-9 rounded-2xl bg-gray-100 dark:bg-gray-800',
                        i % 2 === 0 ? 'w-48' : 'w-36'
                      )} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sin mensajes</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.label}>
                    {/* Day separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    </div>

                    {/* Messages for this day */}
                    <div className="space-y-1.5">
                      {group.messages.map((msg, idx) => (
                        <div
                          key={msg.id || `${group.label}-${idx}`}
                          className={cn(
                            'flex',
                            msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div className="flex flex-col max-w-[72%]">
                            {/* Bubble */}
                            <div
                              className={cn(
                                'px-4 py-2.5',
                                msg.direction === 'outgoing'
                                  ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.message}
                              </p>
                            </div>

                            {/* Timestamp below bubble */}
                            <div className={cn(
                              'flex items-center gap-1 mt-0.5',
                              msg.direction === 'outgoing' ? 'justify-end pr-0.5' : 'justify-start pl-0.5'
                            )}>
                              {msg.message_type !== 'text' && (
                                <span className="text-[10px] text-gray-400">({msg.message_type})</span>
                              )}
                              <span className="text-[10px] text-gray-400">
                                {formatMessageTime(msg.timestamp)}
                              </span>
                              {msg.direction === 'outgoing' && (
                                <Check className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Escribí un mensaje..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className={cn(
                    'min-h-10 max-h-32 resize-none text-sm rounded-xl',
                    'bg-gray-50 dark:bg-gray-900 border-0',
                    'focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
                    'placeholder:text-gray-400'
                  )}
                  rows={1}
                  disabled={sending}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-white"
                  aria-label="Enviar mensaje"
                >
                  {sending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Empty right pane
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/50 dark:bg-gray-900/20">
            <div className="text-center">
              <MessageCircle className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Seleccioná una conversación
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                Elegí un chat de la lista para ver los mensajes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---- Client Info Sheet ---- */}
      <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2.5">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                selectedConversation ? getAvatarColor(selectedConversation) : 'bg-primary'
              )}>
                <span className="text-white text-xs font-semibold">
                  {getInitials(selectedContactInfo?.name || selectedConvData?.contact_name || 'Cliente')}
                </span>
              </div>
              <span>{selectedContactInfo?.name || selectedConvData?.contact_name || 'Cliente'}</span>
            </SheetTitle>
            <SheetDescription className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3 w-3" />
              {selectedConvData?.phone}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-center">
                <Package className="h-4 w-4 mx-auto mb-1.5 text-gray-400" />
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {selectedContactInfo?.order_count ?? '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pedidos</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-center">
                <DollarSign className="h-4 w-4 mx-auto mb-1.5 text-emerald-500" />
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {selectedContactInfo?.total_spent
                    ? `$${selectedContactInfo.total_spent.toLocaleString('es-AR')}`
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Gasto total</p>
              </div>
            </div>

            {/* Orders list */}
            {selectedContactInfo?.orders && selectedContactInfo.orders.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                  Pedidos recientes
                </h4>
                <div className="space-y-2">
                  {selectedContactInfo.orders.map((order) => (
                    <div
                      key={order.number}
                      className="rounded-xl bg-gray-50 dark:bg-gray-900 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          #{order.number}
                        </span>
                        <Badge
                          variant={
                            order.payment_status === 'paid' ? 'default' :
                            order.payment_status === 'pending' ? 'secondary' : 'outline'
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {order.payment_status === 'paid' ? 'Pagado' :
                           order.payment_status === 'pending' ? 'Pendiente' :
                           order.payment_status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>${Number(order.total).toLocaleString('es-AR')} {order.currency}</span>
                        <span>
                          {order.created_at
                            ? format(parseISO(order.created_at), "d MMM yyyy", { locale: es })
                            : ''}
                        </span>
                      </div>
                      {order.shipping_status && (
                        <div className="mt-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {order.shipping_status === 'shipped' ? 'Enviado' :
                             order.shipping_status === 'delivered' ? 'Entregado' :
                             order.shipping_status === 'unshipped' ? 'Sin enviar' :
                             order.shipping_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingContactInfo[selectedConversation || ''] && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            )}

            {selectedContactInfo && selectedContactInfo.orders.length === 0 && (
              <div className="text-center py-8">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin pedidos registrados</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- Discount Dialog ---- */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-gray-500" />
              Enviar descuento
            </DialogTitle>
            <DialogDescription className="text-sm">
              Se enviará un mensaje con un código de descuento al cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Porcentaje de descuento
            </label>
            <Select value={discountPercent} onValueChange={setDiscountPercent}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="15">15%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="30">30%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiscountDialog(false)}
              className="text-gray-500"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSendDiscount}
              disabled={sending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {sending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <Send className="h-3.5 w-3.5 mr-1.5" />
              }
              Enviar {discountPercent}% OFF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
