import { getUserFromRequest } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { bookmarkId, newTabId } = req.body;

    if (!bookmarkId || !newTabId) {
      return res.status(400).json({ error: 'bookmarkId et newTabId requis' });
    }

    // Vérifier que le favori appartient à l'utilisateur
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: userId,
      },
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    // Vérifier que l'onglet de destination appartient à l'utilisateur
    const targetTab = await prisma.tab.findFirst({
      where: {
        id: newTabId,
        userId: userId,
      },
    });

    if (!targetTab) {
      return res.status(404).json({ error: 'Onglet de destination non trouvé' });
    }

    // Si on change vraiment de catégorie
    if (bookmark.tabId !== newTabId) {
      // Obtenir le prochain ordre disponible dans la catégorie de destination
      const maxOrderResult = await prisma.bookmark.aggregate({
        where: {
          tabId: newTabId,
          userId: userId,
        },
        _max: {
          order: true,
        },
      });

      const newOrder = (maxOrderResult._max.order || 0) + 1;

      // Déplacer le favori avec le nouvel ordre
      const updatedBookmark = await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { 
          tabId: newTabId,
          order: newOrder 
        },
        include: { tab: true },
      });

      // Optionnel : Réorganiser les favoris dans l'ancienne catégorie pour combler le trou
      await prisma.bookmark.updateMany({
        where: {
          tabId: bookmark.tabId,
          userId: userId,
          order: {
            gt: bookmark.order
          }
        },
        data: {
          order: {
            decrement: 1
          }
        }
      });

      res.status(200).json(updatedBookmark);
    } else {
      // Si on reste dans la même catégorie, ne rien faire
      res.status(200).json(bookmark);
    }
  } catch (error) {
    console.error('Move bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors du déplacement du favori' });
  }
}