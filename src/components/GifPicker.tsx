import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface GifPickerProps {
  onSelectGif: (gif: { url: string; aspect: number }) => void;
  onClose: () => void;
}

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGifs = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = query 
          ? `/api/gifs/search?q=${encodeURIComponent(query)}&limit=30`
          : `/api/gifs/trending?limit=30`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          if (res.status === 503) {
             throw new Error('GIPHY_API_KEY is not configured on the server. Please check your environment variables.');
          }
          throw new Error('Failed to fetch GIFs');
        }
        const json = await res.json();
        setGifs(json.data || []);
      } catch (err: any) {
        setError(err.message || 'Error loading GIFs');
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchGifs, 400); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

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

  return (
    <div className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-0 bg-white rounded-2xl shadow-xl border border-slate-200 w-72 sm:w-80 h-96 flex flex-col z-50 overflow-hidden" ref={containerRef}>
      <div className="p-3 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search GIFs..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all"
            autoFocus
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 relative">
        {loading && gifs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}
        
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
             <div className="text-red-500 text-sm mb-2 font-medium">Configuration Error</div>
             <div className="text-slate-500 text-xs">{error}</div>
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {gifs.map((gif) => {
              const image = gif.images.fixed_width;
              const aspect = parseInt(image.width) / parseInt(image.height);
              return (
                <div 
                  key={gif.id} 
                  className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-200 break-inside-avoid"
                  onClick={() => onSelectGif({ url: image.url, aspect })}
                  style={{ aspectRatio: aspect }}
                >
                  <img 
                    src={image.url} 
                    alt={gif.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
