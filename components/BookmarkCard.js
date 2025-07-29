import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function BookmarkCard({ bookmark, onUpdate, onDelete, isEditMode, tabs }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: bookmark.title,
    description: bookmark.description || ''
  });
  const [selectedTabId, setSelectedTabId] = useState(bookmark.tabId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedBookmark = await response.json();
        onUpdate(updatedBookmark);
        setIsEditing(false);
        toast.success('Favori mis à jour');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleTabChange = async (newTabId) => {
    if (newTabId === bookmark.tabId) return;

    try {
      const response = await fetch('/api/bookmarks/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookmarkId: bookmark.id,
          newTabId: newTabId
        }),
      });

      if (response.ok) {
        const updatedBookmark = await response.json();
        onUpdate(updatedBookmark);
        setSelectedTabId(newTabId);
        toast.success('Favori déplacé avec succès');
      } else {
        toast.error('Erreur lors du déplacement');
        setSelectedTabId(bookmark.tabId);
      }
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Erreur lors du déplacement');
      setSelectedTabId(bookmark.tabId);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce favori ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(bookmark.id);
        toast.success('Favori supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Obtenir le domaine pour afficher un favicon
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bookmark-card fade-in bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden transition-all border border-gray-200 w-full"
    >
      {/* Zone draggable et image combinées */}
      <div className="relative">
        {/* Poignée de drag discrète - visible seulement en mode édition */}
        {isEditMode && (
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute top-1 right-1 z-10 cursor-move p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
          >
            <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        )}

        {/* Image de prévisualisation */}
        <a 
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-video bg-gray-50 hover:bg-gray-100 transition-colors group"
        >
          <div className="relative h-full">
            <img
              src="/default-preview.png"
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
            {/* Overlay avec favicon et domaine */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white bg-opacity-90 rounded p-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                  alt=""
                  className="w-6 h-6 mx-auto mb-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                  {getDomain(bookmark.url)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Overlay au survol */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>
      </div>

      {/* Contenu compact */}
      <div className="p-2">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-xs"
              placeholder="Titre"
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500 resize-none text-xs"
              placeholder="Description"
              rows="2"
            />
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="flex-1 px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    title: bookmark.title,
                    description: bookmark.description || ''
                  });
                }}
                className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mode lecture - Titre centré uniquement */}
            {!isEditMode ? (
              <h3 className="font-medium text-gray-900 text-center text-sm" title={bookmark.title}>
                {bookmark.title}
              </h3>
            ) : (
              <>
                {/* Mode édition - Layout complet */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h3 className="font-medium text-gray-900 truncate text-xs flex-1" title={bookmark.title}>
                    {bookmark.title}
                  </h3>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Domaine au lieu de l'URL complète */}
                <p className="text-xs text-gray-500 truncate" title={bookmark.url}>
                  {getDomain(bookmark.url)}
                </p>
                
                {/* Sélecteur de catégorie */}
                {tabs && tabs.length > 0 && (
                  <div className="mt-1">
                    <select
                      value={selectedTabId}
                      onChange={(e) => handleTabChange(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                      title="Déplacer vers..."
                    >
                      {tabs.map((tab) => (
                        <optgroup key={tab.id} label={tab.name}>
                          <option value={tab.id}>{tab.icon || '📁'} {tab.name}</option>
                          {tab.children && tab.children.map((subcat) => (
                            <option key={subcat.id} value={subcat.id}>
                              &nbsp;&nbsp;└ {subcat.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Description si présente */}
                {bookmark.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {bookmark.description}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}