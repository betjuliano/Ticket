import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from './Loading';
import { cn } from '@/lib/utils';

// Tipos para o componente Form
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  className?: string;
}

interface FormProps {
  fields: FormField[];
  schema: z.ZodSchema<any>;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  className?: string;
  defaultValues?: Record<string, any>;
  showErrors?: boolean;
}

/**
 * Componente de Formulário Reutilizável
 * 
 * Este componente oferece:
 * - Validação em tempo real com Zod
 * - Tratamento de erros robusto
 * - Estados de loading
 * - Campos customizáveis
 * - Acessibilidade completa
 * - Integração com tema tático
 * 
 * @param fields - Array de campos do formulário
 * @param schema - Schema Zod para validação
 * @param onSubmit - Função executada no submit
 * @param onCancel - Função executada no cancel
 * @param title - Título do formulário
 * @param description - Descrição do formulário
 * @param submitText - Texto do botão submit
 * @param cancelText - Texto do botão cancel
 * @param loading - Estado de loading
 * @param className - Classes CSS customizadas
 * @param defaultValues - Valores padrão dos campos
 * @param showErrors - Se deve mostrar erros de validação
 */
export function Form({
  fields,
  schema,
  onSubmit,
  onCancel,
  title,
  description,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  className,
  defaultValues = {},
  showErrors = true,
}: FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Configurar react-hook-form com Zod resolver
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange', // Validação em tempo real
  });

  // Função para lidar com submit
  const handleFormSubmit = useCallback(async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      // Resetar formulário após sucesso
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setSubmitError(errorMessage);
      
      // Log detalhado para debugging
      console.error('Erro no submit do formulário:', {
        error,
        data,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, reset]);

  // Função para lidar com cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  }, [onCancel, reset]);

  // Resetar erro quando formulário muda
  useEffect(() => {
    if (isDirty) {
      setSubmitError(null);
    }
  }, [isDirty]);

  // Renderizar campo baseado no tipo
  const renderField = useCallback((field: FormField) => {
    const error = errors[field.name] as FieldError | undefined;
    const isRequired = field.required || field.validation;

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium text-neutral-300">
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>

        <Controller
          name={field.name}
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => {
            switch (field.type) {
              case 'textarea':
                return (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                    disabled={field.disabled || loading}
                    className={cn(
                      'bg-slate-700 border-slate-600 text-white placeholder:text-neutral-400',
                      error && 'border-red-500 focus:border-red-500',
                      field.className
                    )}
                  />
                );

              case 'select':
                return (
                  <select
                    id={field.name}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                    disabled={field.disabled || loading}
                    aria-label={field.label}
                    className={cn(
                      'w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      error && 'border-red-500 focus:ring-red-500',
                      field.className
                    )}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );

              default:
                return (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                    disabled={field.disabled || loading}
                    className={cn(
                      'bg-slate-700 border-slate-600 text-white placeholder:text-neutral-400',
                      error && 'border-red-500 focus:border-red-500',
                      field.className
                    )}
                  />
                );
            }
          }}
        />

        {/* Mostrar erro de validação */}
        {showErrors && error && (
          <p className="text-sm text-red-400">{error.message}</p>
        )}
      </div>
    );
  }, [control, errors, loading, showErrors]);

  return (
    <Card className={cn('tactical-card', className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-lg font-bold text-white">
              {title}
            </CardTitle>
          )}
          {description && (
            <p className="text-sm text-neutral-400">{description}</p>
          )}
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Campos do formulário */}
          <div className="space-y-4">
            {fields.map(renderField)}
          </div>

          {/* Erro de submit */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 border-slate-600 text-neutral-300 hover:bg-slate-700"
              >
                {cancelText}
              </Button>
            )}

            <Button
              type="submit"
              disabled={!isValid || isSubmitting || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <Loading size="sm" variant="spinner" />
              ) : (
                submitText
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Hook para usar formulários com validação
 * 
 * @param schema - Schema Zod para validação
 * @param defaultValues - Valores padrão
 * @returns Funções e estado do formulário
 */
export function useFormValidation<T extends z.ZodSchema<any>>(
  schema: T,
  defaultValues?: z.infer<T>
) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  const submitForm = useCallback(
    async (onSubmit: (data: z.infer<T>) => Promise<void>) => {
      return handleSubmit(async (data) => {
        try {
          await onSubmit(data);
          reset();
        } catch (error) {
          throw error;
        }
      })();
    },
    [handleSubmit, reset]
  );

  return {
    control,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    reset,
    setValue,
    watch,
    getValues,
    submitForm,
  };
}

/**
 * Componente de campo de formulário individual
 * 
 * Útil para casos onde você precisa de mais controle sobre campos específicos
 */
export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  options,
  validation,
  disabled,
  className,
  control,
  error,
}: FormField & {
  control: any;
  error?: FieldError;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-neutral-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          switch (type) {
            case 'textarea':
              return (
                <Textarea
                  id={name}
                  placeholder={placeholder}
                  value={value || ''}
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                  disabled={disabled}
                  className={cn(
                    'bg-slate-700 border-slate-600 text-white placeholder:text-neutral-400',
                    error && 'border-red-500 focus:border-red-500',
                    className
                  )}
                />
              );

            case 'select':
                             return (
                 <select
                   id={name}
                   value={value || ''}
                   onChange={onChange}
                   onBlur={onBlur}
                   ref={ref}
                   disabled={disabled}
                   aria-label={label}
                   className={cn(
                     'w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md',
                     'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                     error && 'border-red-500 focus:ring-red-500',
                     className
                   )}
                 >
                   <option value="">Selecione...</option>
                   {options?.map((option) => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
               );

            default:
              return (
                <Input
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  value={value || ''}
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                  disabled={disabled}
                  className={cn(
                    'bg-slate-700 border-slate-600 text-white placeholder:text-neutral-400',
                    error && 'border-red-500 focus:border-red-500',
                    className
                  )}
                />
              );
          }
        }}
      />

      {error && (
        <p className="text-sm text-red-400">{error.message}</p>
      )}
    </div>
  );
} 