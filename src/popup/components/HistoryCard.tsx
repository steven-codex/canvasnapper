import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HistoryItem {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  timestamp: number;
}

interface HistoryCardProps {
  item: HistoryItem;
  onCopySuccess: (message: string) => void;
  onCopyError: (message: string) => void;
  isPro: boolean;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item, onCopySuccess, onCopyError, isPro }) => {
  const [copying, setCopying] = useState(false);

  const getSvgStringFromDataUrl = (dataUrl: string): string | null => {
    const prefix = "data:image/svg+xml;base64,";
    if (!dataUrl.startsWith(prefix)) return null;
    const base64Part = dataUrl.substring(prefix.length);
    try {
      return decodeURIComponent(escape(atob(base64Part)));
    } catch (e) {
      console.error("Failed to decode SVG from data URL:", e);
      return null;
    }
  };

  const handleRecopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copying) return;
    setCopying(true);

    const writeToClipboard = async (pngBlob: Blob, svgString?: string) => {
      const clipboardItems: Record<string, Blob> = {
        "image/png": pngBlob
      };
      if (svgString) {
        clipboardItems["text/plain"] = new Blob([svgString], { type: "text/plain" });
        clipboardItems["text/html"] = new Blob([svgString], { type: "text/html" });
      }

      const tryWrite = (items: Record<string, Blob>) => {
        return navigator.clipboard.write([
          new ClipboardItem(items)
        ]);
      };

      try {
        await tryWrite(clipboardItems);
        onCopySuccess("Recopied!");
      } catch (err: any) {
        try {
          await tryWrite({ "image/png": pngBlob });
          onCopySuccess("Recopied PNG!");
        } catch (fallbackErr: any) {
          onCopyError(`Error: ${fallbackErr.message || fallbackErr}`);
        }
      } finally {
        setTimeout(() => setCopying(false), 2000);
      }
    };

    if (item.url.startsWith("data:image/svg+xml;base64,")) {
      const svgString = getSvgStringFromDataUrl(item.url);
      const img = new Image();
      img.src = item.url;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = item.width;
          canvas.height = item.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            onCopyError("Canvas fail");
            setCopying(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              onCopyError("PNG fail");
              setCopying(false);
              return;
            }
            writeToClipboard(pngBlob, svgString || undefined);
          }, "image/png");
        } catch (err: any) {
          onCopyError(err.message || err);
          setCopying(false);
        }
      };
      return;
    }

    chrome.runtime.sendMessage(
      { action: "fetch_image_cors", url: item.url },
      async (response) => {
        if (!response || !response.success) {
          onCopyError("Fetch error");
          setCopying(false);
          return;
        }

        try {
          const binaryString = atob(response.base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/png" });
          writeToClipboard(blob);
        } catch (err: any) {
          onCopyError("Clipboard error");
          setCopying(false);
        }
      }
    );
  };

  const handleDownload = (e: React.MouseEvent, format: 'webp' | 'jpeg') => {
    e.stopPropagation();
    if (!isPro) return;

    const performDownload = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = item.width;
        canvas.height = item.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL(`image/${format}`, 0.8);
          chrome.downloads.download({
            url: dataUrl,
            filename: `canva-snap-${Date.now()}.${format}`,
            saveAs: false
          });
        }
      };
    };

    if (item.url.startsWith("data:")) {
      performDownload(item.url);
    } else {
      chrome.runtime.sendMessage({ action: "fetch_image_cors", url: item.url }, (response) => {
        if (response && response.success) {
          performDownload(`data:${response.contentType};base64,${response.base64Data}`);
        } else {
          onCopyError("Download error");
        }
      });
    }
  };

  return (
    <div 
      onClick={handleRecopy}
      className="group relative aspect-square bg-white border-2 border-[#0d1216] shadow-[2px_2px_0px_0px_#0d1216] hover:shadow-[4px_4px_0px_0px_#0d1216] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Thumbnail Image */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2 bg-white group-hover:opacity-10 transition-opacity duration-150">
        {item.thumbnail ? (
          <img 
            src={item.thumbnail} 
            alt="Asset" 
            className="w-full h-full object-contain rounded"
          />
        ) : (
          <div className="w-full h-full bg-[#f4f5f6] rounded flex items-center justify-center text-[9px] font-mono text-[#6f767e]">
            No Preview
          </div>
        )}
      </div>

      {/* Hover Actions Overlay */}
      <div className="absolute inset-0 bg-[#fcfbfa]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center p-2 gap-1.5 z-10">
        <button
          onClick={handleRecopy}
          disabled={copying}
          className={`flex items-center justify-center gap-1 w-full py-1 border-2 border-[#0d1216] text-[9px] font-mono font-bold uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
            copying
              ? 'bg-[#00c4cc] text-[#0d1216]'
              : 'bg-[#7d2ae7] text-white'
          }`}
        >
          {copying ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>

        {isPro && (
          <div className="grid grid-cols-2 gap-1 w-full">
            <button
              onClick={(e) => handleDownload(e, 'webp')}
              className="flex items-center justify-center py-1 rounded border border-[#0d1216] bg-white hover:bg-[#fafafa] text-[#0d1216] text-[8px] font-mono font-bold transition-colors"
            >
              WEBP
            </button>
            <button
              onClick={(e) => handleDownload(e, 'jpeg')}
              className="flex items-center justify-center py-1 rounded border border-[#0d1216] bg-white hover:bg-[#fafafa] text-[#0d1216] text-[8px] font-mono font-bold transition-colors"
            >
              JPG
            </button>
          </div>
        )}
      </div>

      {/* Dim info tag at the bottom */}
      <div className="absolute bottom-1 right-1 bg-white/90 border border-[#0d1216] px-1 py-0.5 rounded text-[8px] font-mono font-bold text-[#0d1216] pointer-events-none group-hover:opacity-0 transition-opacity duration-150">
        {item.width}×{item.height}
      </div>
    </div>
  );
};
