import { useState } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker from './EmojiPicker';

export default function SubcategoryManager({ parentTabId, subcategories, onSubcategoriesChange, isEditMode }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState('🌐');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');

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
          parentId: parentTabId,
          icon: newSubcategoryIcon
        }),
      });

      if (response.ok) {
        const newSubcategory = await response.json();
        onSubcategoriesChange([...subcategories, newSubcategory]);
        setNewSubcategoryName('');
        setNewSubcategoryIcon('🌐');
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

  const startEdit = (subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingName(subcategory.name);
    setEditingIcon(subcategory.icon || '🌐');
  };

  const cancelEdit = () => {
    setEditingSubcategoryId(null);
    setEditingName('');
    setEditingIcon('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!editingName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const response = await fetch(`/api/tabs/${editingSubcategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName,
          icon: editingIcon
        }),
      });

      if (response.ok) {
        const updatedSubcategory = await response.json();
        onSubcategoriesChange(subcategories.map(s => 
          s.id === editingSubcategoryId ? updatedSubcategory : s
        ));
        cancelEdit();
        toast.success('Sous-catégorie modifiée');
      } else {
        toast.error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Update subcategory error:', error);
      toast.error('Erreur lors de la modification');
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
              <EmojiPicker 
                currentEmoji={newSubcategoryIcon} 
                onSelect={setNewSubcategoryIcon}
              />
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
                  setNewSubcategoryIcon('🌐');
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

      {/* Liste des sous-catégories */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subcategories.map(sub => (
            <div key={sub.id}>
              {editingSubcategoryId === sub.id ? (
                <div className="inline-flex bg-blue-50 p-2 rounded-lg border-2 border-blue-300">
                  <form onSubmit={handleUpdate} className="flex items-center gap-2">
                    <EmojiPicker 
                      currentEmoji={editingIcon} 
                      onSelect={setEditingIcon}
                    />
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                      title="Valider"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-2 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
                      title="Annuler"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  <span className="flex items-center gap-1">
                    <span>{sub.icon || '🌐'}</span>
                    <span>{sub.name}</span>
                  </span>
                  {isEditMode && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => startEdit(sub)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}