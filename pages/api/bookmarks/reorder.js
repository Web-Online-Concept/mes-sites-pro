import { prisma } from '../../../lib/prisma';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const userId = await getUserFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Liste de mises à jour requise' });
  }

  try {
    // Vérifier que tous les favoris et onglets appartiennent à l'utilisateur
    const bookmarkIds = updates.map(u => u.id);
    const tabIds = [...new Set(updates.map(u => u.tabId))];

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        id: { in: bookmarkIds },
        userId,
      },
    });

    const tabs = await prisma.tab.findMany({
      where: {
        id: { in: tabIds },
        userId,
      },
    });

    if (bookmarks.length !== bookmarkIds.length) {
      return res.status(404).json({ error: 'Certains favoris non trouvés ou non autorisés' });
    }

    if (tabs.length !== tabIds.length) {
      return res.status(404).json({ error: 'Certains onglets non trouvés ou non autorisés' });
    }

    // Créer les mises à jour
    const updateQueries = updates.map(update =>
      prisma.bookmark.update({
        where: { id: update.id },
        data: {
          order: update.order,
          tabId: update.tabId,
        },
      })
    );

    // Exécuter toutes les mises à jour dans une transaction
    await prisma.$transaction(updateQueries);

    res.status(200).json({ message: 'Ordre mis à jour avec succès' });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Erreur lors de la réorganisation' });
  }
}