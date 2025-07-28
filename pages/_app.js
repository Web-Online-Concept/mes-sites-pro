import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Gérer la navigation et l'authentification côté client si nécessaire
    const handleRouteChange = (url) => {
      // Logique de tracking ou de vérification si nécessaire
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          success: {
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </>
  );
}