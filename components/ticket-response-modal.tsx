import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';

interface TicketResponseModalProps {
  ticket: any;
  onClose: () => void;
  onResponse: (response: string, action: 'respond' | 'return_to_coordination') => void;
  isLoading?: boolean;
}

export function TicketResponseModal({
  ticket,
  onClose,
  onResponse,
  isLoading = false,
}: TicketResponseModalProps) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (action: 'respond' | 'return_to_coordination') => {
    if (!response.trim()) {
      alert('Por favor, adicione uma resposta.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onResponse(response, action);
      setResponse('');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border border-white/20 rounded-lg">
        <CardHeader className="border-b border-neutral-700">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Responder Ticket #{ticket.id}
              </CardTitle>
              <p className="text-sm text-neutral-400 mt-1">
                {ticket.title}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Informações do Ticket */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400">
                {ticket.status === 'OPEN' ? 'ABERTO' : 
                 ticket.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' : 'RESOLVIDO'}
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-400">
                {ticket.priority.toUpperCase()}
              </Badge>
            </div>
            
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Descrição Original:</h4>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Área de Resposta */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              Sua Resposta:
            </label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Digite sua resposta ou solução para este ticket..."
              className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={() => handleSubmit('respond')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !response.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Responder'}
            </Button>
            
            <Button
              onClick={() => handleSubmit('return_to_coordination')}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isSubmitting || !response.trim()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Devolvendo...' : 'Devolver para Coordenação'}
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="text-xs text-neutral-400 space-y-1">
            <p>• <strong>Responder:</strong> Adiciona sua resposta e mantém o ticket em andamento</p>
            <p>• <strong>Devolver para Coordenação:</strong> Adiciona sua resposta e devolve o ticket para coordenação</p>
            <p>• Sua resposta será anexada à descrição do ticket</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 