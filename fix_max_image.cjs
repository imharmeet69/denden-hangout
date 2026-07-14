const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const [uploading, setUploading] = useState(false);",
  `const [uploading, setUploading] = useState(false);
  const [maximizedMedia, setMaximizedMedia] = useState<{url: string, type: string} | null>(null);`
);

content = content.replace(
  "                      <div \n                        className={`rounded-md overflow-hidden ${msg.isSticker ? '' : 'bg-slate-800/10'}`}\n                        style={{ aspectRatio: msg.gifAspect || 1, minWidth: '150px', maxWidth: '300px' }}\n                      >\n                        <img src={msg.gifUrl} alt={msg.isSticker ? 'Sticker' : 'GIF'} className={`w-full h-full ${msg.isSticker ? 'object-contain drop-shadow-md' : 'object-cover'}`} />\n                      </div>",
  `                      <div \n                        className={\`rounded-md overflow-hidden \${msg.isSticker ? '' : 'bg-slate-800/10'}\`}\n                        style={{ aspectRatio: msg.gifAspect || 1, minWidth: '150px', maxWidth: '300px' }}\n                      >\n                        <img \n                          src={msg.gifUrl} \n                          alt={msg.isSticker ? 'Sticker' : 'GIF'} \n                          className={\`w-full h-full \${msg.isSticker ? 'object-contain drop-shadow-md' : 'object-cover'} cursor-pointer hover:opacity-90 transition-opacity\`}\n                          onClick={() => setMaximizedMedia({url: msg.gifUrl!, type: 'image'})}\n                        />\n                      </div>`
);

content = content.replace(
  `                        ) : (
                          <img src={msg.mediaUrl} alt="Upload" className="w-full h-auto max-h-[400px] object-contain" />
                        )`,
  `                        ) : (
                          <img 
                            src={msg.mediaUrl} 
                            alt="Upload" 
                            className="w-full h-auto max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setMaximizedMedia({url: msg.mediaUrl!, type: 'image'})}
                          />
                        )`
);

const modalCode = `
      {maximizedMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setMaximizedMedia(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setMaximizedMedia(null);
            }}
          >
            <X size={24} />
          </button>
          {maximizedMedia.type === 'video' ? (
            <video 
              src={maximizedMedia.url} 
              controls 
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={maximizedMedia.url} 
              alt="Maximized" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}`;

content = content.replace(
  `    </div>
  );
}`,
  modalCode
);

fs.writeFileSync('src/App.tsx', content);
