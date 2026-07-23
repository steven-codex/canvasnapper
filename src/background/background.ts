// Background Service Worker for Canva Snapper (Pro Edition)

// Helper to update context menu item based on extension state
function updateContextMenuState(isEnabled: boolean) {
  chrome.contextMenus.update("copy-canva-image", {
    enabled: isEnabled,
    title: isEnabled ? "Copy Canva Image (Pro)" : "Copy Canva Image (Disabled)"
  }, () => {
    if (chrome.runtime.lastError) {
      // Silence runtime error
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
  if (url.includes("/thumbnail")) {
    upgradedUrl = url.replace(/\/thumbnail[^/]*\.(png|jpg|jpeg|webp)$/i, "/tl.png");
  } else if (url.includes("/screen")) {
    upgradedUrl = url.replace(/\/screen[^/]*\.(png|jpg|jpeg|webp)$/i, "/tl.png");
  }
  return upgradedUrl;
}

// Call Firebase Backend to validate snaps based on credits/tiers
async function validateSnapOnBackend(snapType: 'png' | 'svg'): Promise<{ allowed: boolean; reason?: string; message?: string; remainingCredits?: number }> {
  return new Promise((resolve) => {
    chrome.storage.local.get({ session: null }, async (result: any) => {
      const session = result.session || { tier: 'free', credits: 0 };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (session.isLoggedIn && session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      try {
        const response = await fetch("https://us-central1-canva-snapper-pro-9e1b3.cloudfunctions.net/validateSnap", {
          method: "POST",
          headers,
          body: JSON.stringify({
            snapType,
            fingerprint: session.fingerprint
          })
        });

        if (response.status === 401) {
          resolve({ allowed: false, reason: 'invalid_auth', message: 'Session expired. Please login again.' });
          return;
        }

        const data = await response.json();
        
        if (response.ok && data.allowed) {
          // Update local credits cache
          if (data.remainingCredits !== undefined && data.remainingCredits !== -1) {
            session.credits = data.remainingCredits;
            chrome.storage.local.set({ session });
          }
          resolve({ allowed: true, remainingCredits: data.remainingCredits });
        } else {
          resolve({ 
            allowed: false, 
            reason: data.reason || 'out_of_credits', 
            message: data.message || 'Limit reached. Please upgrade.' 
          });
        }

      } catch (err: any) {
        console.warn("Backend validation connection failed. Falling back to local offline mock limits.", err);
        // Developer friendly Mock Fallback: if backend not deployed yet, execute mock local rules
        if (session.tier === 'pro') {
          resolve({ allowed: true, remainingCredits: -1 });
        } else if (session.tier === 'guest') {
          const currentCredits = session.credits !== undefined ? session.credits : 3;
          const cost = snapType === 'svg' ? 3 : 1;
          if (currentCredits >= cost) {
            const nextCredits = currentCredits - cost;
            session.credits = nextCredits;
            chrome.storage.local.set({ session });
            resolve({ allowed: true, remainingCredits: nextCredits });
          } else {
            resolve({ allowed: false, reason: 'guest_limit_reached', message: 'You have exhausted your 3 guest credits. Please login to continue.' });
          }
        } else {
          // Free registered
          const currentCredits = session.credits !== undefined ? session.credits : 0;
          const cost = snapType === 'svg' ? 3 : 1;
          if (currentCredits >= cost) {
            const nextCredits = currentCredits - cost;
            session.credits = nextCredits;
            chrome.storage.local.set({ session });
            resolve({ allowed: true, remainingCredits: nextCredits });
          } else {
            resolve({ allowed: false, reason: 'out_of_credits', message: 'Requires subscription or credit package.' });
          }
        }
      }
    });
  });
}

// Handle runtime messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "fetch_image_cors") {
    const originalUrl = message.url;
    const highResUrl = getHighResUrl(originalUrl);
    const snapType = message.snapType || 'png';
    
    // Validate credits on server first!
    validateSnapOnBackend(snapType).then((validation) => {
      if (!validation.allowed) {
        sendResponse({
          success: false,
          error: validation.reason,
          message: validation.message
        });
        return;
      }

      // If allowed, fetch the image biner
      const attemptFetch = (targetUrl: string, isFallback: boolean) => {
        if (targetUrl.startsWith("data:")) {
          try {
            const commaIndex = targetUrl.indexOf(',');
            const semiIndex = targetUrl.indexOf(';');
            const contentType = targetUrl.substring(5, semiIndex);
            const base64Data = targetUrl.substring(commaIndex + 1);
            sendResponse({
              success: true,
              contentType,
              base64Data,
              remainingCredits: validation.remainingCredits
            });
          } catch (e: any) {
            sendResponse({ success: false, error: e.message });
          }
          return;
        }

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
              base64Data,
              remainingCredits: validation.remainingCredits
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
    });

    return true; // Keeps message channel open
  }

  if (message.action === "add_to_history") {
    const { url, thumbnail, width, height } = message.data;
    
    chrome.storage.local.get({ history: [] }, (result: any) => {
      const history = result.history || [];
      
      const newItem = {
        id: Date.now().toString(),
        url,
        thumbnail,
        width,
        height,
        timestamp: Date.now()
      };
      
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
    return true; // Keep channel open
  }
  
  if (message.action === "create_polar_checkout") {
    const { type } = message;
    chrome.storage.local.get({ session: null }, async (result: any) => {
      const session = result.session;
      if (!session || !session.token) {
        sendResponse({ success: false, error: 'unauthorized', message: 'Please login first.' });
        return;
      }

      try {
        const response = await fetch("https://us-central1-canva-snapper-pro-9e1b3.cloudfunctions.net/createCheckoutSession", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          },
          body: JSON.stringify({ type })
        });
        const data = await response.json();
        if (response.ok && data.url) {
          sendResponse({ success: true, url: data.url });
        } else {
          sendResponse({ success: false, error: data.error || 'checkout_failed' });
        }
      } catch (err: any) {
        // Fallback for development if functions not deployed
        console.warn("Backend checkout call failed. Opening Polar mock sandbox link.");
        sendResponse({ success: true, url: 'https://sandbox.polar.sh/mock_sandbox' });
      }
    });
    return true;
  }
});
