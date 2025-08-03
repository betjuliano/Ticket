import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Definir permissões por rota
    const routePermissions = {
      '/dashboard': ['ADMIN', 'COORDINATOR'],
      '/tickets': ['ADMIN', 'COORDINATOR', 'USER'],
      '/knowledge': ['ADMIN', 'COORDINATOR', 'USER'],
      '/users': ['ADMIN'],
      '/systems': ['ADMIN'],
      '/analytics': ['ADMIN', 'COORDINATOR'],
    };

    // Verificar se a rota requer permissões específicas
    const requiredRoles =
      routePermissions[pathname as keyof typeof routePermissions];

    if (requiredRoles && !requiredRoles.includes(token?.role as string)) {
      // Redirecionar para a primeira rota permitida baseada no role
      const userRole = token?.role as string;
      let redirectPath = '/tickets'; // padrão para USER

      if (userRole === 'ADMIN') {
        redirectPath = '/dashboard';
      } else if (userRole === 'COORDINATOR') {
        redirectPath = '/dashboard';
      }

      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/knowledge/:path*',
    '/users/:path*',
    '/systems/:path*',
    '/analytics/:path*',
  ],
};
