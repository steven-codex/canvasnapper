import React, { useState } from 'react';
import { Copy, Check, Clock, Maximize2, Download } from 'lucide-react';

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

  // Format time elapsed
  const getElapsedString = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

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

  const handleRecopy = async () => {
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
        onCopySuccess("Recopied to clipboard!");
      } catch (err: any) {
        console.error("Multi-format write failed, retrying PNG-only fallback", err);
        try {
          await tryWrite({ "image/png": pngBlob });
          onCopySuccess("Recopied PNG to clipboard!");
        } catch (fallbackErr: any) {
          console.error("PNG fallback failed", fallbackErr);
          onCopyError(`Clipboard block: ${fallbackErr.message || fallbackErr}`);
        }
      } finally {
        setTimeout(() => setCopying(false), 2000);
      }
    };

    // If it is a data URL (SVG)
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
            onCopyError("Failed to create canvas context.");
            setCopying(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              onCopyError("Failed to create PNG blob.");
              setCopying(false);
              return;
            }
            writeToClipboard(pngBlob, svgString || undefined);
          }, "image/png");
        } catch (e: any) {
          onCopyError(`Render error: ${e.message || e}`);
          setCopying(false);
        }
      };
      img.onerror = () => {
        onCopyError("Failed to load SVG preview.");
        setCopying(false);
      };
      return;
    }

    // Call service worker to fetch the image bytes bypassing CORS
    chrome.runtime.sendMessage(
      { action: "fetch_image_cors", url: item.url },
      async (response) => {
        if (!response || !response.success) {
          onCopyError("Failed to fetch asset from Canva.");
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
          console.error("Clipboard recopy failure:", err);
          onCopyError(`Clipboard block: ${err.message || err}`);
          setCopying(false);
        }
      }
    );
  };

  const handleDownload = (format: 'webp' | 'jpeg') => {
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
          onCopyError("Failed to fetch asset for download");
        }
      });
    }
  };

  return (
    <div className="group relative flex items-center gap-3 p-2.5 bg-white border border-[var(--color-border)] hover:border-[var(--color-neutral-200)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-[20px] transition-all duration-300">
      {/* Thumbnail Container */}
      <div className="relative flex-shrink-0 w-12 h-12 bg-[var(--color-neutral-25)] border border-[var(--color-border)] rounded-[12px] overflow-hidden flex items-center justify-center p-0.5">
        {item.thumbnail ? (
          <img 
            src={item.thumbnail} 
            alt="Asset preview" 
            className="w-full h-full object-contain rounded-[8px]"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-neutral-50)] rounded-[8px]" />
        )}
      </div>

      {/* Details */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)] tracking-tight">
          <Clock className="w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
          <span>{getElapsedString(item.timestamp)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text)] font-semibold mt-0.5 tracking-tight">
          <Maximize2 className="w-3.5 h-3.5 text-[var(--color-accent)] opacity-80" />
          <span>{item.width} × {item.height} px</span>
        </div>
      </div>

        <button
          onClick={handleRecopy}
          disabled={copying}
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
            copying
              ? 'bg-[var(--color-accent-50)] border-[var(--color-accent-100)] text-[var(--color-accent-600)]'
              : 'bg-[var(--color-neutral-25)] border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] text-[var(--color-neutral-500)] hover:text-white cursor-pointer hover:shadow-[0_4px_10px_rgba(224,70,92,0.3)]'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-spring)' }}
          title="Copy to clipboard again"
        >
          {copying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        {isPro && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleDownload('webp')}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-25)] hover:bg-blue-500 hover:border-blue-500 text-[var(--color-neutral-500)] hover:text-white transition-colors cursor-pointer"
              title="Download WebP"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDownload('jpeg')}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-25)] hover:bg-amber-500 hover:border-amber-500 text-[var(--color-neutral-500)] hover:text-white transition-colors cursor-pointer"
              title="Download JPEG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
    </div>
  );
};
