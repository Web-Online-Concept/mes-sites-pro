import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Layout from '../components/Layout.js';
import TabManager from '../components/TabManager.js';
import BookmarkCard from '../components/BookmarkCard.js';
import ExportImport from '../components/ExportImport.js';
import toast from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    const token = Cookies.get('auth-token');
    if (token) {
      setIsAuthenticated(true);
    } else if (!loading) {
      // Seulement rediriger si on n'est pas en train de charger
      router.push('/home');
    }
    setLoading(false);
  }, []); // Pas de dépendances pour éviter les boucles
  
  useEffect(() => {
    if (activeTab && isAuthenticated) {
      fetchBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookmarks?tabId=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    
    if (!newBookmark.url || !newBookmark.title) {
      toast.error('L\'URL et le titre sont requis');
      return;
    }

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBookmark,
          tabId: activeTab,
        }),
      });

      if (response.ok) {
        const bookmark = await response.json();
        setBookmarks([...bookmarks, bookmark]);
        setNewBookmark({ url: '', title: '', description: '' });
        setIsAddingBookmark(false);
        toast.success('Favori ajouté');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Add bookmark error:', error);
      toast.error('Erreur lors de l\'ajout du favori');
    }
  };

  const handleUpdateBookmark = (updatedBookmark) => {
    setBookmarks(bookmarks.map(b => 
      b.id === updatedBookmark.id ? updatedBookmark : b
    ));
  };

  const handleDeleteBookmark = (bookmarkId) => {
    setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);

      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex);
      setBookmarks(newBookmarks);

      try {
        await fetch('/api/bookmarks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookmarkId: active.id,
            sourceIndex: oldIndex,
            destinationIndex: newIndex,
            sourceTabId: activeTab,
            destinationTabId: activeTab,
          }),
        });
      } catch (error) {
        console.error('Reorder error:', error);
        toast.error('Erreur lors de la réorganisation');
        fetchBookmarks(); // Recharger en cas d'erreur
      }
    }
  };

  const handleImportComplete = () => {
    // Recharger la page pour actualiser les données
    window.location.reload();
  };

  // Analyser l'URL pour extraire le titre automatiquement
  const handleUrlChange = async (url) => {
    setNewBookmark({ ...newBookmark, url });

    if (url && !newBookmark.title) {
      try {
        // Extraire le domaine comme titre par défaut
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const siteName = domain.split('.')[0];
        setNewBookmark(prev => ({
          ...prev,
          title: prev.title || siteName.charAt(0).toUpperCase() + siteName.slice(1)
        }));
      } catch {
        // URL invalide, ignorer
      }
    }
  };

  // Ne PAS rediriger si on est en train de vérifier l'auth
  if (!loading && !isAuthenticated) {
    router.push('/home');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Mes Sites Pro - Gestionnaire de favoris</title>
        <meta name="description" content="Organisez vos sites favoris par onglets" />
      </Head>

      <div className="space-y-6">
        {/* Gestion des onglets */}
        <TabManager activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Export/Import */}
        <ExportImport onImport={handleImportComplete} />

        {/* Contenu principal */}
        {activeTab && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Bouton ajouter un favori */}
            <div className="mb-6">
              {isAddingBookmark ? (
                <form onSubmit={handleAddBookmark} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL *
                      </label>
                      <input
                        type="url"
                        value={newBookmark.url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre *
                      </label>
                      <input
                        type="text"
                        value={newBookmark.title}
                        onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Nom du site"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={newBookmark.description}
                      onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Description du site"
                      rows="2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBookmark(false);
                        setNewBookmark({ url: '', title: '', description: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingBookmark(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un favori
                </button>
              )}
            </div>

            {/* Liste des favoris */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-4 text-gray-500">Aucun favori dans cet onglet</p>
                <p className="text-sm text-gray-400 mt-1">Cliquez sur &quot;Ajouter un favori&quot; pour commencer</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bookmarks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onUpdate={handleUpdateBookmark}
                        onDelete={handleDeleteBookmark}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}