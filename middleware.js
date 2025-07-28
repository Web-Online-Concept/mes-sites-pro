import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = ['/login', '/register', '/landing', '/api/auth/login', '/api/auth/register'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Permettre l'accès aux pages publiques
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Vérifier le token JWT
  const token = request.cookies.get('auth-token');
  
  if (!token) {
    // Rediriger vers la page de connexion si pas de token
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Vérifier la validité du token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token.value, secret);
    
    // Token valide, continuer
    return NextResponse.next();
  } catch (error) {
    // Token invalide, rediriger vers la connexion
    console.error('Token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - fichiers publics (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};