import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X } from 'lucide-react';
import { createTicketSchema } from '@/lib/validations/forms';

interface TicketFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<any>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const categories = [
  'Sistema',
  'Hardware',
  'Software',
  'Rede',
  'Email',
  'Impressora',
  'Telefonia',
  'Acesso',
  'Outros',
];

export function TicketForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  mode = 'create',
}: TicketFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      category: initialData?.category || '',
      ...initialData,
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      await onSubmit({ ...data, attachments });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ticket');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white">
          {mode === 'create' ? 'Novo Ticket' : 'Editar Ticket'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 text-red-200 mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Título *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Descreva brevemente o problema"
                      className="bg-neutral-700 border-neutral-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Categoria *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-neutral-800 border-neutral-600">
                        {categories.map(category => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="text-white"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Prioridade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-neutral-800 border-neutral-600">
                        <SelectItem value="low" className="text-white">
                          Baixa
                        </SelectItem>
                        <SelectItem value="medium" className="text-white">
                          Média
                        </SelectItem>
                        <SelectItem value="high" className="text-white">
                          Alta
                        </SelectItem>
                        <SelectItem value="critical" className="text-white">
                          Crítica
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzir, mensagens de erro, etc."
                      className="bg-neutral-700 border-neutral-600 text-white min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Anexos */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Anexos</label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-neutral-300"
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Arquivo
                </Button>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                />

                <span className="text-xs text-neutral-400">
                  Máx. 10MB por arquivo
                </span>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-neutral-700 p-2 rounded"
                    >
                      <span className="text-sm text-white truncate">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'create' ? 'Criar Ticket' : 'Salvar Alterações'}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="border-neutral-600 text-neutral-300"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
