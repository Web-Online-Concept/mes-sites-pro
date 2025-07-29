{bookmark.screenshot && !imageError ? (
          <img
            src={bookmark.screenshot}
            alt={bookmark.title}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('Image failed to load:', bookmark.screenshot);
              setImageError(true);
            }}
          />
        ) : (
          <div className="relative h-full">
            <img
              src="/default-preview.png"
              alt="Aperçu non disponible"
              className="w-full h-full object-cover"
            />
            {/* Overlay avec favicon et domaine */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white bg-opacity-90 rounded-lg p-3">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                  alt=""
                  className="w-8 h-8 mx-auto mb-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-700 font-medium">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          </div>
        )}('Image failed to load:', bookmark.screenshot);
              setImageError(true);
            }}
          />
        ) : (
          <div className="relative h-full">
            <img
              src="/default-preview.png"
              alt="Aperçu non disponible"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
              <div className="text-center">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                  alt=""
                  className="w-8 h-8 mx-auto mb-2 bg-white rounded p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <p className="text-white text-sm font-medium bg-black bg-opacity-50import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function BookmarkCard({ bookmark, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: bookmark.title,
    description: bookmark.description || ''
  });
  const [imageError, setImageError] = useState(false);

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

  const handleVisit = () => {
    window.open(bookmark.url, '_blank');
  };

  // Obtenir le domaine pour afficher un favicon de secours
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
      className="bookmark-card bg-white rounded-lg shadow-sm hover:shadow-md overflow-hidden transition-all border border-gray-200"
    >
      {/* Zone draggable - seulement le haut de la carte */}
      <div {...attributes} {...listeners} className="cursor-move p-2 bg-gray-50 border-b">
        <div className="flex justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM17 18a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
      </div>
      {/* Image de prévisualisation - plus petite */}
      <a 
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative h-24 bg-gray-50 hover:bg-gray-100 transition-colors group"
      >
        {bookmark.screenshot && !imageError ? (
          <img
            src={bookmark.screenshot}
            alt={bookmark.title}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('Image failed to load:', bookmark.screenshot);
              setImageError(true);
            }}
          />
        ) : (
          <img
            src="/default-preview.png"
            alt="Aperçu non disponible"
            className="w-full h-full object-cover opacity-80"
          />
        )}
        
        {/* Overlay au survol */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>

      {/* Contenu de la carte */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              placeholder="Titre"
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500 resize-none"
              placeholder="Description (optionnel)"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    title: bookmark.title,
                    description: bookmark.description || ''
                  });
                }}
                className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 mb-1 truncate" title={bookmark.title}>
              {bookmark.title}
            </h3>
            <p className="text-xs text-gray-500 mb-2 truncate" title={bookmark.url}>
              {bookmark.url}
            </p>
            {bookmark.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {bookmark.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
            title="Modifier"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}