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
  DragOverlay,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Layout from '../components/Layout.js';
import TabManager from '../components/TabManager.js';
import BookmarkCard from '../components/BookmarkCard.js';
import SubcategoryManager from '../components/SubcategoryManager.js';
import ExportImport from '../components/ExportImport.js';
import EmojiPicker from '../components/EmojiPicker.js';
import toast from 'react-hot-toast';

// Composant pour créer une zone de drop
function DroppableCategory({ id, children, isOver }) {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [unclassifiedIcon, setUnclassifiedIcon] = useState('📌');
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
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
  
  // Charger les tabs et bookmarks au démarrage
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await fetch('/api/tabs');
        if (response.ok) {
          const data = await response.json();
          console.log('Tabs loaded:', data); // Debug
          setTabs(data);
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    if (isAuthenticated) {
      fetchTabs();
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  // Charger l'icône "Non classés" depuis localStorage
  useEffect(() => {
    const savedIcon = localStorage.getItem('unclassifiedIcon');
    if (savedIcon) {
      setUnclassifiedIcon(savedIcon);
    }
  }, []);

  // Sauvegarder l'icône "Non classés" dans localStorage
  const handleUnclassifiedIconChange = (newIcon) => {
    setUnclassifiedIcon(newIcon);
    localStorage.setItem('unclassifiedIcon', newIcon);
  };

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookmarks`); // On récupère TOUS les favoris
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

    setIsSavingBookmark(true);

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
    } finally {
      setIsSavingBookmark(false);
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    setOverId(over ? over.id : null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeBookmark = bookmarks.find(b => b.id === active.id);
    if (!activeBookmark) return;

    // Si on drop sur une catégorie différente
    if (over.id && typeof over.id === 'string' && over.id.startsWith('category-')) {
      const newTabId = over.id.replace('category-', '');
      
      if (newTabId !== activeBookmark.tabId) {
        // Mise à jour optimiste immédiate
        const updatedBookmark = { ...activeBookmark, tabId: newTabId };
        handleUpdateBookmark(updatedBookmark);
        
        try {
          const response = await fetch('/api/bookmarks/move', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              bookmarkId: active.id,
              newTabId: newTabId
            }),
          });

          if (response.ok) {
            const serverBookmark = await response.json();
            handleUpdateBookmark(serverBookmark);
            toast.success('Favori déplacé avec succès');
          } else {
            // En cas d'erreur, on remet l'ancien état
            handleUpdateBookmark(activeBookmark);
            toast.error('Erreur lors du déplacement');
          }
        } catch (error) {
          console.error('Move error:', error);
          // En cas d'erreur, on remet l'ancien état
          handleUpdateBookmark(activeBookmark);
          toast.error('Erreur lors du déplacement');
        }
      }
    } 
    // Si on drop sur un autre bookmark dans la même catégorie (réorganisation)
    else if (over.id && over.id !== active.id) {
      const overBookmark = bookmarks.find(b => b.id === over.id);
      
      // Vérifier qu'ils sont dans la même catégorie
      if (overBookmark && activeBookmark.tabId === overBookmark.tabId) {
        // Filtrer uniquement les bookmarks de cette catégorie
        const categoryBookmarks = bookmarks.filter(b => b.tabId === activeBookmark.tabId);
        const oldIndex = categoryBookmarks.findIndex(b => b.id === active.id);
        const newIndex = categoryBookmarks.findIndex(b => b.id === over.id);
        
        // Réorganiser uniquement dans cette catégorie
        const reorderedCategoryBookmarks = arrayMove(categoryBookmarks, oldIndex, newIndex);
        
        // Reconstruire le tableau complet en préservant l'ordre des autres catégories
        const newBookmarks = bookmarks.map(bookmark => {
          if (bookmark.tabId === activeBookmark.tabId) {
            const reorderedBookmark = reorderedCategoryBookmarks.find(b => b.id === bookmark.id);
            return reorderedBookmark || bookmark;
          }
          return bookmark;
        });
        
        setBookmarks(newBookmarks);

        try {
          await fetch('/api/bookmarks/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookmarkId: active.id,
              sourceIndex: oldIndex,
              destinationIndex: newIndex,
              sourceTabId: activeBookmark.tabId,
              destinationTabId: activeBookmark.tabId,
            }),
          });
        } catch (error) {
          console.error('Reorder error:', error);
          toast.error('Erreur lors de la réorganisation');
          fetchBookmarks(); // Recharger en cas d'erreur
        }
      }
      // Si on drop sur un bookmark d'une autre catégorie
      else if (overBookmark && activeBookmark.tabId !== overBookmark.tabId) {
        // On veut déplacer ET réorganiser dans la nouvelle catégorie
        // D'abord, on simule localement le déplacement
        const targetCategoryBookmarks = bookmarks
          .filter(b => b.tabId === overBookmark.tabId)
          .concat({ ...activeBookmark, tabId: overBookmark.tabId });
        
        // Trouver où insérer dans la nouvelle catégorie
        const currentIndex = targetCategoryBookmarks.findIndex(b => b.id === activeBookmark.id);
        const targetIndex = targetCategoryBookmarks.findIndex(b => b.id === overBookmark.id);
        
        // Réorganiser dans la nouvelle catégorie
        const reorderedTargetBookmarks = arrayMove(targetCategoryBookmarks, currentIndex, targetIndex);
        
        // Reconstruire le tableau complet
        const newBookmarks = bookmarks
          .filter(b => b.id !== activeBookmark.id) // Retirer de l'ancienne position
          .concat(reorderedTargetBookmarks.find(b => b.id === activeBookmark.id)) // Ajouter à la nouvelle
          .map(b => {
            // Mettre à jour les positions dans la catégorie cible
            const reorderedBookmark = reorderedTargetBookmarks.find(rb => rb.id === b.id);
            return reorderedBookmark || b;
          });
        
        setBookmarks(newBookmarks);
        
        try {
          // D'abord déplacer vers la nouvelle catégorie
          const moveResponse = await fetch('/api/bookmarks/move', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              bookmarkId: active.id,
              newTabId: overBookmark.tabId
            }),
          });

          if (moveResponse.ok) {
            // Ensuite réorganiser dans la nouvelle catégorie
            // On doit recalculer les indices après le déplacement
            const movedBookmarks = bookmarks
              .filter(b => b.tabId === overBookmark.tabId || b.id === activeBookmark.id)
              .map(b => b.id === activeBookmark.id ? { ...b, tabId: overBookmark.tabId } : b);
            
            const newOldIndex = movedBookmarks.findIndex(b => b.id === activeBookmark.id);
            const newTargetIndex = movedBookmarks.findIndex(b => b.id === overBookmark.id);
            
            if (newOldIndex !== -1 && newTargetIndex !== -1) {
              await fetch('/api/bookmarks/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookmarkId: active.id,
                  sourceIndex: newOldIndex,
                  destinationIndex: newTargetIndex,
                  sourceTabId: overBookmark.tabId,
                  destinationTabId: overBookmark.tabId,
                }),
              });
            }
            
            toast.success('Favori déplacé avec succès');
          } else {
            // En cas d'erreur, recharger
            fetchBookmarks();
            toast.error('Erreur lors du déplacement');
          }
        } catch (error) {
          console.error('Move error:', error);
          fetchBookmarks();
          toast.error('Erreur lors du déplacement');
        }
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

  // Récupérer le bookmark actif pour le DragOverlay
  const activeBookmark = activeId ? bookmarks.find(b => b.id === activeId) : null;

  return (
    <Layout 
      isEditMode={isEditMode} 
      onToggleEditMode={() => setIsEditMode(!isEditMode)}
      onAddFavori={() => setIsAddingBookmark(true)}
      viewMode={viewMode}
      onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
    >
      <Head>
        <title>Mes Favoris</title>
        <meta name="description" content="Organisez vos sites favoris par onglets" />
      </Head>

      <div className="space-y-6">
        {/* Gestion des onglets */}
        <TabManager activeTab={activeTab} onTabChange={setActiveTab} isEditMode={isEditMode} onTabsChange={setTabs} />

        {/* Contenu principal */}
        {activeTab && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Gestion des sous-catégories - visible seulement en mode édition */}
            {isEditMode && (
              <SubcategoryManager
                parentTabId={activeTab}
                subcategories={tabs.find(t => t.id === activeTab)?.children || []}
                onSubcategoriesChange={(newSubcategories) => {
                  setTabs(tabs.map(tab => 
                    tab.id === activeTab 
                      ? { ...tab, children: newSubcategories }
                      : tab
                  ));
                }}
                isEditMode={isEditMode}
              />
            )}

            {/* Formulaire d'ajout */}
            {isAddingBookmark && (
              <div className="mb-6 fade-in">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Ajouter un nouveau favori</h3>
                    <button
                      onClick={() => {
                        setIsAddingBookmark(false);
                        setNewBookmark({ url: '', title: '', description: '' });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleAddBookmark} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL du site *
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={newBookmark.url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com"
                            required
                          />
                          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre du site *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newBookmark.title}
                            onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Mon site préféré"
                            required
                          />
                          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optionnel)
                      </label>
                      <div className="relative">
                        <textarea
                          value={newBookmark.description}
                          onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Une brève description du site..."
                          rows="2"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSavingBookmark}
                        className={`btn-primary flex items-center ${isSavingBookmark ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {isSavingBookmark ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Ajouter le favori
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingBookmark}
                        onClick={() => {
                          setIsAddingBookmark(false);
                          setNewBookmark({ url: '', title: '', description: '' });
                        }}
                        className={`btn-secondary ${isSavingBookmark ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Chargement des favoris...</p>
              </div>
            )}

            {/* Liste des favoris avec DnD global */}
            {!loading && (() => {
              const currentTab = tabs.find(t => t.id === activeTab);
              const subcategories = currentTab?.children || [];
              const allTabIds = [activeTab, ...subcategories.map(s => s.id)];
              const allBookmarks = bookmarks.filter(b => allTabIds.includes(b.tabId));
              
              return allBookmarks.length === 0;
            })() ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-4 text-gray-500">Aucun favori dans cet onglet</p>
                {isEditMode && (
                  <p className="text-sm text-gray-400 mt-1">Cliquez sur &quot;Ajouter un favori&quot; pour commencer</p>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div>
                  {/* Récupérer l'onglet actif et ses sous-catégories */}
                  {(() => {
                    const currentTab = tabs.find(t => t.id === activeTab);
                    const subcategories = currentTab?.children || [];
                    const allTabIds = [activeTab, ...subcategories.map(s => s.id)];
                    
                    // Grouper les favoris par catégorie
                    const bookmarksByCategory = {};
                    bookmarks
                      .filter(b => allTabIds.includes(b.tabId))
                      .forEach(bookmark => {
                        if (!bookmarksByCategory[bookmark.tabId]) {
                          bookmarksByCategory[bookmark.tabId] = [];
                        }
                        bookmarksByCategory[bookmark.tabId].push(bookmark);
                      });

                    // Favoris sans sous-catégorie (directement dans l'onglet principal)
                    const mainBookmarks = bookmarksByCategory[activeTab] || [];
                    
                    // Pour le sélecteur, on ne veut que les onglets principaux
                    const selectableTabs = tabs.filter(t => !t.parentId);

                    return (
                      <>
                        {/* Favoris par sous-catégorie EN PREMIER */}
                        {subcategories.map(subcategory => {
                          const categoryBookmarks = bookmarksByCategory[subcategory.id] || [];
                          
                          if (categoryBookmarks.length === 0 && !isEditMode) {
                            return null; // Ne pas afficher les sous-catégories vides en mode lecture
                          }

                          return (
                            <DroppableCategory 
                              key={subcategory.id} 
                              id={`category-${subcategory.id}`}
                              isOver={overId === `category-${subcategory.id}`}
                            >
                              <div className="mb-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-300">
                                  <h3 className="text-xl font-bold text-blue-700">
                                    <span className="mr-2">{subcategory.icon || '🌐'}</span>
                                    {subcategory.name}
                                  </h3>
                                  {isEditMode && (
                                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {categoryBookmarks.length} favori{categoryBookmarks.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                
                                {categoryBookmarks.length === 0 ? (
                                  <div className="text-center py-8 bg-white rounded-lg border border-blue-100">
                                    <p className="text-gray-500 text-sm">
                                      {isEditMode ? 'Glissez des favoris ici' : 'Aucun favori dans cette sous-catégorie'}
                                    </p>
                                  </div>
                                ) : (
                                  <SortableContext
                                    items={categoryBookmarks.map(b => b.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className={viewMode === 'grid' 
                                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                                      : "flex flex-col gap-2"
                                    }>
                                      {categoryBookmarks.map((bookmark) => (
                                        <BookmarkCard
                                          key={bookmark.id}
                                          bookmark={bookmark}
                                          onUpdate={handleUpdateBookmark}
                                          onDelete={handleDeleteBookmark}
                                          isEditMode={isEditMode}
                                          tabs={selectableTabs}
                                          viewMode={viewMode}
                                        />
                                      ))}
                                    </div>
                                  </SortableContext>
                                )}
                              </div>
                            </DroppableCategory>
                          );
                        })}

                        {/* Favoris "Non classés" EN DERNIER */}
                        {(mainBookmarks.length > 0 || (subcategories.length > 0 && isEditMode)) && (
                          <DroppableCategory 
                            id={`category-${activeTab}`} 
                            isOver={overId === `category-${activeTab}`}
                          >
                            <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                              {subcategories.length > 0 && (
                                <div className="mb-4 pb-2 border-b border-gray-300 flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
                                    <span>{unclassifiedIcon}</span>
                                    Non classés
                                  </h3>
                                  {isEditMode && (
                                    <EmojiPicker 
                                      currentEmoji={unclassifiedIcon} 
                                      onSelect={handleUnclassifiedIconChange}
                                    />
                                  )}
                                </div>
                              )}
                              <SortableContext
                                items={mainBookmarks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className={viewMode === 'grid' 
                                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                                  : "flex flex-col gap-2"
                                }>
                                  {mainBookmarks.map((bookmark) => (
                                    <BookmarkCard
                                      key={bookmark.id}
                                      bookmark={bookmark}
                                      onUpdate={handleUpdateBookmark}
                                      onDelete={handleDeleteBookmark}
                                      isEditMode={isEditMode}
                                      tabs={selectableTabs}
                                      viewMode={viewMode}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                              {mainBookmarks.length === 0 && isEditMode && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  Glissez des favoris ici
                                </div>
                              )}
                            </div>
                          </DroppableCategory>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Overlay pour l'élément en cours de drag */}
                <DragOverlay>
                  {activeBookmark ? (
                    <div className="opacity-50">
                      <BookmarkCard
                        bookmark={activeBookmark}
                        onUpdate={() => {}}
                        onDelete={() => {}}
                        isEditMode={false}
                        tabs={[]}
                        viewMode={viewMode}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        )}

        {/* Export/Import en bas */}
        <div className="mt-8">
          <ExportImport onImport={handleImportComplete} />
        </div>
      </div>
    </Layout>
  );
}