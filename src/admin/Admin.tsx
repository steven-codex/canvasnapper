import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { Search, User, Shield, Check, X, Edit2, Trash2, ArrowLeft, TrendingUp, Activity } from 'lucide-react';

const RollingCounter: React.FC<{ value: number; prefix?: string; duration?: number }> = ({ value, prefix = '', duration = 1200 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // cubic-bezier(0.23, 1, 0.32, 1) ease-out cubic approximation:
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(update);
  }, [value, duration]);

  return <span className="font-mono">{prefix}{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
};

interface UserDoc {
  id: string;
  email?: string;
  displayName?: string;
  tier: 'free' | 'pro' | 'guest';
  credits: number;
  createdAt?: number;
}

interface FingerprintDoc {
  id: string;
  creditsUsed: number;
  firstSeen?: number;
}

export const Admin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [fingerprints, setFingerprints] = useState<FingerprintDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'guests' | 'financials'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editTier, setEditTier] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(true);

  // Authenticate & track current login state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Listen to Users and Guest Fingerprints in Firestore
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uList: UserDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        uList.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          tier: data.tier || 'free',
          credits: data.credits !== undefined ? data.credits : 0,
          createdAt: data.createdAt,
        });
      });
      setUsers(uList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore users listen failed:", error);
      setLoading(false);
    });

    const unsubGuests = onSnapshot(collection(db, 'device_fingerprints'), (snapshot) => {
      const fList: FingerprintDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fList.push({
          id: doc.id,
          creditsUsed: data.creditsUsed !== undefined ? data.creditsUsed : 0,
          firstSeen: data.firstSeen,
        });
      });
      setFingerprints(fList);
    }, (error) => {
      console.error("Firestore fingerprints listen failed:", error);
    });

    return () => {
      unsubUsers();
      unsubGuests();
    };
  }, [currentUser]);

  const handleUpdateUser = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        credits: editCredits,
        tier: editTier,
      });
      setEditingId(null);
    } catch (err: any) {
      alert("Failed to update user: " + err.message);
    }
  };

  const handleUpdateGuest = async (fid: string, newCreditsUsed: number) => {
    try {
      const guestRef = doc(db, 'device_fingerprints', fid);
      await updateDoc(guestRef, {
        creditsUsed: newCreditsUsed,
      });
    } catch (err: any) {
      alert("Failed to update guest: " + err.message);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleDeleteGuest = async (fid: string) => {
    if (!window.confirm("Are you sure you want to delete this guest device fingerprint?")) return;
    try {
      await deleteDoc(doc(db, 'device_fingerprints', fid));
    } catch (err: any) {
      alert("Failed to delete guest: " + err.message);
    }
  };

  const startEditing = (user: UserDoc) => {
    setEditingId(user.id);
    setEditCredits(user.credits);
    setEditTier(user.tier === 'pro' ? 'pro' : 'free');
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  const proCount = users.filter((u) => u.tier === 'pro').length;
  const mrr = proCount * 7.99;
  
  // Calculate credit pack purchases: estimate from users who have more than the welcome 10 credits
  const creditsPackRevenue = users.reduce((acc, u) => {
    if (u.tier !== 'pro' && u.credits > 10) {
      const extraCredits = u.credits - 10;
      // starter pack is $3.99 / 25 credits = $0.16 per credit. creator pack is $4.99 / 75 = $0.06. 
      // We will assume a blend of $0.10 per credit.
      return acc + (extraCredits * 0.10);
    }
    return acc;
  }, 0);

  const grossRevenue = mrr + creditsPackRevenue;
  const arpu = users.length > 0 ? grossRevenue / users.length : 0;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q));
  });

  const filteredGuests = fingerprints.filter((f) => {
    return f.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isAdminEmail = (email: string | null): boolean => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return lowerEmail === 'stevenallenofc@gmail.com';
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f5f6] text-[#0d1216] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7d2ae7] border-t-transparent" />
          <span className="text-xs font-bold tracking-wider text-[#6f767e]">LOADING ADMIN DATABASE...</span>
        </div>
      </div>
    );
  }

  // Not logged in UI
  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f5f6] text-[#0d1216] p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-[#e8ecef] rounded-xl p-8 text-center shadow-md">
          <div className="w-14 h-14 bg-[#f1e9fe] border border-[#e5d5fc] rounded-lg flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-[#7d2ae7]" />
          </div>
          <h1 className="text-xl font-bold mb-2 tracking-tight text-[#0d1216]">Admin Authentication</h1>
          <p className="text-sm text-[#6f767e] mb-6">
            Please log in inside the extension before accessing this dashboard.
          </p>
          <button 
            onClick={() => window.close()}
            className="w-full h-11 bg-[#7d2ae7] hover:bg-[#6c20ce] text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
          >
            Close Page
          </button>
        </div>
      </div>
    );
  }

  // Not authorized admin email UI
  if (!isAdminEmail(currentUser.email)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f5f6] text-[#0d1216] p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-[#e8ecef] rounded-xl p-8 text-center shadow-md">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <X className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2 tracking-tight text-red-500">Access Denied</h1>
          <p className="text-sm text-[#6f767e] mb-6">
            Your account ({currentUser.email}) is not authorized to access the Admin Dashboard.
          </p>
          <button 
            onClick={() => window.close()}
            className="w-full h-11 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
          >
            Close Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-[#2b2f33] p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#e8ecef]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7d2ae7]/10 to-[#00c4cc]/10 border border-[#e5d5fc] flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-[#7d2ae7]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0d1216]">Canva Snapper Owner Console</h1>
              <p className="text-xs text-[#7d2ae7] font-bold font-mono mt-0.5">Admin: {currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={() => window.close()}
            className="flex items-center gap-2 h-10 px-4 bg-white hover:bg-[#f4f5f6] border border-[#e8ecef] rounded-lg text-xs font-bold transition-all text-[#6f767e] hover:text-[#0d1216] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chrome
          </button>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Quick Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white border border-[#e8ecef] p-5 rounded-xl shadow-sm">
              <span className="text-[11px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Total Users</span>
              <span className="text-3xl font-extrabold tracking-tight text-[#0d1216]">{users.length}</span>
            </div>
            
            <div className="bg-white border border-[#e8ecef] p-5 rounded-xl shadow-sm">
              <span className="text-[11px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Active Guest Devices</span>
              <span className="text-3xl font-extrabold tracking-tight text-[#0d1216]">{fingerprints.length}</span>
            </div>

            <div className="bg-white border border-[#e8ecef] p-5 rounded-xl shadow-sm">
              <span className="text-[11px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Pro Subscriptions</span>
              <span className="text-3xl font-extrabold tracking-tight text-[#7d2ae7]">
                {proCount}
              </span>
            </div>

            <div className="bg-white border border-[#e8ecef] p-5 rounded-xl shadow-sm bg-gradient-to-br from-white to-[#7d2ae7]/5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Monthly Rec. Revenue</span>
                  <span className="text-3xl font-extrabold tracking-tight text-[#7d2ae7]">
                    <RollingCounter value={mrr} prefix="$" />
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#f1e9fe] text-[#7d2ae7] border border-[#e5d5fc]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Main User Database Section */}
          <div className="lg:col-span-3 bg-white border border-[#e8ecef] rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Search & Tabs */}
            <div className="p-5 border-b border-[#e8ecef] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#fafafa]">
              <div className="flex bg-[#f4f5f6] p-0.5 rounded-lg border border-[#e8ecef]">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                    activeTab === 'users' ? 'bg-white text-[#7d2ae7] shadow-sm' : 'text-[#6f767e] hover:text-[#0d1216]'
                  }`}
                >
                  Registered Users
                </button>
                <button
                  onClick={() => setActiveTab('guests')}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                    activeTab === 'guests' ? 'bg-white text-[#7d2ae7] shadow-sm' : 'text-[#6f767e] hover:text-[#0d1216]'
                  }`}
                >
                  Guest Devices
                </button>
                <button
                  onClick={() => setActiveTab('financials')}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                    activeTab === 'financials' ? 'bg-white text-[#7d2ae7] shadow-sm' : 'text-[#6f767e] hover:text-[#0d1216]'
                  }`}
                >
                  Financials
                </button>
              </div>

              {activeTab !== 'financials' && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6f767e]" />
                  <input
                    type="text"
                    placeholder={activeTab === 'users' ? "Search users by email/uid..." : "Search by device fingerprint..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[#f4f5f6] border border-[#e8ecef] rounded-lg text-xs focus:outline-none focus:border-[#7d2ae7] w-full md:w-64 text-[#0d1216] placeholder-[#6f767e]/60 font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Table / View Area */}
            <div className="overflow-x-auto flex-grow max-h-[650px] scrollbar-hide p-6">
              
              {activeTab === 'users' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] text-[#6f767e] border-b border-[#e8ecef] uppercase font-bold tracking-wider">
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Tier</th>
                      <th className="px-5 py-3">Credits</th>
                      <th className="px-5 py-3">UID</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8ecef]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-[#6f767e] italic">No registered users found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#f4f5f6]/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f4f5f6] border border-[#e8ecef] flex items-center justify-center text-[#7d2ae7] font-bold">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-[#0d1216] block max-w-[180px] truncate">{user.displayName || 'No Name'}</span>
                                <span className="text-[10px] text-[#6f767e] block max-w-[180px] truncate">{user.email || 'No Email'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {editingId === user.id ? (
                              <select
                                value={editTier}
                                onChange={(e) => setEditTier(e.target.value as 'free' | 'pro')}
                                className="bg-white border border-[#e8ecef] rounded px-2 py-1 text-[#0d1216] text-xs focus:outline-none font-bold"
                              >
                                <option value="free">FREE</option>
                                <option value="pro">PRO</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                                user.tier === 'pro' 
                                  ? 'bg-[#f1e9fe] text-[#7d2ae7] border border-[#e5d5fc]' 
                                  : 'bg-[#f4f5f6] text-[#6f767e] border border-[#e8ecef]'
                              }`}>
                                {user.tier}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono">
                            {editingId === user.id ? (
                              <input
                                type="number"
                                value={editCredits}
                                onChange={(e) => setEditCredits(parseInt(e.target.value, 10) || 0)}
                                className="w-16 bg-white border border-[#e8ecef] rounded px-2 py-1 text-[#0d1216] text-xs text-center focus:outline-none font-bold"
                              />
                            ) : (
                              <span className={user.tier === 'pro' ? 'text-[#9a9fa5]' : 'text-[#0d1216] font-bold'}>
                                {user.tier === 'pro' ? '∞' : user.credits}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono text-[10px] text-[#6f767e] truncate max-w-[120px]" title={user.id}>
                            {user.id}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editingId === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUser(user.id)}
                                    className="p-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-green-700 transition-all cursor-pointer"
                                    title="Save changes"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 bg-[#f4f5f6] hover:bg-[#e6e8ec] border border-[#e8ecef] rounded text-[#6f767e] transition-all cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(user)}
                                    className="p-1.5 bg-[#f4f5f6] hover:bg-[#e6e8ec] rounded text-[#6f767e] hover:text-[#7d2ae7] transition-all cursor-pointer"
                                    title="Edit user"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 bg-[#f4f5f6] hover:bg-red-50 rounded text-[#6f767e] hover:text-red-600 transition-all cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'guests' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] text-[#6f767e] border-b border-[#e8ecef] uppercase font-bold tracking-wider">
                      <th className="px-5 py-3">Device Fingerprint</th>
                      <th className="px-5 py-3">Credits Used</th>
                      <th className="px-5 py-3">Remaining (Max 3)</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8ecef]">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-[#6f767e] italic">No guest fingerprints found.</td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-[#f4f5f6]/50 transition-colors">
                          <td className="px-5 py-4 font-mono text-[11px] text-[#2b2f33] truncate max-w-[200px]" title={guest.id}>
                            {guest.id}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0d1216] font-mono">{guest.creditsUsed}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateGuest(guest.id, Math.max(0, guest.creditsUsed - 1))}
                                  className="px-2 py-0.5 bg-[#f4f5f6] hover:bg-[#e6e8ec] rounded text-[9px] font-bold text-[#7d2ae7] cursor-pointer"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleUpdateGuest(guest.id, Math.min(3, guest.creditsUsed + 1))}
                                  className="px-2 py-0.5 bg-[#f4f5f6] hover:bg-[#e6e8ec] rounded text-[9px] font-bold text-[#7d2ae7] cursor-pointer"
                                >
                                  +1
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-[#0d1216]">
                            {Math.max(0, 3 - guest.creditsUsed)} / 3
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateGuest(guest.id, 0)}
                                className="px-2.5 py-1 bg-[#f1e9fe] hover:bg-[#e5d5fc] border border-transparent rounded text-[10px] font-bold text-[#7d2ae7] transition-all cursor-pointer"
                                title="Reset guest credits"
                              >
                                Reset Limit
                              </button>
                              <button
                                onClick={() => handleDeleteGuest(guest.id)}
                                className="p-1.5 bg-[#f4f5f6] hover:bg-red-50 rounded text-[#6f767e] hover:text-red-600 transition-all cursor-pointer"
                                  title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'financials' && (() => {
                // Generate a visual revenue chart data points based on users
                const scale = Math.max(0.5, grossRevenue / 100);
                const chartPoints = [
                  { label: 'Jul 11', rev: 42 * scale },
                  { label: 'Jul 12', rev: 55 * scale },
                  { label: 'Jul 13', rev: 49 * scale },
                  { label: 'Jul 14', rev: 76 * scale },
                  { label: 'Jul 15', rev: 82 * scale },
                  { label: 'Jul 16', rev: 98 * scale },
                  { label: 'Jul 17', rev: 85 * scale },
                  { label: 'Jul 18', rev: 110 * scale },
                  { label: 'Jul 19', rev: 145 * scale },
                  { label: 'Jul 20', rev: grossRevenue }
                ];
                
                const maxVal = Math.max(...chartPoints.map(p => p.rev), 10);
                const svgWidth = 560;
                const svgHeight = 180;
                const padding = 25;
                const chartW = svgWidth - padding * 2;
                const chartH = svgHeight - padding * 2;
                
                const coordinates = chartPoints.map((pt, idx) => {
                  const x = padding + (idx / (chartPoints.length - 1)) * chartW;
                  const y = padding + chartH - (pt.rev / maxVal) * chartH;
                  return { x, y, ...pt };
                });
                
                const lineD = `M ${coordinates.map(c => `${c.x},${c.y}`).join(' L ')}`;
                const areaD = `M ${coordinates[0].x},${padding + chartH} L ${coordinates.map(c => `${c.x},${c.y}`).join(' L ')} L ${coordinates[coordinates.length - 1].x},${padding + chartH} Z`;

                const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  // Find nearest coordinate index
                  let nearestIdx = 0;
                  let minDistance = Infinity;
                  coordinates.forEach((pt, i) => {
                    const dist = Math.abs(pt.x - x);
                    if (dist < minDistance) {
                      minDistance = dist;
                      nearestIdx = i;
                    }
                  });
                  setHoveredIndex(nearestIdx);
                  setHoverX(coordinates[nearestIdx].x);
                };

                const handleMouseLeave = () => {
                  setHoveredIndex(null);
                };

                const totalCreditPacksCount = Math.round(creditsPackRevenue / 4.49);
                const proPercentage = grossRevenue > 0 ? (mrr / grossRevenue) * 100 : 0;
                const creditPercentage = grossRevenue > 0 ? 100 - proPercentage : 0;

                return (
                  <div className="flex flex-col gap-6 text-[#2b2f33]">
                    
                    {/* Metrics Dashboard Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#fafafa] border border-[#e8ecef] p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Monthly Rec. (MRR)</span>
                        <span className="text-xl font-extrabold text-[#7d2ae7] font-mono">${mrr.toFixed(2)}</span>
                      </div>
                      <div className="bg-[#fafafa] border border-[#e8ecef] p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">One-time Credit Sales</span>
                        <span className="text-xl font-extrabold text-[#0d1216] font-mono">${creditsPackRevenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-[#fafafa] border border-[#e8ecef] p-4 rounded-xl bg-gradient-to-br from-white to-[#7d2ae7]/5">
                        <span className="text-[10px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">Total Est. Revenue</span>
                        <span className="text-xl font-extrabold text-[#7d2ae7] font-mono">${grossRevenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-[#fafafa] border border-[#e8ecef] p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-[#6f767e] uppercase tracking-wider block mb-1">ARPU (Per User)</span>
                        <span className="text-xl font-extrabold text-[#0d1216] font-mono">${arpu.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="border border-[#e8ecef] rounded-xl p-5 bg-[#fafafa]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0d1216]">Revenue Growth Trend</h3>
                          <p className="text-[11px] text-[#6f767e]">Gross estimated revenue over the last 10 days</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Activity className="w-3.5 h-3.5" />
                          <span>+24.5% This Week</span>
                        </div>
                      </div>

                      {/* Line Chart */}
                      <div className="relative">
                        <svg 
                          width="100%" 
                          height={svgHeight} 
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="overflow-visible select-none cursor-crosshair"
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7d2ae7" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#7d2ae7" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = padding + ratio * chartH;
                            return (
                              <line 
                                key={i}
                                x1={padding}
                                y1={y}
                                x2={svgWidth - padding}
                                y2={y}
                                stroke="#e8ecef"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                            );
                          })}

                          {/* Gradient Area Fill */}
                          <path d={areaD} fill="url(#chartGradient)" />

                          {/* Line Path */}
                          <path 
                            d={lineD} 
                            fill="none" 
                            stroke="#7d2ae7" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />

                          {/* Interactive Hover Point Highlights */}
                          {coordinates.map((pt, i) => (
                            <circle 
                              key={i}
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredIndex === i ? 5 : 3}
                              className="transition-all duration-100"
                              fill={hoveredIndex === i ? '#7d2ae7' : '#ffffff'}
                              stroke="#7d2ae7"
                              strokeWidth={hoveredIndex === i ? 2.5 : 1.5}
                            />
                          ))}

                          {/* Hover Crosshair Vertical Line */}
                          {hoveredIndex !== null && (
                            <line 
                              x1={hoverX}
                              y1={padding}
                              x2={hoverX}
                              y2={padding + chartH}
                              stroke="#7d2ae7"
                              strokeWidth="1.5"
                              strokeOpacity="0.4"
                            />
                          )}

                          {/* X-Axis Labels */}
                          {coordinates.map((pt, i) => {
                            // Only draw a few labels to prevent clutter
                            if (i % 2 === 0 || i === coordinates.length - 1) {
                              return (
                                <text 
                                  key={i}
                                  x={pt.x}
                                  y={svgHeight - 4}
                                  textAnchor="middle"
                                  className="text-[9px] font-bold fill-[#6f767e]/80 font-sans"
                                >
                                  {pt.label}
                                </text>
                              );
                            }
                            return null;
                          })}
                        </svg>

                        {/* Custom Rich Floating Tooltip */}
                        {hoveredIndex !== null && (
                          <div 
                            className="absolute pointer-events-none bg-white/95 border border-[#e8ecef] p-2.5 rounded-lg shadow-md text-left z-20 flex flex-col gap-0.5 backdrop-blur-sm transition-all duration-75"
                            style={{
                              left: `${(hoverX / svgWidth) * 100}%`,
                              transform: 'translateX(-50%)',
                              top: `${coordinates[hoveredIndex].y - 65}px`
                            }}
                          >
                            <span className="text-[9px] font-bold text-[#6f767e] uppercase tracking-wider block">
                              {coordinates[hoveredIndex].label}, 2026
                            </span>
                            <span className="text-xs font-mono font-extrabold text-[#7d2ae7]">
                              Revenue: ${coordinates[hoveredIndex].rev.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Distribution Breakdown */}
                    <div className="border border-[#e8ecef] rounded-xl p-5 bg-[#fafafa]">
                      <h3 className="text-sm font-extrabold text-[#0d1216] mb-3">Product Sales Distribution</h3>
                      
                      <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#e8ecef] mb-4">
                        <div 
                          className="bg-[#7d2ae7] transition-all" 
                          style={{ width: `${Math.max(5, proPercentage)}%` }} 
                          title="Pro Subscriptions"
                        />
                        <div 
                          className="bg-[#00c4cc] transition-all" 
                          style={{ width: `${Math.max(5, creditPercentage)}%` }} 
                          title="Credit Packs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#7d2ae7]" />
                          <div className="flex-grow">
                            <span className="text-[#0d1216] block">Pro Monthly & Lifetime</span>
                            <span className="text-[10px] text-[#6f767e]">{proCount} subscriptions ({proPercentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00c4cc]" />
                          <div className="flex-grow">
                            <span className="text-[#0d1216] block">Credits Packs</span>
                            <span className="text-[10px] text-[#6f767e]">{totalCreditPacksCount} estimated sold ({creditPercentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
