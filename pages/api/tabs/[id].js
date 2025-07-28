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
      return getTab(userId, id, res);
    case 'PUT':
      return updateTab(userId, id, req, res);
    case 'DELETE':
      return deleteTab(userId, id, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Récupérer un onglet spécifique
async function getTab(userId, tabId, res) {
  try {
    const tab = await prisma.tab.findFirst({
      where: {
        id: tabId,
        userId,
      },
      include: {
        bookmarks: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!tab) {
      return res.status(404).json({ error: 'Onglet non trouvé' });
    }

    res.status(200).json(tab);
  } catch (error) {
    console.error('Get tab error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'onglet' });
  }
}

// Mettre à jour un onglet
async function updateTab(userId, tabId, req, res) {
  const { name, order } = req.body;

  try {
    // Vérifier que l'onglet appartient à l'utilisateur
    const existingTab = await prisma.tab.findFirst({
      where: {
        id: tabId,
        userId,
      }
    });

    if (!existingTab) {
      return res.status(404).json({ error: 'Onglet non trouvé' });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (order !== undefined) updateData.order = order;

    const tab = await prisma.tab.update({
      where: { id: tabId },
      data: updateData,
      include: {
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    res.status(200).json(tab);
  } catch (error) {
    console.error('Update tab error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'onglet' });
  }
}

// Supprimer un onglet
async function deleteTab(userId, tabId, res) {
  try {
    // Vérifier que l'onglet appartient à l'utilisateur
    const existingTab = await prisma.tab.findFirst({
      where: {
        id: tabId,
        userId,
      }
    });

    if (!existingTab) {
      return res.status(404).json({ error: 'Onglet non trouvé' });
    }

    // Vérifier qu'il reste au moins un autre onglet
    const tabCount = await prisma.tab.count({
      where: { userId }
    });

    if (tabCount <= 1) {
      return res.status(400).json({ error: 'Vous devez conserver au moins un onglet' });
    }

    // Supprimer l'onglet (les bookmarks seront supprimés automatiquement grâce à onDelete: Cascade)
    await prisma.tab.delete({
      where: { id: tabId }
    });

    res.status(200).json({ message: 'Onglet supprimé avec succès' });
  } catch (error) {
    console.error('Delete tab error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'onglet' });
  }
}