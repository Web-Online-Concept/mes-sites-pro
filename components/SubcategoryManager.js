import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SubcategoryManager({ parentTabId, subcategories, onSubcategoriesChange, isEditMode }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!newSubcategoryName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const response = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubcategoryName,
          parentId: parentTabId
        }),
      });

      if (response.ok) {
        const newSubcategory = await response.json();
        onSubcategoriesChange([...subcategories, newSubcategory]);
        setNewSubcategoryName('');
        setIsAdding(false);
        toast.success('Sous-catégorie créée');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Create subcategory error:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleDelete = async (subcategoryId) => {
    if (!confirm('Supprimer cette sous-catégorie ? Les favoris seront déplacés dans la catégorie principale.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tabs/${subcategoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSubcategoriesChange(subcategories.filter(s => s.id !== subcategoryId));
        toast.success('Sous-catégorie supprimée');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete subcategory error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!isEditMode && subcategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {isEditMode && (
        <div className="flex items-center gap-2 mb-2">
          {isAdding ? (
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Nom de la sous-catégorie"
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSubcategoryName('');
                }}
                className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une sous-catégorie
            </button>
          )}
        </div>
      )}

      {/* Liste des sous-catégories pour sélection */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subcategories.map(sub => (
            <div
              key={sub.id}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span>{sub.name}</span>
              {isEditMode && (
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="ml-1 text-red-500 hover:text-red-700"
                  title="Supprimer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}