import React, { useState, useEffect, useMemo } from 'react';
import { View, User, FeelingLog } from './types';
import BottomNav from './components/BottomNav';
import Buddy from './screens/Buddy';
import Feelings from './screens/Feelings';
import CreateFeeling from './screens/CreateFeeling';
import { MOOD_QUOTES } from './constants';
import { Sparkles, MessageCircle, BarChart2, Plus } from 'lucide-react';

// --- Sub-components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
        if (step < 2) setStep(s => s + 1);
        else onComplete();
    }, 2200);
    return () => clearInterval(timer);
  }, [step, onComplete]);

  const screens = [
    { text: "Feeling Buddy", sub: "Your emotional companion", bg: "bg-teal-600" },
    { text: "Track Patterns", sub: "Understand your mood swings", bg: "bg-indigo-600" },
    { text: "Voice Agent", sub: "Talk like a real friend", bg: "bg-rose-500" }
  ];

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center text-white transition-all duration-1000 ${screens[step].bg} relative overflow-hidden`}>
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative mb-12 z-10">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative text-8xl animate-bounce filter drop-shadow-xl">🤖</div>
        </div>
        <h1 className="text-5xl font-black mb-4 text-center px-4 animate-fade-in tracking-tighter leading-tight">{screens[step].text}</h1>
        <p className="text-white/80 text-xl font-medium text-center animate-fade-in">{screens[step].sub}</p>
        
        <div className="absolute bottom-16 flex gap-3">
            {screens.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'bg-white w-8' : 'bg-white/30 w-2'}`} />
            ))}
        </div>
    </div>
  );
};

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && name && city) {
        setLoading(true);
        setTimeout(() => onLogin({ phone, name, city }), 800);
    }
  };

  return (
    <div className="h-full flex flex-col px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="mb-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-teal-100 flex items-center justify-center text-3xl mb-6 transform -rotate-6">✨</div>
                <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Welcome!</h2>
                <p className="text-slate-500 text-lg font-medium">Let's create your safe space.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="What should I call you?"
                        className="w-full bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-2 border-transparent focus:border-teal-500 focus:outline-none transition-all font-bold text-slate-800 placeholder-slate-300"
                        required 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Mobile Number"
                        className="w-full bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-2 border-transparent focus:border-teal-500 focus:outline-none transition-all font-bold text-slate-800 placeholder-slate-300"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">City</label>
                    <input 
                        type="text" 
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-2 border-transparent focus:border-teal-500 focus:outline-none transition-all font-bold text-slate-800 placeholder-slate-300"
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? "Setting up..." : "Start Journey"} {!loading && <Sparkles size={20} />}
                </button>
            </form>
        </div>
    </div>
  );
};

const HomeScreen = ({ user, lastFeeling, setView }: { user: User, lastFeeling?: FeelingLog, setView: (v: View) => void }) => {
    
    // Get a dynamic quote based on the last feeling
    const quote = useMemo(() => {
        if (!lastFeeling) return { text: "Start tracking to see magic happen!", emoji: "🌱" };
        
        const quotesList = MOOD_QUOTES[lastFeeling.type] || MOOD_QUOTES['default'];
        const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
        
        return { text: randomQuote, emoji: "✨" };
    }, [lastFeeling]);

    return (
        <div className="h-full bg-slate-50 flex flex-col pb-20 overflow-y-auto">
            {/* Header */}
            <div className="pt-12 px-6 pb-8 bg-white rounded-b-[40px] shadow-sm z-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <p className="text-gray-400 font-bold text-sm mb-1 uppercase tracking-wider">Good Day,</p>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">{user.name}</h1>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-tr from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30 transform rotate-3">
                        {user.name.charAt(0)}
                    </div>
                </div>

                {/* Dynamic Quote Card */}
                <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900 p-6 rounded-[24px] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group transition-all hover:shadow-2xl hover:shadow-slate-900/30">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                             <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold border border-white/10">
                                DAILY WISDOM
                            </span>
                            <span className="text-xl">{quote.emoji}</span>
                        </div>
                        <p className="font-medium text-lg leading-relaxed opacity-95">"{quote.text}"</p>
                        {lastFeeling && (
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-px bg-white/20 flex-1"></div>
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                                    For your {lastFeeling.type} mood
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 px-6 pt-8 space-y-6">
                
                {/* Last Mood Status */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="font-black text-gray-800 text-lg">Current Vibe</h3>
                        <button onClick={() => setView(View.FEELINGS)} className="text-teal-600 text-xs font-bold bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">History</button>
                    </div>

                    {lastFeeling ? (
                        <div className="bg-white p-1 rounded-[28px] shadow-sm border border-gray-100">
                             <div className="bg-slate-50 p-5 rounded-[24px] flex items-center gap-5 relative overflow-hidden group">
                                <div className="w-1 h-full absolute left-0 top-0 bg-gradient-to-b from-teal-400 to-teal-600"></div>
                                <div 
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-105"
                                    style={{ backgroundColor: `${lastFeeling.color}20`, color: lastFeeling.color }}
                                >
                                    <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: lastFeeling.color }}></div>
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-800 text-xl">{lastFeeling.type}</h4>
                                    <p className="text-xs text-gray-400 font-bold mt-1">
                                        {new Date(lastFeeling.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-3xl font-black text-slate-800">{lastFeeling.intensity}<span className="text-sm text-gray-300 font-normal">/5</span></span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Intensity</span>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setView(View.CREATE)}
                            className="w-full bg-white border-2 border-dashed border-gray-200 p-8 rounded-[28px] text-gray-400 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all flex flex-col items-center gap-3 group"
                        >
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold">Log your first mood</span>
                        </button>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setView(View.BUDDY)} 
                        className="bg-indigo-50 p-6 rounded-[28px] flex flex-col items-start gap-4 hover:bg-indigo-100 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 rounded-full -mr-5 -mt-5"></div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform relative z-10">
                            <MessageCircle size={24} fill="currentColor" className="opacity-20 absolute" />
                            <MessageCircle size={24} />
                        </div>
                        <div className="relative z-10">
                            <span className="font-black text-indigo-900 block text-lg">Buddy</span>
                            <span className="text-xs text-indigo-400 font-bold">Chat & Voice</span>
                        </div>
                     </button>

                     <button 
                        onClick={() => setView(View.FEELINGS)} 
                        className="bg-emerald-50 p-6 rounded-[28px] flex flex-col items-start gap-4 hover:bg-emerald-100 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full -mr-5 -mt-5"></div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform relative z-10">
                            <BarChart2 size={24} />
                        </div>
                        <div className="relative z-10">
                            <span className="font-black text-emerald-900 block text-lg">Insights</span>
                            <span className="text-xs text-emerald-400 font-bold">View Trends</span>
                        </div>
                     </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

const App = () => {
  const [view, setView] = useState<View>(View.SPLASH);
  const [user, setUser] = useState<User | null>(null);
  const [feelings, setFeelings] = useState<FeelingLog[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('fb_user');
    const savedFeelings = localStorage.getItem('fb_feelings');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedFeelings) setFeelings(JSON.parse(savedFeelings));
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('fb_user', JSON.stringify(newUser));
    setView(View.HOME);
  };

  const handleSaveFeeling = (log: FeelingLog) => {
    const updated = [...feelings, log];
    setFeelings(updated);
    localStorage.setItem('fb_feelings', JSON.stringify(updated));
    setView(View.HOME);
  };

  const renderContent = () => {
    switch (view) {
        case View.SPLASH:
            return <SplashScreen onComplete={() => setView(user ? View.HOME : View.AUTH)} />;
        case View.AUTH:
            return <AuthScreen onLogin={handleLogin} />;
        case View.HOME:
            return user ? <HomeScreen user={user} lastFeeling={feelings[feelings.length - 1]} setView={setView} /> : null;
        case View.CREATE:
            return <CreateFeeling onSave={handleSaveFeeling} onCancel={() => setView(View.HOME)} />;
        case View.FEELINGS:
            return <Feelings logs={feelings} />;
        case View.BUDDY:
            return user ? <Buddy user={user} recentFeelings={feelings} /> : null;
        default:
            return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-2xl overflow-hidden relative font-sans text-gray-900">
        {renderContent()}
        
        {(view === View.HOME || view === View.FEELINGS || view === View.CREATE || view === View.BUDDY) && (
            <BottomNav currentView={view} setView={setView} />
        )}
    </div>
  );
};

export default App;