/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users } from 'lucide-react';
import { ChatMessage } from './types';

// Connect to the same origin; our socket.io server is attached to the Express app
const SOCKET_URL = window.location.origin;

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to local storage whenever they change (keep last 100)
  useEffect(() => {
    localStorage.setItem('den_den_messages', JSON.stringify(messages.slice(-100)));
  }, [messages]);

  useEffect(() => {
    // Initialize Socket Connection
    const newSocket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
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

    // Emit the message to the server, which will broadcast it to the room
    socket.emit('send_message', newMsg);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Navigation / Header */}
      <header className="flex-none px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Den Den</h1>
          <p className="text-sm text-neutral-400 mt-1">Massive Multiplayer Real-time Chat</p>
        </div>
        
        <div className="flex items-center gap-4 bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800 shadow-sm">
          <div className="flex items-center gap-2">
            <div 
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected 
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-red-500'
              }`} 
            />
            <span className="text-sm font-medium text-neutral-300">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="w-px h-4 bg-neutral-800 mx-0.5" />
          <div className="flex items-center gap-2 text-neutral-400">
            <Users size={16} />
            <span className="text-sm font-mono tracking-tight">{shard}</span>
          </div>
        </div>
      </header>

      {/* Messages Viewport */}
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 text-center max-w-sm">
              <Users size={32} className="mx-auto mb-4 text-neutral-600" />
              <p className="text-neutral-300 font-medium">Connected to {shard}</p>
              <p className="text-sm mt-2 text-neutral-500 leading-relaxed">
                You are in a localized shard of up to 50 users. 
                Say hello to your room!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === username;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[75%] ${
                  isMe ? 'items-end self-end ml-auto' : 'items-start mr-auto'
                }`}
              >
                <span className="text-xs text-neutral-500 mb-1.5 px-1 font-medium">
                  {msg.sender}
                </span>
                <div 
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-neutral-800 text-neutral-100 rounded-bl-sm border border-neutral-700/50'
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
      <footer className="flex-none p-4 pb-6 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-full p-1.5 transition-all shadow-sm"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message to your shard..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-neutral-100 placeholder:text-neutral-500 font-medium"
              disabled={!isConnected}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected}
              className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

