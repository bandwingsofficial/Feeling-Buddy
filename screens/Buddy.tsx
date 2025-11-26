import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Keyboard, Volume2, Loader2, StopCircle } from 'lucide-react';
import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { User, ChatMessage, BuddyMode, FeelingLog } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';

interface BuddyProps {
  user: User;
  recentFeelings: FeelingLog[];
}

const Buddy: React.FC<BuddyProps> = ({ user, recentFeelings }) => {
  const [mode, setMode] = useState<BuddyMode>(BuddyMode.TEXT);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const genAiRef = useRef<GoogleGenAI | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Prepare Context String
  const getContextString = () => {
     if (recentFeelings.length === 0) return "User has no recorded feelings yet.";
     
     // Create a string describing mood changes
     const last3 = recentFeelings.slice(-3);
     const swingDesc = last3.map(f => `${f.type} (Intensity ${f.intensity}/5) at ${new Date(f.timestamp).toLocaleTimeString()}`).join(' -> ');
     
     return `
        User Profile: Name: ${user.name}, City: ${user.city}.
        Recent Mood Pattern (Oldest to Newest): ${swingDesc}.
        Analyze if there is a drastic swing (e.g. Happy to Sad) or stability.
     `;
  };

  useEffect(() => {
    genAiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Initial greeting based on mood
    let greeting = `Hey ${user.name}! Buddy here. What's up?`;
    if (recentFeelings.length > 0) {
        const last = recentFeelings[recentFeelings.length - 1];
        if (last.type === 'Sad' || last.type === 'Lonely' || last.type === 'Anxious') {
             greeting = `Hey ${user.name}, I saw you're feeling a bit ${last.type.toLowerCase()} today. I'm here if you want to vent, machi.`;
        } else if (last.type === 'Happy' || last.type === 'Excited') {
             greeting = `Hey ${user.name}! Looks like you're in a great mood! Tell me what happened!`;
        }
    }

    setMessages([{
      id: 'init',
      role: 'model',
      text: greeting,
      timestamp: Date.now()
    }]);

    chatSessionRef.current = genAiRef.current.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION} \n\n ${getContextString()}`,
      },
    });

    return () => {
        disconnectVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponse = '';
      const responseId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => prev.map(m => m.id === responseId ? { ...m, text: fullResponse } : m));
        }
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "Ouch, my brain froze for a second. Can you say that again?",
          timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const connectVoice = async () => {
    if (!genAiRef.current) return;
    setIsLoading(true);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = genAiRef.current;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            },
            systemInstruction: `${SYSTEM_INSTRUCTION}. You are talking to ${user.name}. ${getContextString()}`,
        },
        callbacks: {
            onopen: () => {
                setIsConnected(true);
                setIsLoading(false);
                startAudioInput();
            },
            onmessage: async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                    const ctx = audioContextRef.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(
                        base64ToUint8Array(base64Audio),
                        ctx,
                        24000
                    );
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                }
            },
            onclose: () => disconnectVoice(),
            onerror: (err) => {
                console.error(err);
                disconnectVoice();
            }
        }
      });

    } catch (err) {
      console.error("Failed to connect voice", err);
      setIsLoading(false);
    }
  };

  const startAudioInput = () => {
    if (!inputContextRef.current || !streamRef.current) return;
    
    const ctx = inputContextRef.current;
    sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
    processorRef.current = ctx.createScriptProcessor(4096, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
    };

    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(ctx.destination);
  };

  const disconnectVoice = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (processorRef.current && sourceRef.current) {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
        processorRef.current = null;
        sourceRef.current = null;
    }
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsConnected(false);
    setIsLoading(false);
    sessionPromiseRef.current = null;
  }, []);

  const toggleMode = () => {
    if (mode === BuddyMode.TEXT) {
      setMode(BuddyMode.VOICE);
      connectVoice();
    } else {
      setMode(BuddyMode.TEXT);
      disconnectVoice();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm flex items-center justify-between z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white shadow-lg shadow-indigo-200">
                🤖
            </div>
            <div>
                <h2 className="font-bold text-gray-800">Buddy</h2>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-teal-500'}`}></span>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{isConnected ? 'Voice Active' : 'Online'}</p>
                </div>
            </div>
        </div>
        <button 
            onClick={toggleMode}
            className={`p-3 rounded-full transition-all shadow-sm active:scale-95 ${
                mode === BuddyMode.VOICE 
                ? 'bg-red-50 text-red-500 border border-red-100' 
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}
        >
            {mode === BuddyMode.TEXT ? <Mic size={20} /> : <Keyboard size={20} />}
        </button>
      </div>

      {/* TEXT MODE */}
      {mode === BuddyMode.TEXT && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-gray-800 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-sm'
                        }`}>
                            {msg.text}
                            <div className={`text-[10px] mt-2 opacity-50 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 border border-gray-100">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Say something to Buddy..."
                        className="flex-1 bg-transparent border-none px-4 py-2 focus:ring-0 outline-none text-gray-700 placeholder-gray-400"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isLoading}
                        className="bg-gray-900 text-white p-3 rounded-full disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-md active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
          </>
      )}

      {/* VOICE MODE */}
      {mode === BuddyMode.VOICE && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 pointer-events-none"></div>
              
              <div className="relative z-10 mb-16">
                 {/* Visualizer Circles */}
                 <div className={`absolute inset-0 bg-indigo-500 rounded-full opacity-10 blur-2xl transition-all duration-1000 ${isConnected ? 'scale-150 animate-pulse' : 'scale-100'}`}></div>
                 <div className={`absolute inset-0 bg-indigo-400 rounded-full opacity-20 blur-xl transition-all duration-700 delay-100 ${isConnected ? 'scale-[1.3] animate-pulse' : 'scale-100'}`}></div>
                 
                 <div 
                    onClick={isConnected ? disconnectVoice : connectVoice}
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer ${
                        isConnected 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40 scale-105' 
                        : 'bg-white text-gray-400 shadow-gray-200 hover:scale-105'
                    }`}
                 >
                    {isLoading ? (
                        <Loader2 size={56} className="text-white animate-spin" />
                    ) : isConnected ? (
                         <div className="flex items-center gap-1.5 h-12">
                            <span className="w-2 bg-white rounded-full animate-[bounce_1s_infinite] h-8"></span>
                            <span className="w-2 bg-white rounded-full animate-[bounce_1.2s_infinite] h-12"></span>
                            <span className="w-2 bg-white rounded-full animate-[bounce_0.8s_infinite] h-6"></span>
                            <span className="w-2 bg-white rounded-full animate-[bounce_1.1s_infinite] h-10"></span>
                         </div>
                    ) : (
                        <Volume2 size={56} strokeWidth={1.5} />
                    )}
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight">
                      {isLoading ? 'Connecting...' : isConnected ? 'Listening...' : 'Tap to Talk'}
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto font-medium text-lg leading-relaxed">
                      {isConnected 
                        ? "I'm listening, machi. Speak your heart out." 
                        : "Start a voice call with your buddy."}
                  </p>
                  {isConnected && (
                      <button 
                        onClick={disconnectVoice}
                        className="mt-8 px-6 py-2 bg-red-100 text-red-600 rounded-full font-bold text-sm hover:bg-red-200 transition-colors flex items-center gap-2 mx-auto"
                      >
                          <StopCircle size={16} /> End Call
                      </button>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Buddy;