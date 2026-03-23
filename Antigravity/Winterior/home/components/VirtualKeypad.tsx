
import React from 'react';
import { Delete, Search, Globe, Space } from 'lucide-react';
import { motion } from 'framer-motion';

interface VirtualKeypadProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onSearch: () => void;
  onClose: () => void;
}

const VirtualKeypad: React.FC<VirtualKeypadProps> = ({ onInput, onDelete, onSearch, onClose }) => {
  
  // Layout definitions based on the provided image (Cheonjiin-like style)
  const rows = [
    [
      { label: 'ㅣ', sub: '1', value: '1' },
      { label: '·', sub: '2', value: '2' },
      { label: 'ㅡ', sub: '3', value: '3' },
      { label: 'BACK', type: 'backspace' }
    ],
    [
      { label: 'ㄱㅋ', sub: '4', value: '4' },
      { label: 'ㄴㄹ', sub: '5', value: '5' },
      { label: 'ㄷㅌ', sub: '6', value: '6' },
      { label: 'SEARCH', type: 'search' }
    ],
    [
      { label: 'ㅂㅍ', sub: '7', value: '7' },
      { label: 'ㅅㅎ', sub: '8', value: '8' },
      { label: 'ㅈㅊ', sub: '9', value: '9' },
      { label: '.,?!', value: '.' }
    ]
  ];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 w-full bg-[#D1D5DB] pb-safe z-[200] select-none shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
        {/* Handle bar for dragging/closing */}
        <div className="w-full h-6 bg-[#F3F4F6] flex items-center justify-center cursor-pointer" onClick={onClose}>
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-1.5 grid gap-1.5 max-w-2xl mx-auto">
            {/* Top 3 Rows */}
            {rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-4 gap-1.5">
                    {row.map((key, cIdx) => {
                        if (key.type === 'backspace') {
                            return (
                                <button key={cIdx} onClick={onDelete} className="bg-[#E5E7EB] active:bg-[#D1D5DB] rounded-md h-12 flex items-center justify-center shadow-sm">
                                    <Delete size={24} className="text-gray-600" />
                                </button>
                            );
                        }
                        if (key.type === 'search') {
                             return (
                                <button key={cIdx} onClick={onSearch} className="bg-blue-500 active:bg-blue-600 rounded-md h-12 flex items-center justify-center shadow-sm">
                                    <Search size={24} className="text-white" strokeWidth={3} />
                                </button>
                            );
                        }
                        return (
                            <button 
                                key={cIdx} 
                                onClick={() => onInput(key.label.charAt(0))} // Just input first char for demo
                                className="bg-white active:bg-gray-100 rounded-md h-12 flex flex-col items-center justify-center shadow-sm relative"
                            >
                                <span className="text-lg font-bold text-gray-800 leading-none">{key.label}</span>
                                {key.sub && <span className="absolute top-1 right-1.5 text-[10px] text-gray-400 font-medium">{key.sub}</span>}
                            </button>
                        );
                    })}
                </div>
            ))}

            {/* Bottom Row (Custom Layout) */}
            <div className="grid grid-cols-[1.2fr_1.2fr_1.2fr_2fr_1fr] gap-1.5 h-12">
                 <button className="bg-[#E5E7EB] active:bg-[#D1D5DB] rounded-md flex items-center justify-center shadow-sm font-bold text-gray-600 text-xs">
                    !#1
                 </button>
                 <button className="bg-[#E5E7EB] active:bg-[#D1D5DB] rounded-md flex items-center justify-center shadow-sm font-bold text-gray-600 text-xs">
                    한/영
                 </button>
                 <button onClick={() => onInput('0')} className="bg-white active:bg-gray-100 rounded-md flex flex-col items-center justify-center shadow-sm relative">
                    <span className="text-lg font-bold text-gray-800 leading-none">ㅇㅁ</span>
                    <span className="absolute top-1 right-1.5 text-[10px] text-gray-400 font-medium">0</span>
                 </button>
                 <button onClick={() => onInput(' ')} className="bg-white active:bg-gray-100 rounded-md flex items-center justify-center shadow-sm">
                    <span className="w-8 h-4 border-b-2 border-gray-400 mb-1" />
                 </button>
                 <button onClick={() => onInput('.')} className="bg-white active:bg-gray-100 rounded-md flex items-center justify-center shadow-sm text-lg font-bold text-gray-800">
                    .
                 </button>
            </div>
        </div>
    </motion.div>
  );
};

export default VirtualKeypad;
