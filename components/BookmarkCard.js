import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

export default function BookmarkCard({ bookmark, onUpdate, onDelete, isEditMode, tabs }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBookmark, setEditedBookmark] = useState(bookmark);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Debug
  console.log('BookmarkCard - tabs:', tabs, 'isEditMode:', isEditMode);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: bookmark.id,
    disabled: !isEditMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedBookmark),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
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

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce favori ?')) return;

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

  const handleTabChange = async (newTabId) => {
    if (newTabId === bookmark.tabId) return;

    try {
      const response = await fetch('/api/bookmarks/move', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookmarkId: bookmark.id,
          newTabId
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        toast.success('Favori déplacé');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors du déplacement');
      }
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Erreur lors du déplacement');
    }
  };

  // Extraire le domaine de l'URL
  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Vérifier si l'image est celle par défaut
  const isDefaultImage = bookmark.screenshot === '/default-preview.png';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-24 relative group fade-in ${
        isDragging ? 'cursor-grabbing z-50' : ''
      }`}
    >
      {/* Poignée de drag - visible seulement en mode édition */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      )}

      {isEditing ? (
        // Mode édition
        <div className="p-2 h-full flex flex-col">
          <input
            type="text"
            value={editedBookmark.title}
            onChange={(e) => setEditedBookmark({ ...editedBookmark, title: e.target.value })}
            className="text-xs font-medium mb-1 border rounded px-1 py-0.5"
            placeholder="Titre"
          />
          <input
            type="url"
            value={editedBookmark.url}
            onChange={(e) => setEditedBookmark({ ...editedBookmark, url: e.target.value })}
            className="text-xs mb-1 border rounded px-1 py-0.5"
            placeholder="URL"
          />
          <textarea
            value={editedBookmark.description || ''}
            onChange={(e) => setEditedBookmark({ ...editedBookmark, description: e.target.value })}
            className="text-xs mb-1 border rounded px-1 py-0.5 resize-none"
            placeholder="Description"
            rows="2"
          />
          <div className="flex gap-1 mt-auto">
            <button
              onClick={handleUpdate}
              className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedBookmark(bookmark);
              }}
              className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded hover:bg-gray-500"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        // Mode affichage
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
            }
          }}
        >
          <div className="h-full flex flex-col">
            {/* Image - format 16:9 */}
            <div className="relative h-14 bg-gray-100 overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}
              <img
                src={bookmark.screenshot || '/default-preview.png'}
                alt={bookmark.title}
                className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = '/default-preview.png';
                  setImageLoaded(true);
                }}
              />
              {/* Si c'est l'image par défaut, afficher le favicon et le domaine */}
              {isDefaultImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center">
                    {bookmark.favicon ? (
                      <img 
                        src={bookmark.favicon} 
                        alt="" 
                        className="w-6 h-6 mx-auto mb-1"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <svg className="w-6 h-6 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    )}
                    <p className="text-white text-xs font-medium truncate px-1">
                      {getDomain(bookmark.url)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 p-2 flex flex-col">
              <div className="flex items-start justify-between gap-1">
                <h3 className="text-xs font-medium text-gray-900 truncate flex-1">
                  {isEditMode ? bookmark.title : bookmark.title}
                </h3>
                {isEditMode && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-0.5"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="text-gray-500 hover:text-red-600 transition-colors p-0.5"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              {/* URL et Description - visibles seulement en mode édition */}
              {isEditMode && (
                <>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {getDomain(bookmark.url)}
                  </p>
                  {bookmark.description && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {bookmark.description}
                    </p>
                  )}
                  
                  {/* Sélecteur de catégorie - visible seulement s'il y a plus d'un onglet */}
                  {tabs && tabs.length > 1 && (
                    <select
                      value={bookmark.tabId}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTabChange(e.target.value);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="mt-1 text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
                    >
                      {tabs.map(tab => (
                        <option key={tab.id} value={tab.id}>
                          {tab.name}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
        </a>
      )}
    </div>
  );
}