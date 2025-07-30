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

    const { bookmarkId, newTabId, targetPosition } = req.body;

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

    // Transaction pour gérer l'ordre correctement
    const updatedBookmark = await prisma.$transaction(async (prisma) => {
      const oldTabId = bookmark.tabId;
      const oldOrder = bookmark.order;

      // Si on change de catégorie ou si on a une position cible
      if (oldTabId !== newTabId || targetPosition !== undefined) {
        // Récupérer tous les favoris de la catégorie de destination
        const destinationBookmarks = await prisma.bookmark.findMany({
          where: {
            tabId: newTabId,
            userId: userId,
            id: { not: bookmarkId } // Exclure le favori qu'on déplace
          },
          orderBy: { order: 'asc' }
        });

        // Calculer la nouvelle position
        let newOrder;
        if (targetPosition !== undefined && targetPosition >= 0) {
          // Insérer à la position spécifiée
          newOrder = targetPosition;
          
          // Décaler tous les favoris après cette position
          await prisma.bookmark.updateMany({
            where: {
              tabId: newTabId,
              userId: userId,
              order: { gte: targetPosition },
              id: { not: bookmarkId }
            },
            data: {
              order: { increment: 1 }
            }
          });
        } else {
          // Si pas de position spécifiée, mettre en dernière position
          newOrder = destinationBookmarks.length;
        }

        // Si on change de catégorie, réorganiser l'ancienne catégorie
        if (oldTabId !== newTabId) {
          await prisma.bookmark.updateMany({
            where: {
              tabId: oldTabId,
              userId: userId,
              order: { gt: oldOrder }
            },
            data: {
              order: { decrement: 1 }
            }
          });
        }

        // Mettre à jour le favori avec sa nouvelle position
        return await prisma.bookmark.update({
          where: { id: bookmarkId },
          data: { 
            tabId: newTabId,
            order: newOrder 
          },
          include: { tab: true }
        });
      }

      // Si on reste dans la même catégorie sans position cible, ne rien faire
      return bookmark;
    });

    res.status(200).json(updatedBookmark);
  } catch (error) {
    console.error('Move bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors du déplacement du favori' });
  }
}