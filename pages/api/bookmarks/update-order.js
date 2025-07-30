import { getUserFromRequest } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { bookmarkId, newOrder, tabId } = req.body;

    if (!bookmarkId || newOrder === undefined || !tabId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
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

    // Mettre à jour directement l'ordre
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { 
        order: newOrder,
        tabId: tabId 
      },
    });

    res.status(200).json(updatedBookmark);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
}