/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, ChevronRight, MessageSquare, Shield, Zap, Image as ImageIcon, Sticker, Reply, X } from 'lucide-react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { ChatMessage } from './types';
import { GifPicker } from './components/GifPicker';

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
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const handleReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
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
  const inputRef = useRef<HTMLInputElement>(null);

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

    newSocket.on('user_count', (count: number) => {
      setOnlineCount(count);
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
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
        gifUrl: replyingTo.gifUrl,
        isSticker: replyingTo.isSticker,
      } : undefined
    };

    // Emit the message to the server
    socket.emit('send_message', newMsg);
    setInputText('');
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  const handleSendMedia = (media: { url: string; aspect: number; isSticker?: boolean }) => {
    if (!socket || !isConnected) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: '', // Empty text for gif only
      sender: username,
      timestamp: Date.now(),
      gifUrl: media.url,
      gifAspect: media.aspect,
      isSticker: media.isSticker,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
        gifUrl: replyingTo.gifUrl,
        isSticker: replyingTo.isSticker,
      } : undefined
    };

    socket.emit('send_message', newMsg);
    setShowGifPicker(false);
    setReplyingTo(null);
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
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-sm border border-slate-100 mb-2 overflow-hidden relative">
                <img src="/logo.svg" alt="JustChat Logo" className="absolute inset-0 w-full h-full object-cover scale-125" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square w-8 h-8 sm:w-10 sm:h-10 text-blue-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
                }} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Welcome to JustChat</h1>
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
      <header className="flex-none px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0 self-start sm:self-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full shadow-sm bg-white overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="JustChat" className="w-full h-full object-cover scale-125" onError={(e) => e.currentTarget.parentElement!.style.display = 'none'} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 truncate">JustChat</h1>
            <p className="text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">One giant room. Zero chill.</p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex-none flex items-center justify-center bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">{onlineCount} online</span>
          </div>
        )}

        <div className="flex-1 flex justify-end self-end sm:self-auto">
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 shadow-sm">
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
              <span className="text-sm tracking-tight truncate max-w-[100px]">Global_Chat</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm">
              <Users size={32} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-700 font-medium">
                {isConnected ? `Connected to ${shard}` : shard}
              </p>
              <p className="text-sm mt-2 text-slate-500 leading-relaxed">
                You've just dropped into the wildest global chat room! 
                Start typing to make some noise!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.isSelf;
            const isGif = !!msg.gifUrl;
            return (
              <motion.div 
                key={msg.id} 
                className={`group flex items-center gap-2 max-w-[85%] sm:max-w-[75%] w-full ${
                  isMe ? 'self-end ml-auto justify-end' : 'mr-auto justify-start'
                }`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragDirectionLock
                onDragEnd={(e, info) => {
                  if (Math.abs(info.offset.x) > 40) {
                    handleReply(msg);
                  }
                }}
              >
                {!isMe && (
                   <button 
                     onClick={() => handleReply(msg)}
                     className="hidden md:flex p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                     title="Reply"
                   >
                     <Reply size={14} />
                   </button>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isGif && (
                    <span className="text-xs text-slate-500 mb-1 sm:mb-1.5 px-1 font-medium">
                      {msg.sender}
                    </span>
                  )}
                  <div 
                    className={
                      isGif 
                        ? `overflow-hidden rounded-lg shadow-sm ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'} ${msg.replyTo ? 'p-2 bg-slate-100' : ''}`
                        : `px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm text-[15px] sm:text-base ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-sm' 
                              : 'bg-slate-50 text-slate-900 rounded-bl-sm border border-slate-200'
                          }`
                    }
                  >
                    {msg.replyTo && (
                      <div className={`text-sm p-2 mb-2 rounded-lg border-l-4 ${isMe ? 'bg-slate-800/20 border-slate-800/30 text-white/90' : 'bg-slate-200 border-slate-400 text-slate-700'} `}>
                        <div className="font-semibold text-xs mb-0.5">{msg.replyTo.sender}</div>
                        {msg.replyTo.gifUrl ? (
                          <div className="flex items-center gap-2 text-xs">
                             {msg.replyTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {msg.replyTo.isSticker ? 'Sticker' : 'GIF'}
                          </div>
                        ) : (
                          <div className="truncate max-w-[200px] text-xs opacity-90">{msg.replyTo.text}</div>
                        )}
                      </div>
                    )}
                    {msg.gifUrl ? (
                      <div 
                        className={`rounded-md overflow-hidden ${msg.isSticker ? '' : 'bg-slate-800/10'}`}
                        style={{ aspectRatio: msg.gifAspect || 1, minWidth: '150px', maxWidth: '300px' }}
                      >
                        <img src={msg.gifUrl} alt={msg.isSticker ? 'Sticker' : 'GIF'} className={`w-full h-full ${msg.isSticker ? 'object-contain drop-shadow-md' : 'object-cover'}`} />
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}
                  </div>
                </div>

                {isMe && (
                   <button 
                     onClick={() => handleReply(msg)}
                     className="hidden md:flex p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                     title="Reply"
                   >
                     <Reply size={14} />
                   </button>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* Input Console */}
      <footer className="flex-none p-3 sm:p-4 pb-4 sm:pb-6 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          {replyingTo && (
            <div className="mb-2 bg-slate-50 border border-slate-300 rounded-xl p-3 flex items-start gap-3 shadow-sm relative">
              <div className="absolute top-2 right-2">
                 <button 
                   onClick={() => setReplyingTo(null)}
                   className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                 >
                   <X size={16} />
                 </button>
              </div>
              <div className="w-1 h-10 bg-slate-400 rounded-full flex-none"></div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-xs font-semibold text-slate-700 mb-0.5">{replyingTo.sender}</p>
                {replyingTo.gifUrl ? (
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    {replyingTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {replyingTo.isSticker ? 'Sticker' : 'GIF'}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 truncate">{replyingTo.text}</p>
                )}
              </div>
            </div>
          )}
          {showGifPicker && (
            <GifPicker 
              onSelectGif={handleSendMedia} 
              onClose={() => setShowGifPicker(false)} 
            />
          )}
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-slate-50 border border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-full p-1 sm:p-1.5 transition-all shadow-sm"
          >
            <button
              type="button"
              disabled={!isConnected}
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
              title="Send a GIF or Sticker"
            >
              <Sticker size={20} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none px-1 sm:px-2 py-2 text-slate-900 placeholder:text-slate-400 font-medium text-[15px] sm:text-base"
              disabled={!isConnected}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected}
              onPointerDown={(e) => e.preventDefault()}
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

