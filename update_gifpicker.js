const fs = require('fs');

let content = fs.readFileSync('src/components/GifPicker.tsx', 'utf8');

// replace lucide-react import
content = content.replace(
  "import { Search, X, Loader2, Image as ImageIcon, Sticker } from 'lucide-react';",
  "import { Search, X, Loader2, Image as ImageIcon, Sticker, Clock } from 'lucide-react';"
);

// replace mediaType state
content = content.replace(
  "const [mediaType, setMediaType] = useState<'gifs' | 'stickers'>('gifs');",
  "const [mediaType, setMediaType] = useState<'recent' | 'gifs' | 'stickers'>('recent');\n  const [recentMedia, setRecentMedia] = useState<any[]>([]);"
);

// add initial load of recent
content = content.replace(
  "const containerRef = useRef<HTMLDivElement>(null);",
  "const containerRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    const saved = localStorage.getItem('denden_recent_media');\n    if (saved) {\n      try {\n        setRecentMedia(JSON.parse(saved));\n      } catch (e) {}\n    }\n  }, []);"
);

// wrap fetchGifs early return if mediaType is recent
content = content.replace(
  "const fetchGifs = async () => {\n      setLoading(true);",
  "const fetchGifs = async () => {\n      if (mediaType === 'recent') {\n        setGifs(recentMedia);\n        return;\n      }\n      setLoading(true);"
);

// inject saving history in onSelect
content = content.replace(
  "onClick={() => onSelectGif({ url: image.url, aspect, isSticker: mediaType === 'stickers' })}",
  "onClick={() => {\n                    const itemToSave = { id: gif.id, url: image.url, aspect, isSticker: mediaType === 'stickers', title: gif.title || 'media' };\n                    const newRecents = [itemToSave, ...recentMedia.filter((m: any) => m.id !== gif.id)].slice(0, 30);\n                    setRecentMedia(newRecents);\n                    localStorage.setItem('denden_recent_media', JSON.stringify(newRecents));\n                    onSelectGif({ url: image.url, aspect, isSticker: mediaType === 'stickers' });\n                  }}"
);

// update tabs UI
content = content.replace(
  '<button \n          onClick={() => { setMediaType(\'gifs\'); setGifs([]); }}\n          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === \'gifs\' ? \'bg-slate-100 text-slate-900\' : \'text-slate-500 hover:text-slate-50\'}`}\n        >\n          <ImageIcon size={14} /> GIFs\n        </button>',
  '<button \n          onClick={() => { setMediaType(\'recent\'); }}\n          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === \'recent\' ? \'bg-slate-100 text-slate-900\' : \'text-slate-500 hover:text-slate-700\'}`}\n        >\n          <Clock size={14} /> Recent\n        </button>\n        <button \n          onClick={() => { setMediaType(\'gifs\'); setGifs([]); }}\n          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === \'gifs\' ? \'bg-slate-100 text-slate-900\' : \'text-slate-500 hover:text-slate-700\'}`}\n        >\n          <ImageIcon size={14} /> GIFs\n        </button>'
);

// fix hover color on stickers
content = content.replace(
  'text-slate-500 hover:text-slate-50\'}',
  'text-slate-500 hover:text-slate-700\'}'
);

// fix rendering logic in map (it needs to handle both giphy format and recent format)
const replacementMap = `            {gifs.map((gif, index) => {
              const url = mediaType === 'recent' ? gif.url : gif.images.fixed_width.url;
              const aspect = mediaType === 'recent' ? gif.aspect : parseInt(gif.images.fixed_width.width) / parseInt(gif.images.fixed_width.height);
              const isSticker = mediaType === 'recent' ? gif.isSticker : mediaType === 'stickers';
              const id = gif.id || index.toString();
              return (
                <div 
                  key={id} 
                  className={\`relative group cursor-pointer rounded-lg overflow-hidden break-inside-avoid \${!isSticker ? 'bg-slate-200' : ''}\`}
                  onClick={() => {
                    const itemToSave = { id, url, aspect, isSticker, title: gif.title || 'media' };
                    const newRecents = [itemToSave, ...recentMedia.filter((m: any) => m.id !== id)].slice(0, 30);
                    setRecentMedia(newRecents);
                    localStorage.setItem('denden_recent_media', JSON.stringify(newRecents));
                    onSelectGif({ url, aspect, isSticker });
                  }}
                  style={{ aspectRatio: aspect }}
                >
                  <img 
                    src={url} 
                    alt={gif.title || 'media'} 
                    className={\`w-full h-full \${!isSticker ? 'object-cover' : 'object-contain drop-shadow-sm'}\`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              );
            })}`;

content = content.replace(
  /\{gifs\.map\(\(gif\) => \{[\s\S]*?\}\)\}/,
  replacementMap
);

// empty state for recents
content = content.replace(
  '<div className="columns-2 gap-2 space-y-2">',
  '{mediaType === "recent" && gifs.length === 0 && !loading && !error && (\n            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">\n              <Clock className="w-8 h-8 mb-2 opacity-50" />\n              <p className="text-sm">No recent media</p>\n            </div>\n          )}\n          <div className="columns-2 gap-2 space-y-2">'
);

// Disable search input if mediaType is recent
content = content.replace(
  'onChange={(e) => setQuery(e.target.value)}',
  'onChange={(e) => setQuery(e.target.value)}\n            disabled={mediaType === \'recent\'}'
);

fs.writeFileSync('src/components/GifPicker.tsx', content);
