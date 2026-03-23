
import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

interface UIInspectorProps {
  isActive: boolean;
}

const UIInspector: React.FC<UIInspectorProps> = ({ isActive }) => {
  const [inspectedElement, setInspectedElement] = useState<{ id: string; rect: DOMRect; tagName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
        setInspectedElement(null);
        document.body.style.cursor = 'default';
        return;
    }

    // Change cursor to indicate inspector mode
    document.body.style.cursor = 'crosshair';

    // Handle Right Click (Context Menu) to reveal ID
    const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // EXCLUSION: Ignore the Sidebar Toggle and Inspector Toggle buttons
        if (
            target.closest('#btn-ui-inspector-toggle') || 
            target.closest('button[aria-label="Toggle Sidebar"]') // Assuming sidebar toggle might have this or similar
        ) {
            return;
        }

        // Ignore if clicking inside the inspector overlay itself
        if (target.closest('.inspector-overlay')) return;

        // Find relevant element with ID
        const elementWithId = target.closest('[id]');
        
        if (elementWithId) {
            const el = elementWithId as HTMLElement;
            if (el.id === 'root') return; 

            e.preventDefault(); // Prevent browser context menu
            e.stopPropagation();

            const rect = el.getBoundingClientRect();
            setInspectedElement({ 
                id: el.id, 
                rect,
                tagName: el.tagName.toLowerCase()
            });
        }
    };

    // Handle Left Click to dismiss if not clicking the copy button
    const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // If clicking the copy button inside overlay, don't dismiss here (handled in handleCopyId)
        if (target.closest('.inspector-copy-btn')) return;
        
        // If clicking the toggle button itself, don't dismiss (state change handles it)
        if (target.closest('#btn-ui-inspector-toggle')) return;

        // Dismiss on any other click
        setInspectedElement(null);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleGlobalClick);

    return () => {
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('click', handleGlobalClick);
        document.body.style.cursor = 'default';
    };
  }, [isActive]);

  const handleCopyId = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (inspectedElement) {
          navigator.clipboard.writeText(inspectedElement.id);
          setCopiedId(inspectedElement.id);
          
          setInspectedElement(null);
          setTimeout(() => setCopiedId(null), 2000);
      }
  };

  if (!isActive || !inspectedElement) return null;

  return (
      <div 
        className="inspector-overlay fixed z-[9999] pointer-events-none"
        style={{
            top: inspectedElement.rect.top,
            left: inspectedElement.rect.left,
            width: inspectedElement.rect.width,
            height: inspectedElement.rect.height,
            border: '2px solid #ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.5)',
            borderRadius: '4px'
        }}
      >
          <div 
            className="inspector-copy-btn absolute -top-8 left-0 pointer-events-auto cursor-pointer"
            onClick={handleCopyId}
          >
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-bold text-white shadow-xl transition-colors border border-white/20
                  ${copiedId === inspectedElement.id ? 'bg-green-500' : 'bg-red-500 hover:bg-red-600'}`}
              >
                  {copiedId === inspectedElement.id ? <Check size={12} /> : <Copy size={12} />}
                  <span className="font-mono">{inspectedElement.id}</span>
                  <span className="opacity-60 text-[9px] ml-1 font-normal">&lt;{inspectedElement.tagName}&gt;</span>
              </div>
          </div>
      </div>
  );
};

export default UIInspector;
