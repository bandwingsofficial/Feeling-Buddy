import React, { useState } from 'react';
import { FEELING_TYPES } from '../constants';
import { FeelingLog } from '../types';
import { ArrowLeft, Check } from 'lucide-react';

interface CreateFeelingProps {
  onSave: (log: FeelingLog) => void;
  onCancel: () => void;
}

const CreateFeeling: React.FC<CreateFeelingProps> = ({ onSave, onCancel }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!selectedType) return;
    
    const selectedFeeling = FEELING_TYPES.find(f => f.label === selectedType);
    
    const newLog: FeelingLog = {
      id: Date.now().toString(),
      type: selectedType,
      intensity,
      note,
      timestamp: Date.now(),
      color: selectedFeeling?.color || '#ccc'
    };
    onSave(newLog);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      <div className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-black text-gray-800">Check In</h2>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        
        {/* Grid of Feelings */}
        <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">How are you feeling?</label>
            <div className="grid grid-cols-3 gap-3">
            {FEELING_TYPES.map((feeling) => {
                const isSelected = selectedType === feeling.label;
                return (
                <button
                    key={feeling.label}
                    onClick={() => setSelectedType(feeling.label)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border ${
                    isSelected 
                        ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10 scale-105' 
                        : 'border-transparent bg-white shadow-sm hover:shadow-md hover:bg-gray-50'
                    }`}
                >
                    <span className="text-3xl mb-2 filter drop-shadow-sm">{feeling.emoji}</span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>{feeling.label}</span>
                </button>
                );
            })}
            </div>
        </div>

        {/* Intensity Slider */}
        {selectedType && (
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 animate-fade-in-up border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Intensity</label>
                    <span className="text-2xl font-black text-teal-600">{intensity}/5</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-teal-600 hover:accent-teal-500 transition-all"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-3 font-medium">
                    <span>Just a bit</span>
                    <span>Overwhelming</span>
                </div>
            </div>
        )}

        {/* Note Input */}
        {selectedType && (
             <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 animate-fade-in-up border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Add a Note (Optional)</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's on your mind?..."
                    className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none resize-none h-32 transition-all"
                />
            </div>
        )}

        {/* Spacer */}
        <div className="h-20"></div> 
      </div>

      <div className="fixed bottom-24 left-6 right-6 z-20">
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                selectedType 
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
              <Check size={20} />
              Save Entry
          </button>
      </div>
    </div>
  );
};

export default CreateFeeling;