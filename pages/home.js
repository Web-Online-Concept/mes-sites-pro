import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = Cookies.get('auth-token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const features = [
    {
      icon: '📑',
      title: 'Organisation par onglets',
      description: 'Créez des onglets personnalisés pour classer vos sites par catégorie'
    },
    {
      icon: '🔗',
      title: 'Gestion simple',
      description: 'Ajoutez, modifiez et supprimez vos favoris en quelques clics'
    },
    {
      icon: '📸',
      title: 'Aperçu visuel',
      description: 'Visualisez vos sites avec des captures d\'écran automatiques'
    },
    {
      icon: '🔄',
      title: 'Drag & Drop',
      description: 'Réorganisez vos favoris par simple glisser-déposer'
    },
    {
      icon: '💾',
      title: 'Sauvegarde',
      description: 'Exportez et importez vos favoris pour ne jamais les perdre'
    },
    {
      icon: '📱',
      title: 'Multi-appareils',
      description: 'Accédez à vos favoris depuis n\'importe quel appareil'
    }
  ];

  return (
    <>
      <Head>
        <title>Mes Sites Pro - Gestionnaire de favoris intelligent</title>
        <meta name="description" content="Organisez tous vos sites favoris en un seul endroit avec notre gestionnaire de favoris intelligent" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Mes Sites Pro</h1>
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <Link href="/" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    Accéder à mes favoris
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                      Connexion
                    </Link>
                    <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                      Commencer gratuitement
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Tous vos sites favoris<br />
              <span className="text-primary-600">organisés en un seul endroit</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Créez votre espace personnel pour sauvegarder, organiser et accéder rapidement à tous vos sites web préférés. 
              Simple, efficace et accessible partout.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors">
                  Accéder à mes favoris
                </Link>
              ) : (
                <>
                  <Link href="/register" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors">
                    Créer mon compte gratuit
                  </Link>
                  <Link href="/login" className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-medium border-2 border-primary-600 hover:bg-primary-50 transition-colors">
                    J'ai déjà un compte
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Screenshot placeholder */}
          <div className="mt-16 bg-white rounded-lg shadow-2xl p-8">
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <p className="text-gray-500">Interface de gestion de vos favoris</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Tout ce dont vous avez besoin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h3 className="text-3xl font-bold text-white mb-4">
              Prêt à organiser vos favoris ?
            </h3>
            <p className="text-xl text-primary-100 mb-8">
              Rejoignez-nous et commencez à organiser vos sites web dès maintenant.
            </p>
            {isAuthenticated ? (
              <Link href="/" className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-block">
                Accéder à mes favoris
              </Link>
            ) : (
              <Link href="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-block">
                Commencer gratuitement
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; 2024 Mes Sites Pro. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}