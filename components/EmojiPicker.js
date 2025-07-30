import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EmojiPicker({ onSelect, currentEmoji = '📁' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  
  const emojis = [
    // Catégories
    { category: 'Général', emojis: ['📁', '📂', '⭐', '❤️', '🔖', '📌', '🏷️'] },
    { category: 'Travail', emojis: ['💼', '💻', '📊', '📈', '📉', '📧', '🏢', '👔'] },
    { category: 'Maison', emojis: ['🏠', '🏡', '🛋️', '🍳', '🛏️', '🚿', '🌱', '🔑'] },
    { category: 'Loisirs', emojis: ['🎮', '🎯', '🎨', '🎭', '🎪', '🎵', '🎸', '🎬'] },
    { category: 'Sports', emojis: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐', '🏓', '🏃'] },
    { category: 'Voyage', emojis: ['✈️', '🚗', '🚂', '🛫', '🏖️', '🏔️', '🗺️', '🧳'] },
    { category: 'Shopping', emojis: ['🛒', '🛍️', '💳', '💰', '🏪', '🏬', '👕', '👟'] },
    { category: 'Éducation', emojis: ['📚', '📖', '✏️', '🎓', '🏫', '📝', '💡', '🔬'] },
    { category: 'Santé', emojis: ['💊', '🏥', '👨‍⚕️', '🩺', '💉', '🧘', '🏃‍♀️', '🥗'] },
    { category: 'Tech', emojis: ['💻', '📱', '🖥️', '⌨️', '🖱️', '🔌', '💾', '📡'] },
    { category: 'Nature', emojis: ['🌳', '🌲', '🌴', '🌵', '🌸', '🌺', '🌻', '🌿'] },
    { category: 'Autre', emojis: ['🔵', '🟢', '🟡', '🔴', '🟣', '🟠', '⚫', '⚪'] }
  ];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
    }
  }, [isOpen]);

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  const pickerContent = isOpen && (
    <>
      {/* Overlay pour fermer en cliquant ailleurs */}
      <div 
        className="fixed inset-0 z-[90]" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Picker */}
      <div 
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-[100] max-w-sm max-h-96 overflow-y-auto"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="sticky top-0 bg-white pb-2 mb-2 border-b">
          <h3 className="text-sm font-semibold text-gray-700">Choisir une icône</h3>
        </div>
        {emojis.map(({ category, emojis }) => (
          <div key={category} className="mb-3">
            <h4 className="text-xs font-semibold text-gray-600 mb-1">{category}</h4>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSelect(emoji)}
                  className="text-xl p-1 hover:bg-gray-100 rounded transition-colors"
                  title={`Sélectionner ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
        title="Choisir une icône"
      >
        {currentEmoji}
      </button>
      
      {/* Utiliser un portail pour afficher le picker en dehors du conteneur */}
      {typeof window !== 'undefined' && createPortal(pickerContent, document.body)}
    </div>
  );
}