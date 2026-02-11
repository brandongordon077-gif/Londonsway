
import React, { useState, useEffect, useRef } from 'react';
import { TravelAssistantService } from './services/geminiService';
import { Message, FavoriteJourney, GroundingSource } from './types';
import { ChatBubble } from './components/ChatBubble';

const LINE_COLORS: Record<string, string> = {
  'Victoria': 'bg-[#0098d4]',
  'Central': 'bg-[#e32017]',
  'Jubilee': 'bg-[#a0a5a9]',
  'Northern': 'bg-[#000000]',
  'Piccadilly': 'bg-[#003688]',
  'District': 'bg-[#00782a]',
  'Elizabeth': 'bg-[#6950a1]',
  'Overground': 'bg-[#ef7b10]',
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteJourney[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [networkAlert, setNetworkAlert] = useState('Checking London transport status...');
  const [assistantService] = useState(() => new TravelAssistantService());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('londonway_favorites_v2');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const text = await assistantService.getInitialGreeting();
      setMessages([{
        role: 'assistant',
        content: text,
        id: 'init',
        timestamp: new Date(),
      }]);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    e?.preventDefault();
    const messageText = customMsg || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: messageText,
      id: `u-${Date.now()}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantId = `a-${Date.now()}`;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        id: assistantId,
        timestamp: new Date()
      }]);

      await assistantService.sendMessageStream(messageText, (fullText, sources, metadata) => {
        if (metadata?.alert) setNetworkAlert(metadata.alert);
        
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { 
            ...m, 
            content: fullText, 
            sources: sources || m.sources,
            crowdingLevel: metadata?.crowding || m.crowdingLevel,
            disruptionAlert: metadata?.alert || m.disruptionAlert,
            costEstimate: metadata?.cost || m.costEstimate,
            accessibilityLevel: metadata?.access || m.accessibilityLevel
          } : m
        ));
      });
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Signal failure. Please check your connection and try again.",
        id: `err-${Date.now()}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToFavorites = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const label = prompt("Label this journey:");
    if (!label) return;
    const newFav = { id: Date.now().toString(), from: '', to: '', label: label };
    const updated = [...favorites, newFav];
    setFavorites(updated);
    localStorage.setItem('londonway_favorites_v2', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] font-sans text-slate-900 overflow-hidden">
      <header className="bg-[#0019a8] text-white shadow-2xl z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 border-2 border-white shadow-lg">
                <div className="w-full h-full border-[3px] border-[#0019a8] rounded-full relative flex items-center justify-center">
                  <div className="absolute w-[140%] h-[15%] bg-[#0019a8] rounded-full"></div>
                </div>
             </div>
             <div>
               <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">LondonWay</h1>
               <p className="text-[10px] font-bold tracking-[0.3em] opacity-80 mt-1">EXPERT JOURNEY PLANNER</p>
             </div>
          </div>
          <button onClick={() => setShowFavorites(!showFavorites)} className="bg-blue-800 p-2 rounded-xl border border-blue-400">
            <i className="fa-solid fa-star text-white"></i>
          </button>
        </div>
        <div className="flex h-1.5 w-full">
           {Object.values(LINE_COLORS).map((color, i) => <div key={i} className={`flex-1 ${color}`}></div>)}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`absolute inset-y-0 left-0 w-80 bg-white shadow-2xl z-40 border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${showFavorites ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black uppercase tracking-widest text-[#0019a8] text-sm italic">Favorites</h2>
              <button onClick={() => setShowFavorites(false)} className="text-slate-400"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {favorites.map(fav => (
                <div key={fav.id} onClick={() => handleSend(undefined, `Plan route: ${fav.label}`)} className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl hover:bg-blue-50 cursor-pointer shadow-sm">
                  <p className="text-xs font-black text-[#0019a8] uppercase italic truncate">{fav.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] relative no-scrollbar">
          <div className="max-w-4xl mx-auto px-4 py-8 pb-44">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onSaveJourney={msg.role === 'assistant' ? () => saveToFavorites(msg.id) : undefined} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start mb-8 animate-pulse">
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>
      </div>

      <footer className="bg-white/95 backdrop-blur-md border-t-2 border-slate-200 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-2 mb-4 overflow-hidden">
             <span className="text-[9px] font-black uppercase tracking-widest text-red-500 pr-3 border-r border-slate-700">LIVE</span>
             <div className="flex-1 whitespace-nowrap overflow-hidden relative h-4">
               <div className="absolute text-[11px] font-bold text-slate-300 animate-[marquee_20s_linear_infinite]">
                  {networkAlert} • Northern Line split at Euston • Bank/Monument interchange is a 10 min walk • Check peak fares...
               </div>
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            <button onClick={() => handleSend(undefined, "Show me step-free routes to King's Cross")} className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-wheelchair"></i> Step-free
            </button>
            <button onClick={() => handleSend(undefined, "How much is a fare from Zone 1 to Zone 3?")} className="shrink-0 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-pound-sign"></i> Fare Check
            </button>
            <button onClick={() => handleSend(undefined, "Explain Bank station interchange")} className="shrink-0 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-info"></i> Bank Tips
            </button>
          </div>

          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Paddington to Bank (Step-free)"
              className="flex-1 bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-[#0019a8] transition-all"
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="w-14 h-14 bg-[#dc241f] text-white rounded-2xl shadow-lg active:scale-90">
              <i className="fa-solid fa-paper-plane text-xl"></i>
            </button>
          </form>
        </div>
      </footer>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
