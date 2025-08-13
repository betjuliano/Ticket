'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white text-center">
            Página Não Encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300 text-center">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.history.back()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Voltar
            </Button>
            <Button
              onClick={() => window.location.href = '/auth/signin'}
              variant="outline"
              className="flex-1 border-neutral-600 text-gray-300 hover:bg-slate-700"
            >
              Ir para Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 