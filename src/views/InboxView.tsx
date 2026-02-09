import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  User,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Phone,
  Search,
  Inbox,
  CheckCheck,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function InboxView() {
  // Cargar cache inicial de localStorage
  const getCachedConversations = (): Conversation[] => {
    try {
      const cached = localStorage.getItem('inbox_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const [conversations, setConversations] = useState<Conversation[]>(getCachedConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(getCachedConversations().length === 0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading && conversations.length === 0) setLoading(true);
      const response = await fetch(`${API_URL}/api/conversations?limit=100`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const newConvs = data.conversations || [];
        setConversations(newConvs);
        // Guardar en cache
        localStorage.setItem('inbox_conversations', JSON.stringify(newConvs));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phone: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`${API_URL}/api/conversations/${phone}?limit=100`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    // Auto-refresh cada 30 segundos sin mostrar loading
    const interval = setInterval(() => fetchConversations(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      // Auto-refresh mensajes cada 10 segundos cuando hay conversación seleccionada
      const interval = setInterval(() => fetchMessages(selectedConversation), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

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

  const filteredConversations = conversations.filter(conv =>
    (conv.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.phone || '').includes(searchTerm) ||
    (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConvData = conversations.find(c => c.phone === selectedConversation);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary" />
            Bandeja de Entrada
          </h1>
          <p className="text-muted-foreground mt-1">
            {conversations.length} conversaciones activas
          </p>
        </div>
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

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations list */}
        <Card className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 overflow-hidden`}>
          <div className="p-3 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
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
                <p className="text-sm mt-1">Los chats aparecerán aquí</p>
              </div>
            ) : (
              <div className="animate-stagger">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.phone}
                    onClick={() => setSelectedConversation(conv.phone)}
                    className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-primary/5 ${
                      selectedConversation === conv.phone
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold truncate">{conv.contact_name}</span>
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
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.direction === 'outgoing' && (
                              <CheckCheck className="inline h-3.5 w-3.5 mr-1 text-primary" />
                            )}
                            {conv.last_message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{conv.phone}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{conv.message_count} mensajes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedConvData?.contact_name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedConvData?.phone}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchMessages(selectedConversation)}
                disabled={loadingMessages}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-muted/20 to-muted/40">
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
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input placeholder */}
            <div className="p-4 border-t bg-muted/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2 px-4 bg-muted/50 rounded-full">
                <MessageCircle className="h-4 w-4" />
                <span>Los mensajes se envían automáticamente desde el bot</span>
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
    </div>
  );
}
