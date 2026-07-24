import React, { useEffect, useState } from 'react';
import { Info, RefreshCw, Layers, Terminal, ChevronDown, ChevronUp, Trash2, LogOut, Settings } from 'lucide-react';
import { HistoryCard } from '../components/HistoryCard';
import { type UserSession, getSession, logout } from '../../lib/auth';

interface HistoryItem {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  timestamp: number;
}

interface DiagnosticEntry {
  timestamp: number;
  message: string;
  data?: string;
}

interface MainAppProps {
  onNavigateToPricing?: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ onNavigateToPricing }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const [autoDownloadFormat, setAutoDownloadFormat] = useState<'none'|'webp'|'jpeg'>('none');

  const loadData = async () => {
    const s = await getSession();
    setSession(s);

    chrome.storage.local.get({ history: [], diagnostics: [], isEnabled: true, autoDownloadFormat: 'none' }, (result: any) => {
      setHistory(result.history || []);
      setDiagnostics(result.diagnostics || []);
      setIsEnabled(result.isEnabled !== false);
      setAutoDownloadFormat(result.autoDownloadFormat);
    });
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.history) setHistory((changes.history.newValue as HistoryItem[]) || []);
      if (changes.diagnostics) setDiagnostics((changes.diagnostics.newValue as DiagnosticEntry[]) || []);
      if (changes.isEnabled) setIsEnabled(changes.isEnabled.newValue !== false);
      if (changes.session) setSession(changes.session.newValue as UserSession);
      if (changes.autoDownloadFormat) setAutoDownloadFormat(changes.autoDownloadFormat.newValue as 'none' | 'webp' | 'jpeg');
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleClearHistory = () => {
    chrome.storage.local.set({ history: [] }, () => {
      setHistory([]);
      showToast("History cleared");
    });
  };

  const handleClearDiagnostics = () => {
    chrome.storage.local.set({ diagnostics: [] }, () => {
      setDiagnostics([]);
      showToast("Diagnostics cleared");
    });
  };

  const handleToggle = () => {
    const nextState = !isEnabled;
    chrome.storage.local.set({ isEnabled: nextState }, () => {
      setIsEnabled(nextState);
      showToast(nextState ? "Snapper Enabled" : "Snapper Paused");
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleBuyCredits = () => {
    if (onNavigateToPricing) {
      onNavigateToPricing();
    } else {
      chrome.runtime.sendMessage({ action: "create_polar_checkout", type: "credits" }, (res) => {
        if (res && res.success && res.url) {
          window.open(res.url, "_blank");
        } else {
          showToast("Polar checkout failed", "error");
        }
      });
    }
  };

  const handleUpgradeToPro = () => {
    if (onNavigateToPricing) {
      onNavigateToPricing();
    } else {
      chrome.runtime.sendMessage({ action: "create_polar_checkout", type: "subscription" }, (res) => {
        if (res && res.success && res.url) {
          window.open(res.url, "_blank");
        } else {
          showToast("Polar checkout failed", "error");
        }
      });
    }
  };

  return (
    <div className="relative w-full flex flex-col p-5 overflow-hidden select-none font-sans text-[#0d1216] bg-[#fcfbfa] z-0 min-h-[500px]">
      {/* Dot Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 z-0"
        style={{
          backgroundImage: `
            radial-gradient(#0d1216 1.5px, transparent 1.5px)
          `,
          backgroundSize: '16px 16px',
        }}
      />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`absolute top-4 left-4 right-4 z-50 flex items-center justify-center p-3 border-2 border-[#0d1216] text-[11px] font-mono font-black uppercase transition-all duration-150 shadow-[4px_4px_0px_0px_#0d1216] ${
            toastType === 'success' ? 'bg-[#00c4cc] text-[#0d1216]' : 'bg-[#E01E5A] text-white'
          }`}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="relative flex flex-col pb-4 border-b-2 border-[#0d1216] z-10 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden border-2 border-[#0d1216] shadow-[2.5px_2.5px_0px_0px_#0d1216] bg-white p-0.5">
              <img 
                src="/ChatGPT Image Jul 14, 2026, 12_33_24 AM.png" 
                className="w-full h-full object-contain rounded-lg" 
                alt="Canva Snapper Logo"
              />
            </div>
            <div>
              <h1 className="text-[16px] font-black text-[#0d1216] leading-none tracking-tight uppercase font-mono flex items-center gap-1">
                Canva Snapper
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#0d1216] ${
                  session?.tier === 'pro' 
                    ? 'bg-[#00c4cc] text-[#0d1216]' 
                    : session?.tier === 'guest'
                      ? 'bg-[#ffd100] text-[#0d1216]'
                      : 'bg-[#f4f5f6] text-[#6f767e]'
                }`}>
                  {session?.tier === 'pro' ? 'PRO TIER' : session?.tier === 'guest' ? 'GUEST TIER' : 'FREE TIER'}
                </span>
                {session?.tier !== 'pro' && (
                  <span className="text-[10px] font-mono font-bold text-[#7d2ae7]">
                    {session?.credits !== undefined ? session.credits : 0} snaps left
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session?.email?.toLowerCase() === 'stevenallenofc@gmail.com' && (
              <button 
                onClick={() => window.open('http://localhost:5173/#admin', '_blank')}
                className="p-1.5 rounded border-2 border-[#0d1216] bg-[#ffd100] hover:bg-yellow-400 text-[#0d1216] shadow-[1.5px_1.5px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Open Admin Dashboard"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={handleToggle}
              className="relative inline-flex h-[24px] w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#0d1216] transition-colors duration-200 ease-in-out focus:outline-none shadow-[2px_2px_0px_0px_#0d1216]"
              style={{ backgroundColor: isEnabled ? '#00c4cc' : '#e8ecef' }}
              title={isEnabled ? "Pause Snapper" : "Enable Snapper"}
            >
              <span 
                className="pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white border border-[#0d1216] shadow-sm transition duration-200 ease-in-out mt-[2px] ml-[2px]"
                style={{ transform: isEnabled ? 'translateX(20px)' : 'translateX(0px)', transitionTimingFunction: 'var(--ease-spring)' }}
              />
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded border-2 border-transparent hover:border-[#0d1216] hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body Area */}
      <div className={`relative flex flex-col flex-grow mt-4 transition-opacity duration-300 z-10 ${isEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        
        {/* Instructions Box */}
        <section className="p-4 bg-white border-2 border-[#0d1216] shadow-[3.5px_3.5px_0px_0px_#0d1216] flex gap-3">
          <Info className="w-5 h-5 text-[#7d2ae7] flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-[#2b2f33] font-mono">
            <p className="font-black text-[#0d1216] leading-none mb-1.5 tracking-tight uppercase">How to Snap Assets:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Hover on element + press <kbd className="text-[#7d2ae7] font-black bg-white border-2 border-[#0d1216] px-1.5 py-0.5 rounded text-[10px] shadow-[1.5px_1.5px_0px_0px_#0d1216]">Alt + C</kbd>.</li>
              <li>Or press <kbd className="text-[#0d1216] font-bold bg-white border-2 border-[#0d1216] px-1.5 py-0.5 rounded text-[10px] shadow-[1.5px_1.5px_0px_0px_#0d1216]">Shift + Right Click</kbd> ➡️ Copy Image.</li>
            </ul>
          </div>
        </section>

        {/* Upgrade & Credits Deck Card */}
        {session?.tier !== 'pro' && (
          <div className="mt-3.5 p-4 bg-[#ffd100] border-2 border-[#0d1216] shadow-[4px_4px_0px_0px_#0d1216] flex flex-col gap-2">
            <div className="text-[11px] font-mono text-[#0d1216] font-black flex items-center justify-between px-0.5 uppercase">
              <span>Upgrade Powers</span>
              <span className="text-[#7d2ae7] font-black">{session?.credits !== undefined ? session.credits : 0} snaps left</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button 
                onClick={handleBuyCredits}
                className="py-2 px-3 bg-white border-2 border-[#0d1216] hover:bg-[#fafafa] rounded text-[9.5px] font-mono font-bold text-[#0d1216] shadow-[2px_2px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                +100 Snaps ($2.99)
              </button>
              <button 
                onClick={handleUpgradeToPro}
                className="py-2 px-3 bg-[#7d2ae7] text-white border-2 border-[#0d1216] hover:bg-[#6c20ce] rounded text-[9.5px] font-mono font-bold shadow-[2px_2px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Unlock Pro ($4.99/mo)
              </button>
            </div>
          </div>
        )}

        {/* Auto-Download Options (Pro Only) */}
        {session?.tier === 'pro' && (
          <div className="mt-3.5 flex items-center justify-between p-3.5 bg-white border-2 border-[#0d1216] shadow-[3.5px_3.5px_0px_0px_#0d1216]">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#7d2ae7]" />
              <span className="text-[11px] font-mono font-black text-[#0d1216] uppercase">Auto-Download:</span>
            </div>
            <div className="flex bg-[#f4f5f6] border-2 border-[#0d1216] rounded-lg p-0.5">
              {(['none', 'webp', 'jpeg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => chrome.storage.local.set({ autoDownloadFormat: fmt })}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                    autoDownloadFormat === fmt
                      ? 'bg-[#00c4cc] shadow-[1.5px_1.5px_0px_0px_#0d1216] text-[#0d1216] border border-[#0d1216]'
                      : 'text-gray-400 hover:text-gray-700 border border-transparent'
                  }`}
                >
                  {fmt === 'none' ? 'Off' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History Log Title */}
        <div className="flex items-center justify-between mt-5 mb-2.5">
          <h2 className="text-[11px] font-mono font-black text-[#0d1216] flex items-center gap-1.5 tracking-wider uppercase">
            <Layers className="w-4 h-4 text-[#7d2ae7]" />
            History Log ({history.length}/5)
          </h2>
          {history.length > 0 && isEnabled && (
            <button 
              onClick={handleClearHistory}
              className="text-[9px] font-mono font-bold text-[#0d1216] hover:bg-[#fafafa] flex items-center gap-1 transition-colors cursor-pointer bg-white border-2 border-[#0d1216] px-2.5 py-1 shadow-[2px_2px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Clear
            </button>
          )}
        </div>

        {/* History Log Content */}
        <div className="flex-grow space-y-3 overflow-y-auto pr-0.5 max-h-[190px] scrollbar-hide">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[#0d1216] bg-white rounded-xl">
              <p className="text-[11px] font-mono font-black text-[#0d1216] uppercase">Workspace Empty</p>
              <p className="text-[9px] font-mono text-gray-500 mt-1">Hover element on Canva & press Alt + C!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 pb-2">
              {history.map((item) => (
                <HistoryCard 
                  key={item.id} 
                  item={item} 
                  onCopySuccess={(msg) => showToast(msg, 'success')}
                  onCopyError={(msg) => showToast(msg, 'error')}
                  isPro={session?.tier === 'pro'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Logs Accordion (Admin only) */}
        {session?.email?.toLowerCase() === 'stevenallenofc@gmail.com' && (
          <div className="mt-4 pt-3 border-t-2 border-[#0d1216]">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-[#0d1216] hover:text-[#7d2ae7] transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 uppercase">
                <Terminal className="w-4 h-4 text-[#7d2ae7]" />
                Diagnostic Logs ({diagnostics.length})
              </span>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="mt-2 flex flex-col bg-white border-2 border-[#0d1216] rounded-xl p-3 shadow-[3px_3px_0px_0px_#0d1216]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-[#0d1216]">
                  <span className="text-[9px] font-mono font-black uppercase text-[#0d1216]">Live Stream</span>
                  {diagnostics.length > 0 && (
                    <button
                      onClick={handleClearDiagnostics}
                      className="text-[9px] font-mono font-bold text-[#0d1216] hover:bg-red-50 flex items-center gap-1 cursor-pointer uppercase bg-white border border-[#0d1216] px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]"
                      title="Clear diagnostics logs"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-red-500" />
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-[120px] overflow-y-auto font-mono text-[10px] text-[#2b2f33] pr-1 select-text">
                  {diagnostics.length === 0 ? (
                    <p className="text-gray-400 italic py-2 text-center">No logs generated. Reload Canva tab and press Alt+C.</p>
                  ) : (
                    diagnostics.map((log, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#0d1216] font-bold">{log.message}</span>
                          <span className="text-[9px] text-gray-400 flex-shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.data && (
                          <pre className="text-gray-600 mt-1 whitespace-pre-wrap leading-tight break-all max-w-[310px] overflow-hidden bg-[#f4f5f6] p-1.5 rounded border border-[#0d1216]">
                            {log.data}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paused State Screen */}
      {!isEnabled && (
        <div className="absolute inset-x-0 bottom-0 top-[65px] bg-[#fcfbfa]/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center border-t-2 border-[#0d1216]">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0d1216] flex items-center justify-center mb-3 shadow-[3px_3px_0px_0px_#0d1216]">
            <Info className="w-6 h-6 text-[#7d2ae7]" />
          </div>
          <p className="text-[15px] font-mono font-black text-[#0d1216] tracking-tight uppercase">Snapper is Paused</p>
          <p className="text-[11px] font-mono text-[#2b2f33] mt-2 max-w-[210px] leading-relaxed">
            Toggle the switch in the header back to <strong className="text-[#00c4cc]">Active</strong> to resume capturing Canva design assets.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="relative pt-3 mt-4 border-t-2 border-[#0d1216]/10 text-center font-mono font-bold text-[9px] text-gray-400 tracking-wider z-10 uppercase">
        <p>© 2026 CANVA SNAPPER PRO • STEVE.CODEX</p>
      </footer>
    </div>
  );
};
