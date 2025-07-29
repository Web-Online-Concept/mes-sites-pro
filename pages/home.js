import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Cookies from 'js-cookie';
import toast, { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('auth-token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Stocker le token et le username
        Cookies.set('auth-token', data.token, { expires: 7, path: '/' });
        Cookies.set('username', data.username, { expires: 7, path: '/' });
        
        toast.success('Connexion réussie !');
        
        // Redirection immédiate vers l'application
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mes Sites Pro - Organisez vos favoris</title>
        <meta name="description" content="Tous vos sites favoris organisés en un seul endroit" />
      </Head>
      <Toaster position="top-right" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header avec connexion intégrée */}
        <header className="bg-white shadow-sm border-b">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Mes Sites Pro</h1>
              </div>
              
              {/* Section connexion */}
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Accéder à mes favoris
                  </Link>
                ) : (
                  <>
                    {!showLoginForm ? (
                      <>
                        <button 
                          onClick={() => setShowLoginForm(true)}
                          className="text-gray-700 hover:text-gray-900 font-medium"
                        >
                          Connexion
                        </button>
                        <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Commencer gratuitement
                        </Link>
                      </>
                    ) : (
                      <form onSubmit={handleLogin} className="flex items-center space-x-3">
                        <input
                          type="text"
                          placeholder="Nom d'utilisateur"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          required
                          autoFocus
                        />
                        <input
                          type="password"
                          placeholder="Mot de passe"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          required
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {loading ? '...' : 'Se connecter'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLoginForm(false);
                            setLoginData({ username: '', password: '' });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="relative pt-16 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                Tous vos sites favoris
                <span className="block text-blue-600">organisés en un seul endroit</span>
              </h2>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Créez des onglets personnalisés, ajoutez vos sites préférés et accédez-y rapidement depuis n'importe où.
              </p>
              <div className="mt-10">
                {isAuthenticated ? (
                  <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                    Accéder à mes favoris
                  </Link>
                ) : (
                  <>
                    {!showLoginForm && (
                      <Link href="/register" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                        Créer mon compte gratuit
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900">Fonctionnalités principales</h3>
              <p className="mt-4 text-lg text-gray-600">Tout ce dont vous avez besoin pour organiser vos favoris</p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Onglets personnalisés</h4>
                <p className="mt-2 text-base text-gray-600">
                  Organisez vos sites en catégories avec des onglets personnalisés
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Aperçus visuels</h4>
                <p className="mt-2 text-base text-gray-600">
                  Visualisez vos sites avec des captures d'écran automatiques
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Export/Import facile</h4>
                <p className="mt-2 text-base text-gray-600">
                  Sauvegardez et transférez vos favoris entre appareils
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Responsive mobile</h4>
                <p className="mt-2 text-base text-gray-600">
                  Accédez à vos favoris depuis n'importe quel appareil
                </p>
              </div>

              {/* Feature 5 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Glisser-déposer</h4>
                <p className="mt-2 text-base text-gray-600">
                  Réorganisez facilement vos favoris par glisser-déposer
                </p>
              </div>

              {/* Feature 6 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">100% Sécurisé</h4>
                <p className="mt-2 text-base text-gray-600">
                  Vos données sont protégées et accessibles uniquement par vous
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-white">Prêt à organiser vos favoris ?</h3>
            <p className="mt-4 text-lg text-blue-100">
              Rejoignez les utilisateurs qui ont déjà simplifié leur navigation web
            </p>
            <div className="mt-8">
              {isAuthenticated ? (
                <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50">
                  Accéder à mes favoris
                </Link>
              ) : (
                <>
                  {!showLoginForm ? (
                    <Link href="/register" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50">
                      Créer mon compte gratuit
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setShowLoginForm(false)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                    >
                      Connectez-vous dans le header ci-dessus
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © 2024 Mes Sites Pro. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}