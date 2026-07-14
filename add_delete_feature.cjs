const fs = require('fs');

// 1. Update server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  "socket.on('send_message', (payload) => {",
  `socket.on('delete_message', (messageId) => {
      const history = shardMessages.get(shard);
      if (history) {
        const msgIndex = history.findIndex(m => m.id === messageId);
        if (msgIndex !== -1 && history[msgIndex].deviceId === socket.handshake.auth?.deviceId) {
          history.splice(msgIndex, 1);
          io.to(shard).emit('message_deleted', messageId);
        }
      }
    });

    // Handle messages
    socket.on('send_message', (payload) => {`
);

fs.writeFileSync('server.ts', serverContent);

// 2. Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add Trash icon import
appContent = appContent.replace(
  "Paperclip, Loader2, PlayCircle } from 'lucide-react';",
  "Paperclip, Loader2, PlayCircle, Trash2 } from 'lucide-react';"
);

// Add message_deleted listener
appContent = appContent.replace(
  "newSocket.on('new_message', (message: ChatMessage) => {",
  `newSocket.on('message_deleted', (messageId: string) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    newSocket.on('new_message', (message: ChatMessage) => {`
);

// Add handleDeleteMessage function
appContent = appContent.replace(
  "const handleReply = (msg: ChatMessage) => {",
  `const handleDeleteMessage = (messageId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('delete_message', messageId);
    setMessages((prev) => prev.filter(m => m.id !== messageId));
  };

  const handleReply = (msg: ChatMessage) => {`
);

// Add delete button in the UI
appContent = appContent.replace(
  `                    <span className="text-xs text-slate-500 mb-1 sm:mb-1.5 px-1 font-medium">
                      {msg.sender}
                    </span>
                  )}
                  <div 
                    className={
                      isGif `,
  `                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5 px-1">
                      <span className="text-xs text-slate-500 font-medium">
                        {msg.sender}
                      </span>
                      {isMe && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  {isMe && !isGif && (
                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5 px-1 justify-end w-full">
                       <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                    </div>
                  )}
                  <div 
                    className={
                      isGif `
);

appContent = appContent.replace(
  `<span className="text-xs text-slate-500 mb-1 sm:mb-1.5 px-1 font-medium">\n                      {msg.sender}\n                    </span>`,
  `<span className="text-xs text-slate-500 mb-1 sm:mb-1.5 px-1 font-medium">\n                      {msg.sender}\n                    </span>`
);

fs.writeFileSync('src/App.tsx', appContent);
