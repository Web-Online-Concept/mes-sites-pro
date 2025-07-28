import { prisma } from '../../lib/prisma';
import { getUserFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  const userId = await getUserFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.method === 'GET') {
    // Export
    const { action } = req.query;
    
    if (action !== 'export') {
      return res.status(400).json({ error: 'Action invalide' });
    }

    return handleExport(userId, res);
  } else if (req.method === 'POST') {
    // Import
    return handleImport(userId, req, res);
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Exporter les données de l'utilisateur
async function handleExport(userId, res) {
  try {
    // Récupérer tous les onglets et favoris de l'utilisateur
    const tabs = await prisma.tab.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        bookmarks: {
          orderBy: { order: 'asc' },
          select: {
            url: true,
            title: true,
            description: true,
            order: true,
          }
        }
      }
    });

    // Formater les données pour l'export
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tabs: tabs.map(tab => ({
        name: tab.name,
        order: tab.order,
        bookmarks: tab.bookmarks,
      })),
    };

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
}

// Importer des données
async function handleImport(userId, req, res) {
  const data = req.body;

  // Validation basique
  if (!data || !data.version || !data.tabs || !Array.isArray(data.tabs)) {
    return res.status(400).json({ error: 'Format de données invalide' });
  }

  try {
    let tabsImported = 0;
    let bookmarksImported = 0;

    // Récupérer le nombre actuel d'onglets pour définir l'ordre
    const currentTabCount = await prisma.tab.count({
      where: { userId }
    });

    // Traiter chaque onglet
    for (let i = 0; i < data.tabs.length; i++) {
      const tabData = data.tabs[i];
      
      // Créer l'onglet
      const tab = await prisma.tab.create({
        data: {
          name: tabData.name || `Onglet importé ${i + 1}`,
          order: currentTabCount + i,
          userId,
        }
      });
      tabsImported++;

      // Créer les favoris de cet onglet
      if (tabData.bookmarks && Array.isArray(tabData.bookmarks)) {
        for (let j = 0; j < tabData.bookmarks.length; j++) {
          const bookmarkData = tabData.bookmarks[j];
          
          // Valider l'URL
          try {
            new URL(bookmarkData.url);
          } catch {
            continue; // Ignorer les URLs invalides
          }

          await prisma.bookmark.create({
            data: {
              url: bookmarkData.url,
              title: bookmarkData.title || 'Sans titre',
              description: bookmarkData.description || null,
              order: bookmarkData.order ?? j,
              tabId: tab.id,
              userId,
            }
          });
          bookmarksImported++;
        }
      }
    }

    res.status(200).json({
      message: 'Import réussi',
      tabsImported,
      bookmarksImported,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
}