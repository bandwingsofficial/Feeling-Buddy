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
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
          <p className="text-sm font-bold text-gray-800 mb-1">{data.date}, {data.time}</p>
          <p className="text-lg font-black" style={{ color: data.color }}>{data.type}</p>
          <p className="text-xs text-gray-500">Intensity: {data.intensity}/5</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-b-[40px] z-0 shadow-lg"></div>

      <div className="relative z-10 px-6 pt-8 pb-4">
        <h2 className="text-3xl font-black text-white mb-1">Mood Analytics</h2>
        <p className="text-indigo-100 text-sm">Understanding your emotional flow</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 z-10 space-y-6">
        
        {/* Main Stats Card */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stability Score</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">{moodStability}%</span>
                </div>
                <p className="text-xs text-green-600 font-medium mt-1">
                    {parseInt(moodStability) > 80 ? "✨ Very Balanced" : parseInt(moodStability) > 50 ? "🌊 fluctuating" : "🎢 High Swings"}
                </p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dominant Mood</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{dominantMood}</p>
            </div>
        </div>

        {/* Chart Area */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Mood Flow</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">Last 10 Logs</span>
            </div>
            
            <div className="h-64 w-full">
                {logs.length < 2 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                        <span className="text-4xl mb-2">📉</span>
                        <p>Not enough data yet.<br/>Log a few more feelings!</p>
                     </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 6]} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="intensity" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorIntensity)" 
                        />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* Recent History List */}
        <div>
            <h3 className="font-bold text-gray-800 text-lg mb-4 ml-1">Recent Swings</h3>
            <div className="space-y-3">
                {[...logs].reverse().slice(0, 5).map((log, idx) => (
                    <div key={log.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="w-2 h-12 rounded-full" style={{ backgroundColor: log.color }}></div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800 text-lg">{log.type}</span>
                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">
                                    {log.intensity}/5 Intensity
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(log.timestamp).toLocaleString([], { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                            </p>
                            {log.note && (
                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg italic">"{log.note}"</p>
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