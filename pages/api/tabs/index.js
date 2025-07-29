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

// Récupérer tous les onglets de l'utilisateur avec leurs sous-catégories
async function getTabs(userId, res) {
  try {
    const tabs = await prisma.tab.findMany({
      where: { 
        userId,
        parentId: null // Seulement les onglets principaux
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { bookmarks: true }
        },
        children: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { bookmarks: true }
            }
          }
        }
      }
    });

    // Calculer le total des favoris pour chaque onglet (incluant les sous-catégories)
    const tabsWithTotalCount = tabs.map(tab => {
      // Compter les favoris de l'onglet principal
      let totalBookmarks = tab._count.bookmarks;
      
      // Ajouter les favoris de chaque sous-catégorie
      if (tab.children && tab.children.length > 0) {
        tab.children.forEach(child => {
          totalBookmarks += child._count.bookmarks;
        });
      }
      
      return {
        ...tab,
        _count: {
          ...tab._count,
          totalBookmarks // Nouveau champ pour le total
        }
      };
    });

    res.status(200).json(tabsWithTotalCount);
  } catch (error) {
    console.error('Get tabs error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des onglets' });
  }
}

// Créer un nouvel onglet ou sous-catégorie
async function createTab(userId, req, res) {
  const { name, parentId = null } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  try {
    // Si c'est une sous-catégorie, vérifier que le parent existe et appartient à l'utilisateur
    if (parentId) {
      const parentTab = await prisma.tab.findFirst({
        where: {
          id: parentId,
          userId,
          parentId: null // S'assurer que le parent est bien un onglet principal
        }
      });

      if (!parentTab) {
        return res.status(404).json({ error: 'Onglet parent non trouvé' });
      }
    }

    // Récupérer le nombre d'onglets/sous-catégories pour définir l'ordre
    const tabCount = await prisma.tab.count({
      where: { 
        userId,
        parentId: parentId // Compter seulement les éléments du même niveau
      }
    });

    const tab = await prisma.tab.create({
      data: {
        name: name.trim(),
        userId,
        parentId,
        order: tabCount,
      },
      include: {
        _count: {
          select: { bookmarks: true }
        },
        children: parentId ? undefined : {
          include: {
            _count: {
              select: { bookmarks: true }
            }
          }
        }
      }
    });

    res.status(201).json(tab);
  } catch (error) {
    console.error('Create tab error:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
}