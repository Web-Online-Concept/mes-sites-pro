import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupérer l'ID de l'utilisateur depuis le token
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            tabs: true,
            bookmarks: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      ...user,
      tabsCount: user._count.tabs,
      bookmarksCount: user._count.bookmarks,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
  }
}