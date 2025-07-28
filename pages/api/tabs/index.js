import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const userId = await getUserFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  switch (req.method) {
    case 'GET':
      return getTabs(userId, res);
    case 'POST':
      return createTab(userId, req, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Récupérer tous les onglets de l'utilisateur
async function getTabs(userId, res) {
  try {
    const tabs = await prisma.tab.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    res.status(200).json(tabs);
  } catch (error) {
    console.error('Get tabs error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des onglets' });
  }
}

// Créer un nouvel onglet
async function createTab(userId, req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom de l\'onglet est requis' });
  }

  try {
    // Récupérer le nombre d'onglets pour définir l'ordre
    const tabCount = await prisma.tab.count({
      where: { userId }
    });

    const tab = await prisma.tab.create({
      data: {
        name: name.trim(),
        userId,
        order: tabCount,
      },
      include: {
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    res.status(201).json(tab);
  } catch (error) {
    console.error('Create tab error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'onglet' });
  }
}