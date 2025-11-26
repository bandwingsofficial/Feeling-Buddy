import React, { useMemo } from 'react';
import { FeelingLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface FeelingsProps {
  logs: FeelingLog[];
}

const Feelings: React.FC<FeelingsProps> = ({ logs }) => {
  // Aggregate data for Chart
  const chartData = useMemo(() => {
    return logs.slice(-10).map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(log.timestamp).toLocaleDateString([], { weekday: 'short' }),
      intensity: log.intensity,
      type: log.type,
      color: log.color,
      fullDate: log.timestamp
    }));
  }, [logs]);

  // Calculate "Mood Swing" score (Variance of intensity)
  const moodStability = useMemo(() => {
    if (logs.length < 2) return "100";
    const intensities = logs.map(l => l.intensity);
    const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const variance = intensities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intensities.length;
    // Lower variance = Higher stability. Map 0-4 variance to 100-0 score roughly.
    return Math.max(0, Math.min(100, 100 - (variance * 20))).toFixed(0);
  }, [logs]);

  // Most frequent mood
  const dominantMood = useMemo(() => {
    if (logs.length === 0) return 'Neutral';
    const counts: Record<string, number> = {};
    logs.forEach(l => counts[l.type] = (counts[l.type] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-1">{data.date}, {data.time}</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{backgroundColor: data.color}}></span>
            <p className="text-lg font-black text-gray-800">{data.type}</p>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">Intensity: {data.intensity}/5</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-b-[40px] z-0 shadow-xl"></div>
      
      {/* Header */}
      <div className="relative z-10 px-6 pt-10 pb-6">
        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">Mood Analytics</h2>
        <p className="text-indigo-100 font-medium">Understanding your emotional flow</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 z-10 space-y-6">
        
        {/* Main Stats Card */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-indigo-900/10 border border-white/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stability</p>
                <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-black text-gray-800">{moodStability}</span>
                    <span className="text-sm font-bold text-gray-400">%</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${moodStability}%` }}></div>
                </div>
            </div>
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-indigo-900/10 border border-white/50 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dominant</p>
                <div>
                     <p className="text-2xl font-black text-indigo-600 truncate">{dominantMood}</p>
                     <p className="text-xs text-gray-500 font-medium">Most felt lately</p>
                </div>
            </div>
        </div>

        {/* Chart Area */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Mood Flow</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Recent</span>
            </div>
            
            <div className="h-56 w-full">
                {logs.length < 2 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <span className="text-4xl mb-2 grayscale opacity-50">📉</span>
                        <p className="font-medium text-sm">Not enough data yet.<br/>Log a few more feelings!</p>
                     </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis domain={[0, 6]} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#818cf8', strokeWidth: 2, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="intensity" 
                            stroke="#6366f1" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorIntensity)" 
                            animationDuration={1500}
                        />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* Recent History List */}
        <div>
            <h3 className="font-bold text-gray-800 text-lg mb-4 ml-1">Timeline</h3>
            <div className="space-y-3 pb-8">
                {[...logs].reverse().slice(0, 10).map((log, idx) => (
                    <div key={log.id} className="group flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 transition-transform active:scale-[0.98]">
                        <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                            style={{ backgroundColor: `${log.color}20` }}
                        >
                            <span style={{ filter: 'grayscale(0%)' }}>
                                {/* Map types to emojis from constants if needed, or just use color block */}
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: log.color }}></div>
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800">{log.type}</span>
                                <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500 uppercase tracking-wide">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                    <div className="h-full rounded-full" style={{ width: `${(log.intensity/5)*100}%`, backgroundColor: log.color }}></div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{log.intensity}/5</span>
                            </div>
                            {log.note && (
                                <p className="text-xs text-gray-500 mt-2 bg-slate-50 p-2 rounded-lg italic border border-slate-100">"{log.note}"</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Feelings;