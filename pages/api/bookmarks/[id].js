import { prisma } from '../../../lib/prisma';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const userId = await getUserFromRequest(req);
  const { id } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  switch (req.method) {
    case 'GET':
      return getBookmark(userId, id, res);
    case 'PUT':
      return updateBookmark(userId, id, req, res);
    case 'DELETE':
      return deleteBookmark(userId, id, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Récupérer un favori spécifique
async function getBookmark(userId, bookmarkId, res) {
  try {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
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

    if (!bookmark) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    res.status(200).json(bookmark);
  } catch (error) {
    console.error('Get bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du favori' });
  }
}

// Mettre à jour un favori
async function updateBookmark(userId, bookmarkId, req, res) {
  const { title, description, url, tabId, order } = req.body;

  try {
    // Vérifier que le favori appartient à l'utilisateur
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      }
    });

    if (!existingBookmark) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (url !== undefined) {
      // Valider l'URL si elle est modifiée
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return res.status(400).json({ error: 'URL invalide' });
      }
    }
    if (order !== undefined) updateData.order = order;
    
    // Si on change d'onglet, vérifier que le nouvel onglet appartient à l'utilisateur
    if (tabId !== undefined && tabId !== existingBookmark.tabId) {
      const tab = await prisma.tab.findFirst({
        where: {
          id: tabId,
          userId,
        }
      });

      if (!tab) {
        return res.status(404).json({ error: 'Onglet non trouvé' });
      }
      
      updateData.tabId = tabId;
    }

    // Mettre à jour le favori
    const bookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: updateData,
      include: {
        tab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.status(200).json(bookmark);
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du favori' });
  }
}

// Supprimer un favori
async function deleteBookmark(userId, bookmarkId, res) {
  try {
    // Vérifier que le favori appartient à l'utilisateur
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      }
    });

    if (!existingBookmark) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    // Supprimer le favori
    await prisma.bookmark.delete({
      where: { id: bookmarkId }
    });

    res.status(200).json({ message: 'Favori supprimé avec succès' });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du favori' });
  }
}