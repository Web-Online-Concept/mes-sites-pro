import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TabManager({ activeTab, onTabChange, isEditMode }) {
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
        setTabs([...tabs, newTab]);
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
        setTabs(tabs.map(tab => tab.id === tabId ? updatedTab : tab));
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <div key={tab.id} className="flex items-center group">
            {editingTab === tab.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTab(tab.id); }} className="flex items-center">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    setEditingTab(null);
                    setEditingName('');
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
              </form>
            ) : (
              <>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.name}
                </button>
                {/* Actions d'édition - visibles seulement en mode édition */}
                {isEditMode && (
                  <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTab(tab.id);
                        setEditingName(tab.name);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={() => handleDeleteTab(tab.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </>
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
              className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
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