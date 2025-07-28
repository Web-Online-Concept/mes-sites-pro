import { prisma } from '../../lib/prisma';
import { getUserFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { bookmarkId, url } = req.body;

  if (!bookmarkId || !url) {
    return res.status(400).json({ error: 'bookmarkId et url requis' });
  }

  try {
    // Pour Vercel, nous utilisons une API externe car Puppeteer est trop lourd
    // Vous pouvez utiliser des services comme :
    // - https://screenshotapi.net/
    // - https://apiflash.com/
    // - https://screenshot.abstractapi.com/
    // - Ou l'API de Vercel OG Image Generation

    // Option 1 : Utiliser un service externe (nécessite une clé API)
    if (process.env.SCREENSHOT_API_KEY) {
      const screenshotUrl = await captureWithExternalAPI(url);
      
      if (screenshotUrl) {
        // Mettre à jour le favori avec l'URL du screenshot
        await prisma.bookmark.update({
          where: { id: bookmarkId },
          data: { screenshot: screenshotUrl },
        });

        return res.status(200).json({ screenshot: screenshotUrl });
      }
    }

    // Option 2 : Utiliser l'API Vercel OG pour générer une image de prévisualisation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
    const ogImageUrl = `${baseUrl}/api/og?url=${encodeURIComponent(url)}`;

    // Mettre à jour le favori avec l'URL de l'image OG
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { screenshot: ogImageUrl },
    });

    res.status(200).json({ screenshot: ogImageUrl });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: 'Erreur lors de la capture d\'écran' });
  }
}

// Fonction pour capturer avec une API externe
async function captureWithExternalAPI(url) {
  try {
    // Exemple avec Screenshot API
    // const apiUrl = `https://shot.screenshotapi.net/screenshot`;
    // const response = await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     token: process.env.SCREENSHOT_API_KEY,
    //     url: url,
    //     width: 1280,
    //     height: 720,
    //     output: 'json',
    //     thumbnail_width: 400,
    //   }),
    // });

    // if (response.ok) {
    //   const data = await response.json();
    //   return data.screenshot;
    // }

    // Exemple avec APIFlash
    const apiUrl = `https://api.apiflash.com/v1/urltoimage`;
    const params = new URLSearchParams({
      access_key: process.env.SCREENSHOT_API_KEY,
      url: url,
      format: 'jpeg',
      width: 1280,
      height: 720,
      thumbnail_width: 400,
      response_type: 'json',
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.url;
    }

    return null;
  } catch (error) {
    console.error('External API error:', error);
    return null;
  }
}