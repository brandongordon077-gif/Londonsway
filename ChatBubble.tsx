
import React from 'react';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  onSaveJourney?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onSaveJourney }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[90%] md:max-w-[80%] rounded-3xl p-6 shadow-xl border-2 transition-all ${
        isAssistant 
          ? 'bg-white text-slate-800 border-slate-100 rounded-tl-none' 
          : 'bg-[#0019a8] text-white border-blue-800 rounded-tr-none'
      }`}>
        {isAssistant && (
          <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-[#dc241f] rounded-2xl flex items-center justify-center mr-3 shadow-lg -rotate-6">
                <i className="fa-solid fa-train-subway text-sm text-white"></i>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#0019a8]">LondonWay AI</span>
                <p className="text-[9px] font-bold text-slate-400 leading-none">Smart Transit Hub</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {message.crowdingLevel && (
                <div className={`text-[9px] font-black px-2 py-1 rounded-lg border shadow-sm flex items-center gap-1 ${
                  message.crowdingLevel === 'Low' ? 'bg-green-50 text-green-700 border-green-200' :
                  message.crowdingLevel === 'Moderate' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <i className="fa-solid fa-users text-[10px]"></i> {message.crowdingLevel}
                </div>
              )}
              {message.accessibilityLevel && (
                <div className={`text-[9px] font-black px-2 py-1 rounded-lg border shadow-sm flex items-center gap-1 ${
                  message.accessibilityLevel === 'Step-free' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  message.accessibilityLevel === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <i className="fa-solid fa-wheelchair text-[10px]"></i> {message.accessibilityLevel}
                </div>
              )}
              {message.costEstimate && (
                <div className="text-[9px] font-black px-2 py-1 rounded-lg border border-green-200 bg-green-50 text-green-700 shadow-sm flex items-center gap-1">
                  <i className="fa-solid fa-wallet text-[10px]"></i> {message.costEstimate}
                </div>
              )}
            </div>
          </div>
        )}

        {isAssistant && message.disruptionAlert && (
          <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl text-red-900 text-[13px] font-bold flex items-start gap-3 shadow-inner">
            <i className="fa-solid fa-triangle-exclamation mt-0.5 text-red-600"></i>
            <span>{message.disruptionAlert}</span>
          </div>
        )}
        
        <div className={`whitespace-pre-wrap text-[16px] leading-relaxed font-semibold ${isAssistant ? 'text-slate-700' : 'text-blue-50'}`}>
          {message.content.replace(/ALERTE:.*|Crowding:.*|Cost:.*|Access:.*/gi, '').trim()}
        </div>

        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
               TfL & Grounding Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] bg-slate-50 border border-slate-200 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-[#0019a8] hover:text-white transition-all duration-300"
                >
                  <i className="fa-solid fa-link text-[8px]"></i>
                  <span className="truncate max-w-[100px] font-bold uppercase">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50">
          <div className={`text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${isAssistant ? 'text-slate-300' : 'text-blue-300'}`}>
            <i className="fa-regular fa-clock text-[9px]"></i>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {isAssistant && onSaveJourney && (
            <button 
              onClick={onSaveJourney}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0019a8] hover:text-blue-800 transition-colors group"
            >
              <i className="fa-solid fa-star text-[10px] group-hover:scale-125 transition-transform"></i> Save Route
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
