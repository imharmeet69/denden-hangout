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


fs.writeFileSync('src/App.tsx', content);
