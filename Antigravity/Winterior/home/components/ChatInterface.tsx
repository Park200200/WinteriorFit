
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Plus, Smile, MoreVertical, ArrowLeft, Search, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '안녕하세요! WinteriorFit 상담원 김미소입니다. 😊', sender: 'other', timestamp: '오전 10:30' },
    { id: '2', text: '무엇을 도와드릴까요?', sender: 'other', timestamp: '오전 10:30' },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Mock Auto Reply
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: '현재 상담량이 많아 연결이 지연되고 있습니다. 잠시만 기다려주세요.',
            sender: 'other',
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full h-full md:w-[380px] md:h-[700px] bg-[#BACEE0] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative font-sans"
      >
        {/* Header (Kakao Style) */}
        <div className="bg-[#BACEE0]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onClose} className="text-gray-700 hover:bg-black/10 rounded-full p-1 transition-colors">
                    <ArrowLeft size={20} />
                </button>
            </div>
            <div className="flex flex-col items-center">
                 <span className="font-bold text-gray-800 text-sm">김미소 상담원</span>
                 <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 온라인
                 </span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
                <Search size={20} />
                <Menu size={20} />
            </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" ref={scrollRef}>
             {/* Date Divider */}
             <div className="flex justify-center my-4">
                 <span className="bg-black/10 text-white text-[10px] px-3 py-1 rounded-full">
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                 </span>
             </div>

             {messages.map((msg) => {
                 const isMe = msg.sender === 'me';
                 return (
                     <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                         {/* Profile Pic (Other) */}
                         {!isMe && (
                             <div className="flex flex-col gap-1 items-center">
                                 <div className="w-9 h-9 rounded-xl bg-white overflow-hidden border border-black/5 shadow-sm">
                                     <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                                 </div>
                             </div>
                         )}

                         <div className={`flex items-end gap-1.5 max-w-[70%]`}>
                             {isMe && <span className="text-[9px] text-gray-500 mb-0.5 whitespace-nowrap">{msg.timestamp}</span>}
                             
                             <div className={`px-3 py-2 text-sm shadow-sm relative leading-relaxed
                                ${isMe 
                                    ? 'bg-[#FEE500] text-black rounded-l-xl rounded-br-none rounded-tr-xl' 
                                    : 'bg-white text-black rounded-r-xl rounded-bl-none rounded-tl-xl'}
                             `}>
                                 {!isMe && <div className="text-[10px] text-gray-500 mb-1 font-bold">김미소 상담원</div>}
                                 {msg.text}
                             </div>

                             {!isMe && <span className="text-[9px] text-gray-500 mb-0.5 whitespace-nowrap">{msg.timestamp}</span>}
                         </div>
                     </div>
                 )
             })}
        </div>

        {/* Input Area */}
        <div className="bg-white px-3 py-3 shrink-0">
             <div className="flex items-end gap-2">
                 <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                     <Plus size={24} />
                 </button>
                 <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-3 py-2 min-h-[40px] border border-transparent focus-within:border-gray-300 transition-colors">
                     <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요"
                        rows={1}
                        className="w-full bg-transparent outline-none text-sm resize-none h-full overflow-hidden"
                        style={{ minHeight: '20px', maxHeight: '80px' }}
                     />
                     <button className="text-gray-400 hover:text-gray-600 ml-2">
                         <Smile size={20} />
                     </button>
                 </div>
                 <button 
                    onClick={handleSend}
                    className={`p-2.5 rounded-xl transition-all ${inputText.trim() ? 'bg-[#FEE500] text-black shadow-sm hover:bg-[#FDD835]' : 'bg-gray-100 text-gray-300'}`}
                 >
                     <Send size={18} fill={inputText.trim() ? "currentColor" : "none"} />
                 </button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
