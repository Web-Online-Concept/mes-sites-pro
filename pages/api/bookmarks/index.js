import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const userId = await getUserFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  switch (req.method) {
    case 'GET':
      return getBookmarks(userId, req, res);
    case 'POST':
      return createBookmark(userId, req, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Récupérer les favoris (avec filtre optionnel par onglet)
async function getBookmarks(userId, req, res) {
  const { tabId } = req.query;

  try {
    const where = { userId };
    if (tabId) {
      where.tabId = tabId;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        tab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.status(200).json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des favoris' });
  }
}

// Créer un nouveau favori
async function createBookmark(userId, req, res) {
  const { url, title, description, tabId } = req.body;

  // Validation
  if (!url || !title || !tabId) {
    return res.status(400).json({ 
      error: 'URL, titre et onglet sont requis' 
    });
  }

  // Validation de l'URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  try {
    // Vérifier que l'onglet appartient à l'utilisateur
    const tab = await prisma.tab.findFirst({
      where: {
        id: tabId,
        userId,
      }
    });

    if (!tab) {
      return res.status(404).json({ error: 'Onglet non trouvé' });
    }

    // Récupérer le nombre de favoris pour définir l'ordre
    const bookmarkCount = await prisma.bookmark.count({
      where: { tabId }
    });

    // Créer le favori
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title: title.trim(),
        description: description?.trim() || null,
        tabId,
        userId,
        order: bookmarkCount,
      },
      include: {
        tab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Lancer la capture d'écran en arrière-plan (sans attendre)
    captureScreenshot(bookmark.id, url);

    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du favori' });
  }
}

// Fonction pour capturer une capture d'écran (appelée en arrière-plan)
async function captureScreenshot(bookmarkId, url) {
  try {
    // Appeler l'API de capture d'écran
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarkId, url }),
    });

    if (!response.ok) {
      console.error('Screenshot capture failed');
    }
  } catch (error) {
    console.error('Screenshot error:', error);
  }
}