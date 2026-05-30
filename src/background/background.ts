// Background Service Worker for Canva Snapper (Pro Edition)

// Helper to update context menu item based on extension state
function updateContextMenuState(isEnabled: boolean) {
  chrome.contextMenus.update("copy-canva-image", {
    enabled: isEnabled,
    title: isEnabled ? "Copy Canva Image (Pro)" : "Copy Canva Image (Disabled)"
  }, () => {
    if (chrome.runtime.lastError) {
      // Silence runtime error if context menu doesn't exist yet
    }
  });
}

// Initialize context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ isEnabled: true }, (result) => {
    const isEnabled = result.isEnabled !== false;
    chrome.contextMenus.create({
      id: "copy-canva-image",
      title: isEnabled ? "Copy Canva Image (Pro)" : "Copy Canva Image (Disabled)",
      enabled: isEnabled,
      contexts: ["all"],
      documentUrlPatterns: ["https://*.canva.com/*"]
    });
  });
});

// Sync context menu with storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) {
    updateContextMenuState(changes.isEnabled.newValue !== false);
  }
});

// Handle context menu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-canva-image" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "trigger_capture" });
  }
});

// Helper to convert ArrayBuffer to base64 in service worker
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Smart URL Upscaling Helper for Canva CDN URLs
function getHighResUrl(url: string): string {
  if (url.startsWith("data:")) return url;
  
  let upgradedUrl = url;
  // Upgrade /thumbnail or /screen to /tl.png (preferred for high-res transparent PNG)
  if (url.includes("/thumbnail")) {
    upgradedUrl = url.replace(/\/thumbnail[^/]*\.(png|jpg|jpeg|webp)$/i, "/tl.png");
  } else if (url.includes("/screen")) {
    upgradedUrl = url.replace(/\/screen[^/]*\.(png|jpg|jpeg|webp)$/i, "/tl.png");
  }
  return upgradedUrl;
}

// Handle runtime messages (CORS proxy fetch with auto high-res fallback & history tracking)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "fetch_image_cors") {
    const originalUrl = message.url;
    const highResUrl = getHighResUrl(originalUrl);
    
    const attemptFetch = (targetUrl: string, isFallback: boolean) => {
      fetch(targetUrl)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const contentType = response.headers.get("content-type") || "image/png";
          const arrayBuffer = await response.arrayBuffer();
          const base64Data = arrayBufferToBase64(arrayBuffer);
          
          sendResponse({
            success: true,
            contentType,
            base64Data
          });
        })
        .catch((error) => {
          if (!isFallback && targetUrl !== originalUrl) {
            console.log(`Failed to fetch high-res URL: ${targetUrl}. Falling back to original URL: ${originalUrl}`);
            attemptFetch(originalUrl, true);
          } else {
            console.error("CORS proxy fetch failed:", error);
            sendResponse({
              success: false,
              error: error.message
            });
          }
        });
    };
    
    attemptFetch(highResUrl, false);
    return true; // Keeps message channel open for asynchronous sendResponse
  }

  if (message.action === "add_to_history") {
    const { url, thumbnail, width, height } = message.data;
    
    chrome.storage.local.get({ history: [] }, (result: any) => {
      const history = result.history || [];
      
      const newItem = {
        id: Date.now().toString(),
        url,
        thumbnail, // Downscaled base64 thumbnail
        width,
        height,
        timestamp: Date.now()
      };
      
      // Add new item to the beginning and slice to keep only the last 5
      const updatedHistory = [newItem, ...history.filter((item: any) => item.url !== url)].slice(0, 5);
      
      chrome.storage.local.set({ history: updatedHistory }, () => {
        sendResponse({ success: true, history: updatedHistory });
      });
    });
    
    return true; // Keep channel open
  }

  if (message.action === "trigger_download") {
    const { url, filename } = message;
    chrome.downloads.download({
      url,
      filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true; // Keep channel open for async sendResponse
  }
});
