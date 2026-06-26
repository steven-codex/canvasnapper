// Content Script for Canva Snapper (Pro Edition)

// Check if the extension context is still active and valid.
// This prevents 'Extension context invalidated' uncaught exceptions when the extension is reloaded/updated.
function isContextValid(): boolean {
  try {
    return typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

let isEnabled = true;
let lastImageUrl = "";
let lastWidth = 0;
let lastHeight = 0;
let isSvgAsset = false;

// Thread-safe in-memory diagnostic logs to prevent race conditions on storage writes
let diagnosticLogs: any[] = [];
function logDiagnostic(message: string, data?: any) {
  const logEntry = {
    timestamp: Date.now(),
    message,
    data: data ? JSON.stringify(data) : ""
  };
  diagnosticLogs = [logEntry, ...diagnosticLogs].slice(0, 50);
  
  if (isContextValid()) {
    try {
      chrome.storage.local.set({ diagnostics: diagnosticLogs });
    } catch (e) {
      // Quietly ignore context invalidation errors
    }
  }
  console.log(`[Canva Snapper Diagnostic] ${message}`, data || "");
}

// Load initial enablement state and listen for changes
if (isContextValid()) {
  try {
    chrome.storage.local.get({ isEnabled: true }, (result) => {
      if (!isContextValid()) return;
      isEnabled = result.isEnabled !== false;
      logDiagnostic(`Loaded initial enablement state: ${isEnabled}`);
    });
  } catch (e) {
    // Ignore
  }

  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (!isContextValid()) return;
      try {
        if (changes.isEnabled) {
          isEnabled = changes.isEnabled.newValue !== false;
          logDiagnostic(`Enablement state changed: ${isEnabled}`);
        }
      } catch (e) {
        // Ignore
      }
    });
  } catch (e) {
    // Ignore
  }
}

// Helper to serialize SVGSVGElement to a clean data URL
function serializeSvg(svg: SVGSVGElement): { url: string; width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  let width = svg.width?.baseVal?.value || rect.width || 300;
  let height = svg.height?.baseVal?.value || rect.height || 300;

  // Vector Graphics Upscaling: if the SVG is smaller than 1200px, upscale it proportionally
  // to ensure the rasterized PNG representation is crisp and sharp!
  const minTargetDimension = 1200;
  if (width < minTargetDimension && height < minTargetDimension && width > 0 && height > 0) {
    const scale = minTargetDimension / Math.max(width, height);
    width = width * scale;
    height = height * scale;
  }
  
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("width", width.toString());
  clonedSvg.setAttribute("height", height.toString());
  
  if (!clonedSvg.getAttribute("xmlns")) {
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // Inline computed styles from original SVG elements to cloned SVG elements
  const originalElements = [svg, ...Array.from(svg.querySelectorAll("*"))] as Element[];
  const clonedElements = [clonedSvg, ...Array.from(clonedSvg.querySelectorAll("*"))] as Element[];
  
  const propertiesToInline = [
    "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity",
    "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset",
    "stop-color", "stop-opacity", "clip-path", "mask", "filter", "display"
  ];

  for (let i = 0; i < originalElements.length; i++) {
    const originalEl = originalElements[i];
    const clonedEl = clonedElements[i] as any;
    if (originalEl && clonedEl) {
      const style = window.getComputedStyle(originalEl);
      for (const prop of propertiesToInline) {
        const val = style.getPropertyValue(prop);
        if (val) {
          clonedEl.style.setProperty(prop, val);
        }
      }
    }
  }
  
  const svgString = new XMLSerializer().serializeToString(clonedSvg);
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  
  return {
    url: `data:image/svg+xml;base64,${base64}`,
    width: Math.round(width),
    height: Math.round(height)
  };
}

// Helper to decode SVG string from its serialized data URL
function getSvgStringFromDataUrl(dataUrl: string): string | null {
  const prefix = "data:image/svg+xml;base64,";
  if (!dataUrl.startsWith(prefix)) return null;
  const base64Part = dataUrl.substring(prefix.length);
  try {
    return decodeURIComponent(escape(atob(base64Part)));
  } catch (e) {
    console.error("Failed to decode SVG from data URL:", e);
    return null;
  }
}

function isValidDesignElement(width: number, height: number): boolean {
  // Exclude small UI icons/buttons
  return width >= 30 && height >= 30;
}

// Extract background-image URL if present
function getBackgroundImageUrl(element: HTMLElement): string | null {
  try {
    const style = window.getComputedStyle(element);
    const bgImg = style.backgroundImage;
    if (bgImg && bgImg !== "none" && bgImg.startsWith("url(")) {
      const match = bgImg.match(/^url\(['"]?([^'"]+)['"]?\)$/);
      return match ? match[1] : null;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

// Unified helper to check if an element is a valid Canva design asset (IMG, background-image, SVG, or CANVAS)
function checkElement(el: Element): boolean {
  if (!el) return false;

  // 1. Check if it's an IMG tag
  if (el.tagName === "IMG") {
    const img = el as HTMLImageElement;
    const src = img.src;
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    
    if (src && isValidDesignElement(w, h)) {
      lastImageUrl = src;
      lastWidth = w;
      lastHeight = h;
      isSvgAsset = false;
      return true;
    }
  }
  
  // 2. Check if the element has a CSS background-image
  const bgUrl = getBackgroundImageUrl(el as HTMLElement);
  if (bgUrl) {
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (isValidDesignElement(w, h)) {
      lastImageUrl = bgUrl;
      lastWidth = Math.round(w);
      lastHeight = Math.round(h);
      isSvgAsset = false;
      return true;
    }
  }
  
  // 3. Check if it is an SVG (or child of SVG)
  const svg = el.closest("svg");
  if (svg) {
    const rect = svg.getBoundingClientRect();
    const w = svg.width?.baseVal?.value || rect.width || 0;
    const h = svg.height?.baseVal?.value || rect.height || 0;
    
    if (isValidDesignElement(w, h)) {
      const result = serializeSvg(svg);
      lastImageUrl = result.url;
      lastWidth = result.width;
      lastHeight = result.height;
      isSvgAsset = true;
      return true;
    }
  }

  // 4. Check if it is a CANVAS element
  if (el.tagName === "CANVAS") {
    const canvas = el as HTMLCanvasElement;
    const w = canvas.width;
    const h = canvas.height;
    if (isValidDesignElement(w, h)) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        lastImageUrl = dataUrl;
        lastWidth = w;
        lastHeight = h;
        isSvgAsset = false;
        return true;
      } catch (e) {
        // Tainted canvas, ignore
      }
    }
  }

  return false;
}

// Scans elements under coordinates to find any image, vector graphic, or background image
function scanElementAtCoordinates(clientX: number, clientY: number): boolean {
  // Inject a style to temporarily force pointer-events to auto.
  // This allows elementsFromPoint to detect elements that are styled with pointer-events: none.
  const style = document.createElement("style");
  style.id = "temp-pointer-events-override";
  style.textContent = "* { pointer-events: auto !important; }";
  document.documentElement.appendChild(style);
  
  let elements: Element[] = [];
  try {
    elements = document.elementsFromPoint(clientX, clientY);
  } catch (err: any) {
    logDiagnostic("elementsFromPoint failed", err.message || err);
  } finally {
    style.remove();
  }
  
  // Log the tags of all elements under cursor for diagnostics
  const elementTags = elements.map(el => {
    let desc = el.tagName.toLowerCase();
    if (el.id) desc += `#${el.id}`;
    if (el.className) desc += `.${el.className.split(" ").slice(0, 2).join(".")}`;
    
    // Add additional metadata for tracing
    if (el.tagName === "IMG") {
      desc += `[src=${(el as HTMLImageElement).src.substring(0, 30)}...]`;
    }
    const bg = getBackgroundImageUrl(el as HTMLElement);
    if (bg) {
      desc += `[bg=${bg.substring(0, 30)}...]`;
    }
    return desc;
  });
  
  logDiagnostic(`Scan cursor coordinates (${clientX}, ${clientY})`, { elements: elementTags });

  for (const element of elements) {
    if (checkElement(element as HTMLElement)) {
      logDiagnostic(`Detected valid design element: ${element.tagName}`, { url: lastImageUrl.substring(0, 60), width: lastWidth, height: lastHeight, isSvg: isSvgAsset });
      return true;
    }
  }

  logDiagnostic("Scan completed. No valid design IMG, SVG, CANVAS, or background-image found under cursor.");
  return false;
}

// Listen to contextmenu in CAPTURING phase to run before Canva blocks it
document.addEventListener("contextmenu", (event) => {
  if (!isEnabled) return;
  logDiagnostic("Intercepted contextmenu event");
  let found = scanElementAtCoordinates(event.clientX, event.clientY);
  
  // Fallback: search parents and siblings of clicked element
  if (!found && event.target) {
    const target = event.target as HTMLElement;
    
    // Try checking target and its ancestors (up to 5 levels)
    let current: HTMLElement | null = target;
    let depth = 0;
    while (current && depth < 5) {
      if (checkElement(current)) {
        logDiagnostic("Fallback scan: found element in target ancestors", { tagName: current.tagName, src: lastImageUrl.substring(0, 60) });
        found = true;
        break;
      }
      current = current.parentElement;
      depth++;
    }

    // Try checking within the parent container
    if (!found) {
      const parentContainer = target.closest('[class*="editor"], [class*="canvas"], .canvas-container, [data-testid="page-container"]');
      if (parentContainer) {
        // Query IMGs
        const imgs = parentContainer.querySelectorAll("img");
        for (const img of imgs) {
          if (checkElement(img)) {
            logDiagnostic("Fallback scan: found IMG in parent container", { src: lastImageUrl.substring(0, 60) });
            found = true;
            break;
          }
        }
        
        // Query SVGs if IMG not found
        if (!found) {
          const svgs = parentContainer.querySelectorAll("svg");
          for (const svg of svgs) {
            if (checkElement(svg)) {
              logDiagnostic("Fallback scan: found SVG in parent container", { src: lastImageUrl.substring(0, 60) });
              found = true;
              break;
            }
          }
        }

        // Query CANVASes if SVG/IMG not found
        if (!found) {
          const canvases = parentContainer.querySelectorAll("canvas");
          for (const canvas of canvases) {
            if (checkElement(canvas)) {
              logDiagnostic("Fallback scan: found CANVAS in parent container", { src: lastImageUrl.substring(0, 60) });
              found = true;
              break;
            }
          }
        }
      }
    }
  }
}, true); // Capturing phase!

// Keep track of cursor coordinates in CAPTURING phase
let cursorX = 0;
let cursorY = 0;
document.addEventListener("mousemove", (event) => {
  cursorX = event.clientX;
  cursorY = event.clientY;
}, true); // Capturing phase!

// --- SHADOW DOM TOAST SYSTEM ---

class SnapperToast {
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;

  constructor() {
    this.init();
  }

  private init() {
    let rootElement = document.getElementById("canva-snapper-toast-root");
    if (!rootElement) {
      rootElement = document.createElement("div");
      rootElement.id = "canva-snapper-toast-root";
      document.body.appendChild(rootElement);
    }
    
    if (!rootElement.shadowRoot) {
      this.shadow = rootElement.attachShadow({ mode: "open" });
      
      const svgFilterStr = `<svg xmlns="http://www.w3.org/2000/svg"><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" /><feComponentTransfer in="turbulence" result="mapped"><feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" /><feFuncG type="gamma" amplitude="0" exponent="1" offset="0" /><feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" /></feComponentTransfer><feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" /><feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight"><fePointLight x="-200" y="-200" z="300" /></feSpecularLighting><feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" /><feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G" /></filter></svg>`;
      const svgDataUri = `data:image/svg+xml;base64,${btoa(svgFilterStr)}#glass-distortion`;

      const style = document.createElement("style");
      style.textContent = `
        .toast-wrapper {
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 2147483647;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          pointer-events: none;
        }
        .toast-card {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 320px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 24px;
          box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
          color: #111;
          font-size: 14px;
          font-weight: 600;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 0.7s cubic-bezier(0.175, 0.885, 0.32, 2.2);
          pointer-events: auto;
          cursor: pointer;
        }
        .toast-card:hover {
          padding: 18px 22px;
          border-radius: 28px;
        }
        .toast-card.show {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .glass-layer-1 {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          border-radius: inherit;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          filter: url('${svgDataUri}');
          isolation: isolate;
        }
        .glass-layer-2 {
          position: absolute;
          inset: 0;
          z-index: 10;
          border-radius: inherit;
          background: rgba(255, 255, 255, 0.25);
        }
        .glass-layer-3 {
          position: absolute;
          inset: 0;
          z-index: 20;
          overflow: hidden;
          border-radius: inherit;
          box-shadow: inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5);
        }
        .content-layer {
          position: relative;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        .message-content {
          flex-grow: 1;
          line-height: 1.4;
          letter-spacing: -0.2px;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid #FFE6E8;
          border-top-color: #E0465C;
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.76, 0, 0.24, 1) infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .success-icon {
          color: #E0465C;
        }
        .error-icon {
          color: #EF4444;
        }
      `;
      this.shadow.appendChild(style);
      
      this.container = document.createElement("div");
      this.container.className = "toast-wrapper";
      this.shadow.appendChild(this.container);
    } else {
      this.shadow = rootElement.shadowRoot;
      this.container = this.shadow.querySelector(".toast-wrapper") as HTMLElement;
    }
  }

  public show(type: "loading" | "success" | "error", message: string) {
    this.init();
    if (!this.container) return;

    this.container.innerHTML = "";

    const card = document.createElement("div");
    card.className = "toast-card";

    let iconHtml = "";
    if (type === "loading") {
      iconHtml = '<div class="spinner"></div>';
    } else if (type === "success") {
      iconHtml = `
        <svg class="success-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
    } else {
      iconHtml = `
        <svg class="error-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      `;
    }

    card.innerHTML = `
      <div class="glass-layer-1"></div>
      <div class="glass-layer-2"></div>
      <div class="glass-layer-3"></div>
      <div class="content-layer">
        <div class="icon-container">${iconHtml}</div>
        <div class="message-content">${message}</div>
      </div>
    `;

    this.container.appendChild(card);
    setTimeout(() => card.classList.add("show"), 10);

    if (type !== "loading") {
      setTimeout(() => {
        card.classList.remove("show");
        setTimeout(() => card.remove(), 300);
      }, 3500);
    }
  }
}

const toast = new SnapperToast();

// Helper to create low-res thumbnail for history log
function createThumbnail(originalCanvas: HTMLCanvasElement, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    if (width <= maxWidth) {
      resolve(originalCanvas.toDataURL("image/png"));
      return;
    }
    const scale = maxWidth / width;
    const thumbWidth = maxWidth;
    const thumbHeight = height * scale;
    
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const ctx = thumbCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(originalCanvas, 0, 0, thumbWidth, thumbHeight);
      resolve(thumbCanvas.toDataURL("image/jpeg", 0.75));
    } else {
      resolve(originalCanvas.toDataURL("image/jpeg", 0.75));
    }
  });
}

// Core function to capture, process, and copy the image
function captureAndCopyImage(imageUrl: string, width: number, height: number, isSvg: boolean) {
  chrome.storage.local.get({ session: null, history: [], autoDownloadFormat: 'none' }, (res: any) => {
    const session = res.session || { tier: 'free' };
    const autoDownloadFormat = res.autoDownloadFormat;

    logDiagnostic(`Starting capture: ${imageUrl.substring(0, 60)}...`, { width, height, isSvg });
    toast.show("loading", isSvg ? "Snapping vector graphic..." : "Snapping Canva asset...");

  const processAndWrite = (srcUrl: string, corsBypass: boolean) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = srcUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const finalWidth = img.naturalWidth || width || img.width;
        const finalHeight = img.naturalHeight || height || img.height;
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          logDiagnostic("Error: Failed to create canvas 2D context");
          toast.show("error", "Failed to create canvas context.");
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((pngBlob) => {
          if (corsBypass) URL.revokeObjectURL(srcUrl);
          
          if (!pngBlob) {
            logDiagnostic("Error: Canvas.toBlob returned null");
            toast.show("error", "Failed to export transparent PNG.");
            return;
          }
          
          const clipboardItems: Record<string, Blob> = {
            "image/png": pngBlob
          };
          
          if (isSvg) {
            const svgString = getSvgStringFromDataUrl(imageUrl);
            if (svgString) {
              clipboardItems["text/plain"] = new Blob([svgString], { type: "text/plain" });
              clipboardItems["text/html"] = new Blob([svgString], { type: "text/html" });
            }
          }
          
          const tryWrite = (items: Record<string, Blob>) => {
            return navigator.clipboard.write([
              new ClipboardItem(items)
            ]);
          };
          
          tryWrite(clipboardItems)
            .then(() => {
              logDiagnostic("Success: Copied assets to clipboard", Object.keys(clipboardItems));
              toast.show("success", `Copied to clipboard! (${finalWidth}x${finalHeight}px)`);
              
              if (autoDownloadFormat !== 'none' && session.tier === 'pro') {
                const format = autoDownloadFormat;
                const dataUrl = canvas.toDataURL(`image/${format}`, 0.8);
                chrome.runtime.sendMessage({
                  action: "trigger_download",
                  url: dataUrl,
                  filename: `canva-snap-${Date.now()}.${format}`
                });
              }

              // Add to history
              createThumbnail(canvas, 150).then((thumbnailBase64) => {
                if (isContextValid()) {
                  try {
                    chrome.runtime.sendMessage({
                      action: "add_to_history",
                      data: {
                        url: imageUrl,
                        thumbnail: thumbnailBase64,
                        width: finalWidth,
                        height: finalHeight
                      }
                    });
                  } catch (e) {
                    // Ignore context invalidation
                  }
                }
              });
            })
            .catch((err) => {
              logDiagnostic("Error: Clipboard write rejected. Retrying PNG-only fallback.", err.message || err);
              if (isSvg && (clipboardItems["text/plain"] || clipboardItems["text/html"])) {
                tryWrite({ "image/png": pngBlob })
                  .then(() => {
                    logDiagnostic("Success: Copied PNG only (fallback) to clipboard");
                    toast.show("success", `Copied PNG to clipboard! (${finalWidth}x${finalHeight}px)`);
                    
                    createThumbnail(canvas, 150).then((thumbnailBase64) => {
                      if (isContextValid()) {
                        try {
                          chrome.runtime.sendMessage({
                            action: "add_to_history",
                            data: {
                              url: imageUrl,
                              thumbnail: thumbnailBase64,
                              width: finalWidth,
                              height: finalHeight
                            }
                          });
                        } catch (e) {
                          // Ignore context invalidation
                        }
                      }
                    });
                  })
                  .catch((fallbackErr) => {
                    logDiagnostic("Error: Fallback clipboard write rejected", fallbackErr.message || fallbackErr);
                    toast.show("error", `Clipboard access blocked: ${fallbackErr.message || fallbackErr}`);
                  });
              } else {
                toast.show("error", `Clipboard access blocked: ${err.message || err}`);
              }
            });
        }, "image/png");
        
      } catch (err: any) {
        if (corsBypass) URL.revokeObjectURL(srcUrl);
        logDiagnostic("Error: Draw/Export exception", err.message || err);
        toast.show("error", `Extraction error: ${err.message || err}`);
      }
    };
    
    img.onerror = () => {
      if (corsBypass) URL.revokeObjectURL(srcUrl);
      logDiagnostic("Error: Image failed to decode/load");
      toast.show("error", "Failed to decode Canva asset bytes.");
    };
  };

  if (isContextValid()) {
    try {
      chrome.runtime.sendMessage(
        { action: "fetch_image_cors", url: imageUrl, snapType: isSvg ? 'svg' : 'png' },
        (response) => {
          if (!isContextValid()) return;
          if (!response || !response.success) {
            logDiagnostic("Error: CORS fetch proxy or credit validation failed", response?.error);
            toast.show("error", response?.message || "Limit reached. Please upgrade to Pro.");
            return;
          }

          try {
            const binaryString = atob(response.base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: response.contentType });
            const objectUrl = URL.createObjectURL(blob);
            processAndWrite(objectUrl, true);
          } catch (err: any) {
            logDiagnostic("Error: Base64 decode failed", err.message || err);
            toast.show("error", `Decode error: ${err.message || err}`);
          }
        }
      );
    } catch (e) {
      logDiagnostic("Failed to send fetch_image_cors message (context invalidated)");
      toast.show("error", "Extension was reloaded. Please refresh Canva to continue.");
    }
  } else {
    toast.show("error", "Extension was reloaded. Please refresh Canva to continue.");
  }
  }); // close chrome.storage.local.get
}

// Listen to capture action triggered from Background Service Worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "trigger_capture") {
    if (!isEnabled) return;
    logDiagnostic("Received trigger_capture message from background");
    if (!lastImageUrl) {
      logDiagnostic("Warning: trigger_capture received but lastImageUrl is empty");
      toast.show("error", "No Canva asset detected. Try right-clicking directly on an image.");
      return;
    }
    captureAndCopyImage(lastImageUrl, lastWidth, lastHeight, isSvgAsset);
  }
});

// Keyboard Shortcut Alt+C: Copy the image currently hovered under cursor instantly
document.addEventListener("keydown", (event) => {
  if (!isEnabled) return;
  if (event.altKey && event.key.toLowerCase() === "c") {
    logDiagnostic("Alt+C keypress intercepted in capturing phase. Scanning...");
    const found = scanElementAtCoordinates(cursorX, cursorY);
    if (found && lastImageUrl) {
      captureAndCopyImage(lastImageUrl, lastWidth, lastHeight, isSvgAsset);
    } else {
      toast.show("error", "No Canva image or vector graphic detected under the cursor.");
    }
  }
}, true); // Capturing phase!

// Log initial injection success
logDiagnostic("Canva Snapper Content Script injected successfully.");
