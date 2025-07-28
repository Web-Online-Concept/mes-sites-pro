import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TabManager({ activeTab, onTabChange }) {
  const [tabs, setTabs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTab, setEditingTab] = useState(null);
  const [editTabName, setEditTabName] = useState('');

  useEffect(() => {
    fetchTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTabs = async () => {
    try {
      const response = await fetch('/api/tabs');
      if (response.ok) {
        const data = await response.json();
        setTabs(data);
        // Si aucun onglet actif et qu'il y a des onglets, sélectionner le premier
        if (!activeTab && data.length > 0) {
          onTabChange(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tabs:', error);
      toast.error('Erreur lors du chargement des onglets');
    }
  };

  const createTab = async () => {
    if (!newTabName.trim()) {
      toast.error('Le nom de l\'onglet ne peut pas être vide');
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
        toast.success('Onglet créé avec succès');
        onTabChange(newTab.id);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating tab:', error);
      toast.error('Erreur lors de la création de l\'onglet');
    }
  };

  const updateTab = async (tabId) => {
    if (!editTabName.trim()) {
      toast.error('Le nom de l\'onglet ne peut pas être vide');
      return;
    }

    try {
      const response = await fetch(`/api/tabs/${tabId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTabName.trim() }),
      });

      if (response.ok) {
        const updatedTab = await response.json();
        setTabs(tabs.map(tab => tab.id === tabId ? updatedTab : tab));
        setEditingTab(null);
        setEditTabName('');
        toast.success('Onglet mis à jour');
      }
    } catch (error) {
      console.error('Error updating tab:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteTab = async (tabId) => {
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
        const remainingTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(remainingTabs);
        
        // Si l'onglet supprimé était actif, sélectionner un autre
        if (activeTab === tabId && remainingTabs.length > 0) {
          onTabChange(remainingTabs[0].id);
        }
        
        toast.success('Onglet supprimé');
      }
    } catch (error) {
      console.error('Error deleting tab:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg shadow-sm">
        {/* Liste des onglets */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <div key={tab.id} className="relative group">
              {editingTab === tab.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editTabName}
                    onChange={(e) => setEditTabName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && updateTab(tab.id)}
                    onBlur={() => updateTab(tab.id)}
                    className="px-3 py-1 text-sm border border-primary-500 rounded-md focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.name}
                </button>
              )}
              
              {/* Actions sur l'onglet */}
              {!editingTab && (
                <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1 bg-white rounded-md shadow-lg p-1">
                  <button
                    onClick={() => {
                      setEditingTab(tab.id);
                      setEditTabName(tab.name);
                    }}
                    className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Modifier"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {tabs.length > 1 && (
                    <button
                      onClick={() => deleteTab(tab.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bouton ajouter un onglet */}
        {isCreating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTab()}
              placeholder="Nom de l'onglet"
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary-500"
              autoFocus
            />
            <button
              onClick={createTab}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Valider"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTabName('');
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Annuler"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel onglet
          </button>
        )}
      </div>
    </div>
  );
}