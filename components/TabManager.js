import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TabManager({ activeTab, onTabChange, isEditMode, onTabsChange }) {
  const [tabs, setTabs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTab, setEditingTab] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    try {
      const response = await fetch('/api/tabs');
      if (response.ok) {
        const data = await response.json();
        setTabs(data);
        if (onTabsChange) {
          onTabsChange(data);
        }
        
        // Sélectionner le premier onglet par défaut
        if (data.length > 0 && !activeTab) {
          onTabChange(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tabs:', error);
      toast.error('Erreur lors du chargement des onglets');
    }
  };

  const handleCreateTab = async (e) => {
    e.preventDefault();
    
    if (!newTabName.trim()) {
      toast.error('Le nom de l\'onglet est requis');
      return;
    }

    try {
      const response = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTabName.trim() }),
      });

      if (response.ok) {
        const newTab = await response.json();
        const updatedTabs = [...tabs, newTab];
        setTabs(updatedTabs);
        if (onTabsChange) {
          onTabsChange(updatedTabs);
        }
        setNewTabName('');
        setIsCreating(false);
        onTabChange(newTab.id);
        toast.success('Onglet créé');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Create tab error:', error);
      toast.error('Erreur lors de la création de l\'onglet');
    }
  };

  const handleUpdateTab = async (tabId) => {
    if (!editingName.trim()) {
      toast.error('Le nom de l\'onglet est requis');
      return;
    }

    try {
      const response = await fetch(`/api/tabs/${tabId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (response.ok) {
        const updatedTab = await response.json();
        const updatedTabs = tabs.map(tab => tab.id === tabId ? updatedTab : tab);
        setTabs(updatedTabs);
        if (onTabsChange) {
          onTabsChange(updatedTabs);
        }
        setEditingTab(null);
        setEditingName('');
        toast.success('Onglet mis à jour');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Update tab error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteTab = async (tabId) => {
    if (tabs.length <= 1) {
      toast.error('Vous devez conserver au moins un onglet');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet onglet et tous ses favoris ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tabs/${tabId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const newTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(newTabs);
        if (onTabsChange) {
          onTabsChange(newTabs);
        }
        
        // Si l'onglet actif est supprimé, sélectionner le premier
        if (activeTab === tabId && newTabs.length > 0) {
          onTabChange(newTabs[0].id);
        }
        
        toast.success('Onglet supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete tab error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-md p-4 border border-gray-700">
      <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {tabs.map((tab) => (
          <div key={tab.id} className="relative">
            {editingTab === tab.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTab(tab.id); }} className="flex items-center">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingTab(null);
                      setEditingName('');
                    }
                  }}
                  className="px-3 py-1 border border-blue-500 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTab(null);
                    setEditingName('');
                  }}
                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded-r-md hover:bg-gray-400 ml-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => onTabChange(tab.id)}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 hover:shadow-sm'
                }`}
              >
                {tab.name}
                {/* Badge avec le nombre total de favoris */}
                {!isEditMode && tab._count?.totalBookmarks > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  } font-semibold`}>
                    {tab._count.totalBookmarks}
                  </span>
                )}
                {/* Actions intégrées dans l'onglet actif seulement */}
                {isEditMode && activeTab === tab.id && (
                  <div className="flex items-center gap-1 ml-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTab(tab.id);
                        setEditingName(tab.name);
                      }}
                      className="hover:bg-blue-800 hover:bg-opacity-30 rounded p-0.5 cursor-pointer transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </span>
                    {tabs.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(tab.id);
                        }}
                        className="hover:bg-blue-800 hover:bg-opacity-30 rounded p-0.5 cursor-pointer transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </span>
                    )}
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
        
        {/* Bouton nouveau onglet - visible seulement en mode édition */}
        {isEditMode && (
          isCreating ? (
            <form onSubmit={handleCreateTab} className="flex items-center">
              <input
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Nom de l'onglet"
                className="px-3 py-1 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-green-500 text-white rounded-r-md hover:bg-green-600"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTabName('');
                }}
                className="ml-1 px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md whitespace-nowrap font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvel onglet
            </button>
          )
        )}
      </div>
    </div>
  );
}