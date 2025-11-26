import React, { useState, useEffect, useMemo } from 'react';
import { View, User, FeelingLog } from './types';
import BottomNav from './components/BottomNav';
import Buddy from './screens/Buddy';
import Feelings from './screens/Feelings';
import CreateFeeling from './screens/CreateFeeling';
import { MOOD_QUOTES } from './constants';
import { Sparkles, MessageCircle, BarChart2 } from 'lucide-react';

// --- Sub-components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
        if (step < 2) setStep(s => s + 1);
        else onComplete();
    }, 2500);
    return () => clearInterval(timer);
  }, [step, onComplete]);

  const screens = [
    { text: "Feeling Buddy", sub: "Your emotional companion", bg: "bg-teal-600" },
    { text: "Track Patterns", sub: "Understand your mood swings", bg: "bg-indigo-600" },
    { text: "Voice Agent", sub: "Talk like a real friend", bg: "bg-rose-500" }
  ];

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center text-white transition-all duration-1000 ${screens[step].bg}`}>
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative text-7xl animate-bounce">🤖</div>
        </div>
        <h1 className="text-4xl font-black mb-2 text-center px-4 animate-fade-in tracking-tight">{screens[step].text}</h1>
        <p className="text-white/80 text-lg font-medium text-center animate-fade-in">{screens[step].sub}</p>
        
        <div className="absolute bottom-12 flex gap-3">
            {screens.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === step ? 'bg-white scale-125' : 'bg-white/30'}`} />
            ))}
        </div>
    </div>
  );
};

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && name && city) {
        onLogin({ phone, name, city });
    }
  };

  return (
    <div className="h-full flex flex-col px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-50"></div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="mb-12">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl mb-6">✨</div>
                <h2 className="text-4xl font-black text-gray-800 mb-2">Hello!</h2>
                <p className="text-gray-500 text-lg">Let's get to know each other.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="What should I call you?"
                        className="w-full bg-white p-5 rounded-2xl shadow-sm border border-transparent focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-gray-800"
                        required 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone</label>
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Mobile Number"
                        className="w-full bg-white p-5 rounded-2xl shadow-sm border border-transparent focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-gray-800"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">City</label>
                    <input 
                        type="text" 
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full bg-white p-5 rounded-2xl shadow-sm border border-transparent focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-gray-800"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2">
                    Start Journey <Sparkles size={20} />
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
            <div className="pt-12 px-6 pb-6 bg-white rounded-b-[40px] shadow-sm z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-400 font-medium mb-1">Good Day,</p>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">{user.name}</h1>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-tr from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30">
                        {user.name.charAt(0)}
                    </div>
                </div>

                {/* Dynamic Quote Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl text-white shadow-xl shadow-gray-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold mb-3">
                            Daily Wisdom {quote.emoji}
                        </span>
                        <p className="font-medium text-xl leading-relaxed opacity-90">"{quote.text}"</p>
                        {lastFeeling && (
                            <p className="text-xs text-white/50 mt-4 font-medium uppercase tracking-wider">
                                Based on your mood: {lastFeeling.type}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 px-6 pt-8 space-y-6">
                
                {/* Last Mood Status */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">Current Vibe</h3>
                        <button onClick={() => setView(View.FEELINGS)} className="text-teal-600 text-sm font-bold">History</button>
                    </div>

                    {lastFeeling ? (
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 relative overflow-hidden">
                             <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-teal-400 to-teal-600"></div>
                             <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                                style={{ backgroundColor: `${lastFeeling.color}25`, color: lastFeeling.color }}
                             >
                                 {/* Just a generic icon or circle if emoji isn't handy here, but we can pass emoji if we want. Using color dot for now */}
                                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: lastFeeling.color }}></div>
                             </div>
                             <div>
                                 <h4 className="font-black text-gray-800 text-lg">{lastFeeling.type}</h4>
                                 <p className="text-xs text-gray-400 font-medium">{new Date(lastFeeling.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                             <div className="ml-auto flex flex-col items-end">
                                 <span className="text-2xl font-black text-gray-800">{lastFeeling.intensity}<span className="text-sm text-gray-400 font-normal">/5</span></span>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Intensity</span>
                             </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setView(View.CREATE)}
                            className="w-full bg-white border-2 border-dashed border-gray-200 p-6 rounded-3xl text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl opacity-50">😶</span>
                            <span className="font-bold">Log your first mood</span>
                        </button>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setView(View.BUDDY)} 
                        className="bg-indigo-50 p-6 rounded-3xl flex flex-col items-start gap-3 hover:bg-indigo-100 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <span className="font-black text-indigo-900 block text-lg">Buddy</span>
                            <span className="text-xs text-indigo-400 font-medium">Voice & Chat</span>
                        </div>
                     </button>

                     <button 
                        onClick={() => setView(View.FEELINGS)} 
                        className="bg-emerald-50 p-6 rounded-3xl flex flex-col items-start gap-3 hover:bg-emerald-100 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <span className="font-black text-emerald-900 block text-lg">Stats</span>
                            <span className="text-xs text-emerald-400 font-medium">View Analysis</span>
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