export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Supprimer le cookie d'authentification
  res.setHeader(
    'Set-Cookie',
    'auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );

  res.status(200).json({ message: 'Déconnexion réussie' });
}