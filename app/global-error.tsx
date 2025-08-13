'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro global capturado:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white text-center">
                Erro Crítico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300 text-center">
                Ocorreu um erro crítico no sistema. Tente recarregar a página ou entre em contato com o suporte.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={reset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => window.location.href = '/auth/signin'}
                  variant="outline"
                  className="flex-1 border-neutral-600 text-gray-300 hover:bg-slate-700"
                >
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
} 