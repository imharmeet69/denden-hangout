/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, ChevronRight, MessageSquare, Shield, Zap } from 'lucide-react';
import { ChatMessage } from './types';

// Connect to the backend provided by environment variable, or fallback to the same origin
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('den_den_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load messages from local storage', e);
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [shard, setShard] = useState<string>('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  
  // Assign a random username for this session (persists on refresh, resets on close)
  const [username] = useState(() => {
    const saved = sessionStorage.getItem('den_den_username');
    if (saved) return saved;
    const newName = `User_${Math.floor(Math.random() * 10000)}`;
    sessionStorage.setItem('den_den_username', newName);
    return newName;
  });

  const [deviceId] = useState(() => {
    let savedId = localStorage.getItem('den_den_device_id');
    if (!savedId) {
      savedId = crypto.randomUUID();
      localStorage.setItem('den_den_device_id', savedId);
    }
    return savedId;
  });
  
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('den_den_intro_seen');
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('den_den_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Initialize Socket Connection
    const newSocket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: { deviceId }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setShard('Disconnected');
    });

    newSocket.on('assigned_shard', (assignedShard: string) => {
      setShard(assignedShard);
    });

    newSocket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      // Use functional state update to ensure we always append to latest state
      setMessages((prev) => {
        // Prevent duplicate messages if re-rendered quickly
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputText.trim() || !socket || !isConnected) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
      sender: username,
      timestamp: Date.now(),
    };

    // Emit the message to the server
    socket.emit('send_message', newMsg);
    setInputText('');
  };

  const handleStart = () => {
    sessionStorage.setItem('den_den_intro_seen', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-600 mb-2">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Welcome to Den Den</h1>
              <p className="text-base sm:text-lg text-slate-500">A massive multiplayer real-time chat experience.</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-none p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Fully Anonymous</h3>
                  <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">You get a random username every session. No accounts, no emails, no tracking.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-none p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Massive Multiplayer</h3>
                  <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">Join a global room with everyone else. One big chaotic, fun conversation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-none p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Lightning Fast</h3>
                  <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">Powered by WebSockets, messages appear instantly across all devices.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-2xl bg-blue-600 text-white font-semibold text-base sm:text-lg hover:bg-blue-500 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              Next
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation / Header */}
      <header className="flex-none px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Den Den</h1>
          <p className="text-sm text-slate-500 mt-0.5 sm:mt-1">Massive Multiplayer Real-time Chat</p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 shadow-sm self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <div 
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected 
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-red-500'
              }`} 
            />
            <span className="text-sm font-medium text-slate-700">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-300 mx-0.5" />
          <div className="flex items-center gap-2 text-slate-500">
            <Users size={16} />
            <span className="text-sm font-mono tracking-tight">{shard}</span>
          </div>
        </div>
      </header>

      {/* Messages Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm">
              <Users size={32} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-700 font-medium">Connected to {shard}</p>
              <p className="text-sm mt-2 text-slate-500 leading-relaxed">
                You are in a massive multiplayer real-time chat. 
                Say hello to everyone!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.isSelf;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                  isMe ? 'items-end self-end ml-auto' : 'items-start mr-auto'
                }`}
              >
                <span className="text-xs text-slate-500 mb-1 sm:mb-1.5 px-1 font-medium">
                  {msg.sender}
                </span>
                <div 
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm text-[15px] sm:text-base ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-slate-50 text-slate-900 rounded-bl-sm border border-slate-200'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* Input Console */}
      <footer className="flex-none p-3 sm:p-4 pb-4 sm:pb-6 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-slate-50 border border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-full p-1 sm:p-1.5 transition-all shadow-sm"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none px-3 sm:px-4 py-2 text-slate-900 placeholder:text-slate-400 font-medium text-[15px] sm:text-base"
              disabled={!isConnected}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected}
              className="p-2 sm:p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

