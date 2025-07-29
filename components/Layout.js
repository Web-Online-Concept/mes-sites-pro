import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children, isEditMode, onToggleEditMode, onAddFavori }) {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Récupérer le username depuis le cookie d'abord
    const storedUsername = Cookies.get('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    // Puis vérifier avec l'API pour être sûr
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        // Mettre à jour le cookie au cas où
        Cookies.set('username', data.username, { expires: 7, path: '/' });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('auth-token');
    Cookies.remove('username');
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Titre et utilisateur */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                Sites favoris {username && `de ${username}`}
              </h1>
            </div>

            {/* Menu utilisateur - toujours visible */}
            <div className="flex items-center space-x-4">
              {/* Bouton Ajouter un favori - TOUJOURS visible */}
              {onAddFavori && (
                <button
                  onClick={onAddFavori}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un favori
                </button>
              )}
              
              {/* Bouton Modifier si la prop est passée */}
              {onToggleEditMode && (
                <button
                  onClick={onToggleEditMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm ${
                    isEditMode 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    )}
                  </svg>
                  {isEditMode ? 'Valider' : 'Modifier'}
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm">Déconnexion</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 Mes Sites Pro. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}