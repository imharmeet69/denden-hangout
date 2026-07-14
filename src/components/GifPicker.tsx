import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Image as ImageIcon, Sticker, Clock } from 'lucide-react';

interface GifPickerProps {
  onSelectGif: (gif: { url: string; aspect: number; isSticker?: boolean }) => void;
  onClose: () => void;
}

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'recent' | 'gifs' | 'stickers'>('recent');
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('denden_recent_media');
    if (saved) {
      try {
        setRecentMedia(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchGifs = async () => {
      if (mediaType === 'recent') {
        setGifs(recentMedia);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const endpoint = query 
          ? `/api/${mediaType}/search?q=${encodeURIComponent(query)}&limit=30`
          : `/api/${mediaType}/trending?limit=30`;

        const res = await fetch(`${backendUrl}${endpoint}`);
        
        if (!res.ok) {
          if (res.status === 503) { 
            throw new Error('GIPHY_API_KEY is not configured on the server. Please check your environment variables.');
          }
          throw new Error(`Failed to fetch ${mediaType}`);
        }
        
        const json = await res.json();
        setGifs(json.data || []);
      } catch (err: any) {
        setError(err.message || `Error loading ${mediaType}`);
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchGifs, 400); // debounce
    return () => clearTimeout(timeout);
  }, [query, mediaType, recentMedia]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelectMedia = (media: any, aspect: number, isSticker: boolean) => {
    const id = media.id || media.url;
    const url = media.images?.fixed_width?.url || media.url;
    
    const itemToSave = { id, url, aspect, isSticker, title: media.title || 'media' };
    
    // Remove existing entry if any, then prepend
    const filtered = recentMedia.filter((m: any) => m.id !== id);
    const newRecents = [itemToSave, ...filtered].slice(0, 30);
    
    setRecentMedia(newRecents);
    localStorage.setItem('denden_recent_media', JSON.stringify(newRecents));
    
    onSelectGif({ url, aspect, isSticker });
  };

  return (
    <div className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-0 bg-white rounded-2xl shadow-xl border border-slate-200 w-72 sm:w-80 h-[26rem] flex flex-col z-50 overflow-hidden" ref={containerRef}>
      <div className="p-3 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={mediaType === 'recent' ? "Recent media..." : `Search ${mediaType}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={mediaType === 'recent'}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all disabled:opacity-70"
            autoFocus
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex px-2 py-1 gap-1 border-b border-slate-100">
        <button 
          onClick={() => { setMediaType('recent'); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === 'recent' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={14} /> Recent
        </button>
        <button 
          onClick={() => { setMediaType('gifs'); setGifs([]); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === 'gifs' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ImageIcon size={14} /> GIFs
        </button>
        <button 
          onClick={() => { setMediaType('stickers'); setGifs([]); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${mediaType === 'stickers' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Sticker size={14} /> Stickers
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 relative">
        {loading && gifs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}
        
        {mediaType === "recent" && gifs.length === 0 && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No recent media</p>
          </div>
        )}

        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
             <div className="text-red-500 text-sm mb-2 font-medium">Configuration Error</div>
             <div className="text-slate-500 text-xs">{error}</div>
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {gifs.map((gif, index) => {
              const id = gif.id || index.toString();
              const url = mediaType === 'recent' ? gif.url : gif.images.fixed_width.url;
              const aspect = mediaType === 'recent' ? gif.aspect : parseInt(gif.images.fixed_width.width) / parseInt(gif.images.fixed_width.height);
              const isSticker = mediaType === 'recent' ? gif.isSticker : mediaType === 'stickers';

              return (
                <div 
                  key={id} 
                  className={`relative group cursor-pointer rounded-lg overflow-hidden break-inside-avoid ${!isSticker ? 'bg-slate-200' : ''}`}
                  onClick={() => handleSelectMedia(gif, aspect, isSticker)}
                  style={{ aspectRatio: aspect }}
                >
                  <img 
                    src={url} 
                    alt={gif.title || 'media'} 
                    className={`w-full h-full ${!isSticker ? 'object-cover' : 'object-contain drop-shadow-sm'}`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  
                  {mediaType === 'recent' && isSticker && (
                    <div className="absolute top-1 right-1 bg-black/20 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sticker size={10} className="text-white" />
                    </div>
                  )}
                  {mediaType === 'recent' && !isSticker && (
                    <div className="absolute top-1 right-1 bg-black/20 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon size={10} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
