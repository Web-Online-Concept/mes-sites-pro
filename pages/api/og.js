import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new Response('URL manquante', { status: 400 });
    }

    // Extraire le domaine et le nom du site
    let domain = '';
    let siteName = '';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
      siteName = domain.split('.')[0];
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {
      domain = 'Site web';
      siteName = 'Site';
    }

    // Générer l'image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #e5e7eb 0%, #f3f4f6 50%)',
          }}
        >
          {/* Icône du site (favicon) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: 20,
              backgroundColor: 'white',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              marginBottom: 30,
            }}
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
              width={80}
              height={80}
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* Nom du site */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {siteName}
          </div>

          {/* Domaine */}
          <div
            style={{
              fontSize: 24,
              color: '#6b7280',
              marginBottom: 30,
              textAlign: 'center',
            }}
          >
            {domain}
          </div>

          {/* Badge de lien */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              borderRadius: 9999,
              color: 'white',
              fontSize: 18,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Lien sauvegardé
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image error:', error);
    return new Response('Erreur lors de la génération de l\'image', { status: 500 });
  }
}