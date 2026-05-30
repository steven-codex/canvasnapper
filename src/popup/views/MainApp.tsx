import React, { useEffect, useState } from 'react';
import { Sparkles, Info, RefreshCw, Layers, Terminal, ChevronDown, ChevronUp, Trash2, LogOut, Settings } from 'lucide-react';
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

export const MainApp: React.FC = () => {
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

  return (
    <div className="relative w-full flex flex-col p-5 overflow-hidden select-none font-sans text-[var(--color-text-body)] bg-[var(--color-bg)] z-0 min-h-[500px]">
      
      {toastMessage && (
        <div className={`absolute top-4 left-4 right-4 z-50 flex items-center justify-center p-3 rounded-[16px] border text-[13px] font-semibold transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] ${
          toastType === 'success'
            ? 'bg-white border-[var(--color-accent-100)] text-[var(--color-accent-600)]'
            : 'bg-white border-red-200 text-red-500'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-spring)' }}>
          {toastMessage}
        </div>
      )}

      <header className="relative flex flex-col pb-4 border-b border-[var(--color-border)] z-10 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-neutral-25)] border border-[var(--color-border)] shadow-sm">
              <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-[var(--color-text)] leading-none tracking-tight shiny-hover">Canva Snapper</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${session?.tier === 'pro' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-neutral-100)] text-[var(--color-text-muted)]'}`}>
                  {session?.tier === 'pro' ? 'PRO TIER' : 'FREE TIER'}
                </span>
                {session?.tier === 'free' && (
                  <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                    {10 - history.length} snaps left today
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleToggle}
              className="relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              style={{ backgroundColor: isEnabled ? 'var(--color-accent)' : 'var(--color-neutral-100)' }}
              title={isEnabled ? "Pause Snapper" : "Enable Snapper"}
            >
              <span 
                className="pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-[1px] ml-[1px]"
                style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(0px)', transitionTimingFunction: 'var(--ease-spring)' }}
              />
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-[var(--color-neutral-25)] text-[var(--color-neutral-400)] hover:text-red-500 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className={`relative flex flex-col flex-grow mt-4 transition-opacity duration-300 z-10 ${isEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        
        <section className="p-4 bg-[var(--color-neutral-25)] border border-[var(--color-border)] rounded-[20px] flex gap-3 shadow-[inset_0_4px_10px_rgba(255,255,255,0.8)]">
          <Info className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            <p className="font-semibold text-[13px] text-[var(--color-text)] leading-none mb-1.5 tracking-tight">How to Snap Assets:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Hover on image/graphic + press <strong className="text-[var(--color-text)] font-semibold bg-white border border-[var(--color-border)] px-1.5 py-0.5 rounded-md text-[11px] shadow-sm">Alt + C</strong>.</li>
              <li>Or press <strong className="text-[var(--color-text)] font-semibold bg-white border border-[var(--color-border)] px-1.5 py-0.5 rounded-md text-[11px] shadow-sm">Shift + Right Click</strong> ➡️ Copy Canva Image.</li>
            </ul>
          </div>
        </section>

        {/* Format Selector */}
        {session?.tier === 'pro' && (
          <div className="mt-3 flex items-center justify-between p-3 bg-white border border-[var(--color-border)] rounded-[16px] shadow-sm">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--color-neutral-400)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">Auto-Download:</span>
            </div>
            <div className="flex bg-[var(--color-neutral-25)] rounded-lg p-0.5 border border-[var(--color-border)]">
              {(['none', 'webp', 'jpeg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => chrome.storage.local.set({ autoDownloadFormat: fmt })}
                  className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                    autoDownloadFormat === fmt
                      ? 'bg-white shadow-sm text-[var(--color-text)] border border-[var(--color-border)]'
                      : 'text-[var(--color-neutral-400)] hover:text-[var(--color-text-muted)] border border-transparent'
                  }`}
                >
                  {fmt === 'none' ? 'Off' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-1.5 tracking-tight">
            <Layers className="w-4 h-4 text-[var(--color-accent)]" />
            History Log ({history.length}/5)
          </h2>
          {history.length > 0 && isEnabled && (
            <button 
              onClick={handleClearHistory}
              className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex items-center gap-1 transition-colors cursor-pointer bg-[var(--color-neutral-25)] hover:bg-[var(--color-accent-25)] px-2 py-1 rounded-full border border-transparent hover:border-[var(--color-accent-100)]"
            >
              <RefreshCw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="flex-grow space-y-3 overflow-y-auto pr-1 max-h-[180px] scrollbar-hide">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[var(--color-border)] bg-[var(--color-neutral-25)] rounded-[24px]">
              <p className="text-[13px] text-[var(--color-text-muted)] font-medium">No assets copied yet</p>
              <p className="text-[11px] text-[var(--color-neutral-400)] mt-1">Start snapping assets inside Canva!</p>
            </div>
          ) : (
            history.map((item) => (
              <HistoryCard 
                key={item.id} 
                item={item} 
                onCopySuccess={(msg) => showToast(msg, 'success')}
                onCopyError={(msg) => showToast(msg, 'error')}
                isPro={session?.tier === 'pro'}
              />
            ))
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 tracking-tight">
              <Terminal className="w-4 h-4 text-[var(--color-neutral-400)]" />
              Diagnostic Logs ({diagnostics.length})
            </span>
            {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDiagnostics && (
            <div className="mt-2 flex flex-col bg-[var(--color-neutral-25)] border border-[var(--color-border)] rounded-[16px] p-3 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border)]">
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Live Stream</span>
                {diagnostics.length > 0 && (
                  <button
                    onClick={handleClearDiagnostics}
                    className="text-[9px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider bg-white border border-[var(--color-border)] px-1.5 py-0.5 rounded-md"
                    title="Clear diagnostics logs"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[120px] overflow-y-auto font-mono text-[10px] text-[var(--color-text-muted)] pr-1 select-text">
                {diagnostics.length === 0 ? (
                  <p className="text-[var(--color-neutral-400)] italic py-2 text-center">No logs generated. Reload Canva tab and press Alt+C.</p>
                ) : (
                  diagnostics.map((log, idx) => (
                    <div key={idx} className="border-b border-[var(--color-border)] pb-2 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[var(--color-text)] font-semibold">{log.message}</span>
                        <span className="text-[9px] text-[var(--color-neutral-350)] flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {log.data && (
                        <pre className="text-[var(--color-neutral-450)] mt-1 whitespace-pre-wrap leading-tight break-all max-w-[310px] overflow-hidden bg-white p-1.5 rounded-md border border-[var(--color-border)]">
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
      </div>

      {!isEnabled && (
        <div className="absolute inset-x-0 bottom-0 top-[65px] bg-white/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-25)] border border-[var(--color-border)] flex items-center justify-center mb-3 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)]">
            <Info className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[16px] font-semibold text-[var(--color-text)] tracking-tight">Snapper is Paused</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-2 max-w-[210px] leading-relaxed">
            Toggle the switch in the header back to <strong className="text-[var(--color-accent)]">Active</strong> to resume capturing Canva design assets.
          </p>
        </div>
      )}

      <footer className="relative pt-3 mt-4 border-t border-[var(--color-border)] text-center font-medium text-[10px] text-[var(--color-neutral-350)] tracking-wide z-10">
        <p>Created by steve.codex</p>
      </footer>
    </div>
  );
};
