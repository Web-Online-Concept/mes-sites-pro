import { prisma } from '../../../lib/prisma';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const userId = await getUserFromRequest(req);
  if (!userId) {
    console.error('No user ID found in request');
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    console.error('Invalid updates payload:', updates);
    return res.status(400).json({ error: 'Liste de mises à jour requise' });
  }

  try {
    // Vérifier que tous les favoris et onglets appartiennent à l'utilisateur
    const bookmarkIds = updates.map(u => u.id).filter(id => id);
    const tabIds = [...new Set(updates.map(u => u.tabId).filter(id => id))];

    console.log('Validating bookmarks:', bookmarkIds);
    console.log('Validating tabs:', tabIds);
    console.log('User ID:', userId);

    // Vérifier les favoris
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        id: { in: bookmarkIds },
        userId,
      },
    });

    // Vérifier les onglets
    const tabs = await prisma.tab.findMany({
      where: {
        id: { in: tabIds },
        userId,
      },
    });

    console.log('Found bookmarks:', bookmarks.map(b => ({ id: b.id, userId: b.userId })));
    console.log('Found tabs:', tabs.map(t => ({ id: t.id, userId: t.userId })));

    if (bookmarks.length !== bookmarkIds.length) {
      console.error('Some bookmarks not found or unauthorized:', {
        requested: bookmarkIds,
        found: bookmarks.map(b => b.id),
      });
      return res.status(404).json({
        error: 'Certains favoris non trouvés ou non autorisés',
        details: {
          requestedBookmarks: bookmarkIds,
          foundBookmarks: bookmarks.map(b => b.id),
        },
      });
    }

    if (tabs.length !== tabIds.length) {
      console.error('Some tabs not found or unauthorized:', {
        requested: tabIds,
        found: tabs.map(t => t.id),
      });
      return res.status(404).json({
        error: 'Certains onglets non trouvés ou non autorisés',
        details: {
          requestedTabs: tabIds,
          foundTabs: tabs.map(t => t.id),
        },
      });
    }

    // Créer les mises à jour
    const updateQueries = updates.map(update => {
      console.log('Preparing update for bookmark:', update);
      return prisma.bookmark.update({
        where: { id: update.id },
        data: {
          order: update.order,
          tabId: update.tabId,
        },
      });
    });

    // Exécuter toutes les mises à jour dans une transaction
    await prisma.$transaction(updateQueries);
    console.log('Bookmarks updated successfully');

    res.status(200).json({ message: 'Ordre mis à jour avec succès' });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: `Erreur lors de la réorganisation: ${error.message}` });
  }
}