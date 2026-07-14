const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add Paperclip and Loader2 icons
content = content.replace(
  "import { Send, Users, ChevronRight, MessageSquare, Shield, Zap, Image as ImageIcon, Sticker, Reply, X } from 'lucide-react';",
  "import { Send, Users, ChevronRight, MessageSquare, Shield, Zap, Image as ImageIcon, Sticker, Reply, X, Paperclip, Loader2, PlayCircle } from 'lucide-react';"
);

// Add fileInputRef and uploading state
content = content.replace(
  "const inputRef = useRef<HTMLInputElement>(null);",
  "const inputRef = useRef<HTMLInputElement>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);\n  const [uploading, setUploading] = useState(false);"
);

// Add handleFileUpload function
const handleFileUpload = `
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('File size must be under 1MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(\`\${backendUrl}/api/upload\`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      const newMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: '',
        sender: username,
        timestamp: Date.now(),
        mediaUrl: data.url,
        mediaType: data.type,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          text: replyingTo.text,
          sender: replyingTo.sender,
          gifUrl: replyingTo.gifUrl,
          isSticker: replyingTo.isSticker,
          mediaUrl: replyingTo.mediaUrl,
          mediaType: replyingTo.mediaType,
        } : undefined
      };

      socket?.emit('send_message', newMsg);
      setReplyingTo(null);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
`;

content = content.replace(
  "const handleSendMedia = (media: { url: string; aspect: number; isSticker?: boolean }) => {",
  handleFileUpload + "\n\n  const handleSendMedia = (media: { url: string; aspect: number; isSticker?: boolean }) => {"
);

// Update replyingTo logic for media
content = content.replace(
  "replyTo: replyingTo ? {\n        id: replyingTo.id,\n        text: replyingTo.text,\n        sender: replyingTo.sender,\n        gifUrl: replyingTo.gifUrl,\n        isSticker: replyingTo.isSticker,\n      } : undefined",
  "replyTo: replyingTo ? {\n        id: replyingTo.id,\n        text: replyingTo.text,\n        sender: replyingTo.sender,\n        gifUrl: replyingTo.gifUrl,\n        isSticker: replyingTo.isSticker,\n        mediaUrl: replyingTo.mediaUrl,\n        mediaType: replyingTo.mediaType,\n      } : undefined"
);
content = content.replace(
  "replyTo: replyingTo ? {\n        id: replyingTo.id,\n        text: replyingTo.text,\n        sender: replyingTo.sender,\n        gifUrl: replyingTo.gifUrl,\n        isSticker: replyingTo.isSticker,\n      } : undefined",
  "replyTo: replyingTo ? {\n        id: replyingTo.id,\n        text: replyingTo.text,\n        sender: replyingTo.sender,\n        gifUrl: replyingTo.gifUrl,\n        isSticker: replyingTo.isSticker,\n        mediaUrl: replyingTo.mediaUrl,\n        mediaType: replyingTo.mediaType,\n      } : undefined"
);

// Update reply box to show media
content = content.replace(
  "{msg.replyTo.gifUrl ? (\n                          <div className=\"flex items-center gap-2 text-xs\">\n                             {msg.replyTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {msg.replyTo.isSticker ? 'Sticker' : 'GIF'}\n                          </div>\n                        ) : (\n                          <div className=\"truncate max-w-[200px] text-xs opacity-90\">{msg.replyTo.text}</div>\n                        )}",
  "{msg.replyTo.gifUrl ? (\n                          <div className=\"flex items-center gap-2 text-xs\">\n                             {msg.replyTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {msg.replyTo.isSticker ? 'Sticker' : 'GIF'}\n                          </div>\n                        ) : msg.replyTo.mediaUrl ? (\n                          <div className=\"flex items-center gap-2 text-xs\">\n                             {msg.replyTo.mediaType === 'video' ? <PlayCircle size={14} /> : <ImageIcon size={14} />} {msg.replyTo.mediaType === 'video' ? 'Video' : 'Photo'}\n                          </div>\n                        ) : (\n                          <div className=\"truncate max-w-[200px] text-xs opacity-90\">{msg.replyTo.text}</div>\n                        )}"
);

content = content.replace(
  "{replyingTo.gifUrl ? (\n                  <div className=\"flex items-center gap-1.5 text-slate-500 text-sm\">\n                    {replyingTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {replyingTo.isSticker ? 'Sticker' : 'GIF'}\n                  </div>\n                ) : (\n                  <p className=\"text-sm text-slate-600 truncate\">{replyingTo.text}</p>\n                )}",
  "{replyingTo.gifUrl ? (\n                  <div className=\"flex items-center gap-1.5 text-slate-500 text-sm\">\n                    {replyingTo.isSticker ? <Sticker size={14} /> : <ImageIcon size={14} />} {replyingTo.isSticker ? 'Sticker' : 'GIF'}\n                  </div>\n                ) : replyingTo.mediaUrl ? (\n                  <div className=\"flex items-center gap-1.5 text-slate-500 text-sm\">\n                    {replyingTo.mediaType === 'video' ? <PlayCircle size={14} /> : <ImageIcon size={14} />} {replyingTo.mediaType === 'video' ? 'Video' : 'Photo'}\n                  </div>\n                ) : (\n                  <p className=\"text-sm text-slate-600 truncate\">{replyingTo.text}</p>\n                )}"
);

// Render the actual media below gif check
content = content.replace(
  ") : (\n                      <p className=\"leading-relaxed whitespace-pre-wrap break-words\">\n                        {msg.text}\n                      </p>\n                    )}",
  `) : msg.mediaUrl ? (
                      <div className="rounded-md overflow-hidden bg-slate-800/10" style={{ minWidth: '150px', maxWidth: '300px' }}>
                        {msg.mediaType === 'video' ? (
                          <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[400px] object-contain" />
                        ) : (
                          <img src={msg.mediaUrl} alt="Upload" className="w-full h-auto max-h-[400px] object-contain" />
                        )}
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}`
);

// Add the upload button next to the gif button
content = content.replace(
  "<Sticker size={20} />\n            </button>\n            <input",
  `<Sticker size={20} />
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || uploading}
              className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
              title="Send Photo/Video"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
            </button>
            <input`
);


fs.writeFileSync('src/App.tsx', content);
