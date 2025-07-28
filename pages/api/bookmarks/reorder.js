import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const userId = await getUserFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { bookmarkId, sourceIndex, destinationIndex, sourceTabId, destinationTabId } = req.body;

  // Validation
  if (
    bookmarkId === undefined ||
    sourceIndex === undefined ||
    destinationIndex === undefined ||
    !sourceTabId ||
    !destinationTabId
  ) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // Vérifier que le favori appartient à l'utilisateur
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      }
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    // Si on change d'onglet
    if (sourceTabId !== destinationTabId) {
      // Vérifier que l'onglet de destination appartient à l'utilisateur
      const destinationTab = await prisma.tab.findFirst({
        where: {
          id: destinationTabId,
          userId,
        }
      });

      if (!destinationTab) {
        return res.status(404).json({ error: 'Onglet de destination non trouvé' });
      }

      // Récupérer tous les favoris de l'onglet source
      const sourceBookmarks = await prisma.bookmark.findMany({
        where: { tabId: sourceTabId, userId },
        orderBy: { order: 'asc' },
      });

      // Récupérer tous les favoris de l'onglet de destination
      const destinationBookmarks = await prisma.bookmark.findMany({
        where: { tabId: destinationTabId, userId },
        orderBy: { order: 'asc' },
      });

      // Retirer le favori de la liste source
      const movedBookmark = sourceBookmarks.splice(sourceIndex, 1)[0];
      
      // L'insérer dans la liste de destination
      destinationBookmarks.splice(destinationIndex, 0, movedBookmark);

      // Mettre à jour l'ordre dans l'onglet source
      const sourceUpdates = sourceBookmarks.map((bm, index) => 
        prisma.bookmark.update({
          where: { id: bm.id },
          data: { order: index },
        })
      );

      // Mettre à jour l'ordre dans l'onglet de destination et changer l'onglet
      const destinationUpdates = destinationBookmarks.map((bm, index) => {
        const data = { order: index };
        if (bm.id === bookmarkId) {
          data.tabId = destinationTabId;
        }
        return prisma.bookmark.update({
          where: { id: bm.id },
          data,
        });
      });

      // Exécuter toutes les mises à jour
      await prisma.$transaction([...sourceUpdates, ...destinationUpdates]);
    } else {
      // Déplacement dans le même onglet
      const bookmarks = await prisma.bookmark.findMany({
        where: { tabId: sourceTabId, userId },
        orderBy: { order: 'asc' },
      });

      // Réorganiser la liste
      const [movedBookmark] = bookmarks.splice(sourceIndex, 1);
      bookmarks.splice(destinationIndex, 0, movedBookmark);

      // Mettre à jour l'ordre de tous les favoris
      const updates = bookmarks.map((bm, index) =>
        prisma.bookmark.update({
          where: { id: bm.id },
          data: { order: index },
        })
      );

      await prisma.$transaction(updates);
    }

    res.status(200).json({ message: 'Ordre mis à jour avec succès' });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Erreur lors de la réorganisation' });
  }
}