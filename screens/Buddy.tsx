import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Keyboard, Volume2, Loader2 } from 'lucide-react';
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
    
    // Initial greeting
    const greeting = recentFeelings.length > 0 && recentFeelings[recentFeelings.length-1].intensity < 3
        ? `Hey ${user.name}, I noticed things have been a bit heavy lately. I'm here for you machi.`
        : `Hey ${user.name}! It's your buddy here. How's it going today?`;

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
  }, [messages]);

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
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm flex items-center justify-between z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xl text-white shadow-lg shadow-indigo-200">
                🤖
            </div>
            <div>
                <h2 className="font-bold text-gray-800">Buddy</h2>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <p className="text-xs text-gray-500 font-medium">{isConnected ? 'Listening' : 'Online'}</p>
                </div>
            </div>
        </div>
        <button 
            onClick={toggleMode}
            className={`p-3 rounded-full transition-all shadow-sm ${mode === BuddyMode.VOICE ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
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
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-gray-900 text-white rounded-tr-none' 
                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 border border-gray-100">
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
                        className="bg-gray-900 text-white p-3 rounded-full disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-lg"
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
              {/* Background Ambient Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none"></div>
              
              <div className="relative z-10 mb-12">
                 <div className={`absolute inset-0 bg-indigo-500 rounded-full opacity-20 blur-xl transition-all duration-1000 ${isConnected ? 'scale-150 animate-pulse' : 'scale-100'}`}></div>
                 
                 <div className="relative w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-transform duration-300 hover:scale-105">
                    {isLoading ? (
                        <Loader2 size={48} className="text-white animate-spin" />
                    ) : (
                        <Volume2 size={48} className={`text-white ${isConnected ? 'animate-bounce' : ''}`} />
                    )}
                 </div>
              </div>

              <div className="space-y-3 relative z-10">
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight">
                      {isLoading ? 'Connecting...' : isConnected ? 'I\'m Listening' : 'Paused'}
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto font-medium">
                      {isConnected 
                        ? "Talk naturally, I'm here for you machi." 
                        : "Tap the mic icon when you're ready."}
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Buddy;