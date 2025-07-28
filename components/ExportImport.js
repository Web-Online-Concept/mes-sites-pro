import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function ExportImport({ onImport }) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export-import?action=export');
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const data = await response.json();
      
      // Créer un fichier JSON et le télécharger
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-sites-pro-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Export réussi !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      toast.error('Veuillez sélectionner un fichier JSON');
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch {
        toast.error('Fichier JSON invalide');
        return;
      }

      // Valider la structure du fichier
      if (!data.version || !data.tabs || !Array.isArray(data.tabs)) {
        toast.error('Format de fichier invalide');
        return;
      }

      // Demander confirmation
      const tabCount = data.tabs.length;
      const bookmarkCount = data.tabs.reduce((acc, tab) => acc + (tab.bookmarks?.length || 0), 0);
      
      if (!confirm(`Voulez-vous importer ${tabCount} onglet(s) et ${bookmarkCount} favori(s) ?\n\nCela ajoutera ces éléments à vos favoris existants.`)) {
        return;
      }

      // Envoyer les données au serveur
      const response = await fetch('/api/export-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      const result = await response.json();
      toast.success(`Import réussi ! ${result.tabsImported} onglet(s) et ${result.bookmarksImported} favori(s) importés.`);
      
      // Recharger les données
      if (onImport) {
        onImport();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">Export / Import</h3>
        <p className="text-xs text-gray-500 mt-1">
          Sauvegardez ou restaurez vos favoris
        </p>
      </div>
      
      <div className="flex gap-2">
        {/* Bouton Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          title="Exporter tous vos favoris"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter
        </button>

        {/* Bouton Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Importer des favoris"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {isImporting ? 'Import...' : 'Importer'}
        </button>

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}