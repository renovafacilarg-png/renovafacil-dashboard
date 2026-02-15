import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Inbox, CheckCheck, Check, Send, Tag, ShoppingBag, CheckCircle, Info,
  Package, DollarSign,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { API_URL, getHeaders } from '@/lib/api';
import { getInitials, getAvatarColor } from '@/lib/avatar';

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

export function InboxView() {
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

  const realConversations = conversations.filter(conv => !isTestConversation(conv));
  const testConversations = conversations.filter(conv => isTestConversation(conv));

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
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary" />
            {showTestChats ? 'Chats de Prueba' : 'Bandeja de Entrada'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showTestChats
              ? `${testConversations.length} conversaciones de prueba`
              : `${realConversations.length} conversaciones reales`}
            {!showTestChats && testConversations.length > 0 && (
              <span className="ml-2 text-xs">({testConversations.length} de prueba ocultas)</span>
            )}
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showTestChats ? "default" : "outline"}
            onClick={() => setShowTestChats(!showTestChats)}
            size="sm"
          >
            {showTestChats ? 'Ver Reales' : 'Ver Pruebas'}
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchConversations()}
            disabled={loading}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations list */}
        <Card className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 overflow-hidden`}>
          <div className="p-3 border-b bg-muted/30 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            {/* Quick filters */}
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter('unread')}
              >
                No leídos {unreadCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{unreadCount}</Badge>}
              </Button>
              <Button
                variant={filter === 'incoming' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter('incoming')}
              >
                Consultas
              </Button>
              <Button
                variant={filter === 'outgoing' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter('outgoing')}
              >
                Enviados
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">No hay conversaciones</p>
                <p className="text-sm mt-1">{filter !== 'all' ? 'Cambiá el filtro para ver más' : showTestChats ? 'No hay chats de prueba' : 'Los chats aparecerán aquí'}</p>
              </div>
            ) : (
              <div className="animate-stagger">
                {filteredConversations.map((conv) => {
                  const unread = isUnread(conv);
                  return (
                    <div
                      key={conv.phone}
                      onClick={() => handleSelectConversation(conv.phone)}
                      className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-primary/5 ${
                        selectedConversation === conv.phone
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : ''
                      } ${unread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`relative w-11 h-11 rounded-full ${getAvatarColor(conv.phone)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-white text-sm font-bold">{getInitials(getDisplayName(conv))}</span>
                          {unread && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`truncate ${unread ? 'font-bold' : 'font-semibold'}`}>
                              {getDisplayName(conv)}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatTime(conv.last_message_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {conv.direction === 'incoming' && (
                              <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded font-medium">
                                Nuevo
                              </span>
                            )}
                            <p className={`text-sm truncate ${unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {conv.direction === 'outgoing' && (
                                <CheckCheck className="inline h-3.5 w-3.5 mr-1 text-primary" />
                              )}
                              {conv.last_message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{conv.phone}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{conv.message_count} mensajes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Messages view */}
        {selectedConversation ? (
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={`w-11 h-11 rounded-full ${selectedConversation ? getAvatarColor(selectedConversation) : 'bg-primary'} flex items-center justify-center shadow-lg shadow-primary/20`}>
                <span className="text-white text-sm font-bold">{selectedConvData ? getInitials(getDisplayName(selectedConvData)) : ''}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {selectedConvData ? getDisplayName(selectedConvData) : ''}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedConvData?.phone}
                </p>
              </div>

              {/* Quick actions */}
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10"
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
                        size="icon"
                        className="hover:bg-primary/10"
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
                        size="icon"
                        className="hover:bg-primary/10"
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
                        size="icon"
                        onClick={() => fetchMessages(selectedConversation)}
                        disabled={loadingMessages}
                        className="hover:bg-primary/10"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Actualizar</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            {/* Messages with date separators */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-muted/20 to-muted/40"
            >
              {loadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No hay mensajes</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.label}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-medium whitespace-nowrap">
                        {group.label}
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    {/* Messages for this day */}
                    <div className="space-y-3">
                      {group.messages.map((msg, idx) => (
                        <div
                          key={msg.id || `${group.label}-${idx}`}
                          className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                              msg.direction === 'outgoing'
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-background border rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                            <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${
                              msg.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {msg.message_type !== 'text' && (
                                <span className="text-xs">({msg.message_type})</span>
                              )}
                              <span className="text-xs">{formatMessageTime(msg.timestamp)}</span>
                              {msg.direction === 'outgoing' && (
                                <Check className="h-3.5 w-3.5" />
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
            <div className="p-3 border-t bg-muted/20">
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
                  className="min-h-10 max-h-32 resize-none bg-background"
                  rows={1}
                  disabled={sending}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="flex-shrink-0 h-10 w-10"
                  aria-label="Enviar mensaje"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
            <div className="text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 opacity-50" />
              </div>
              <h3 className="font-semibold text-lg mb-1 text-foreground">Selecciona una conversación</h3>
              <p className="text-sm">Elige un chat de la lista para ver los mensajes</p>
            </div>
          </Card>
        )}
      </div>

      {/* ---- Client Info Sheet ---- */}
      <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full ${selectedConversation ? getAvatarColor(selectedConversation) : 'bg-primary'} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{getInitials(selectedContactInfo?.name || selectedConvData?.contact_name || 'Cliente')}</span>
              </div>
              {selectedContactInfo?.name || selectedConvData?.contact_name || 'Cliente'}
            </SheetTitle>
            <SheetDescription>
              {selectedConvData?.phone}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{selectedContactInfo?.order_count ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Pedidos</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-bold">
                  {selectedContactInfo?.total_spent
                    ? `$${selectedContactInfo.total_spent.toLocaleString('es-AR')}`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Gasto total</p>
              </div>
            </div>

            {/* Orders list */}
            {selectedContactInfo?.orders && selectedContactInfo.orders.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Pedidos recientes
                </h4>
                <div className="space-y-2">
                  {selectedContactInfo.orders.map((order) => (
                    <div key={order.number} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">#{order.number}</span>
                        <Badge variant={
                          order.payment_status === 'paid' ? 'default' :
                          order.payment_status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {order.payment_status === 'paid' ? 'Pagado' :
                           order.payment_status === 'pending' ? 'Pendiente' :
                           order.payment_status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>${Number(order.total).toLocaleString('es-AR')} {order.currency}</span>
                        <span>{order.created_at ? format(parseISO(order.created_at), "d MMM yyyy", { locale: es }) : ''}</span>
                      </div>
                      {order.shipping_status && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Envío: {order.shipping_status === 'shipped' ? 'Enviado' :
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
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {selectedContactInfo && selectedContactInfo.orders.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin pedidos registrados</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- Discount Dialog ---- */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Enviar descuento
            </DialogTitle>
            <DialogDescription>
              Se enviará un mensaje con un código de descuento al cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Porcentaje de descuento</label>
            <Select value={discountPercent} onValueChange={setDiscountPercent}>
              <SelectTrigger>
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
            <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendDiscount} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar {discountPercent}% OFF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
