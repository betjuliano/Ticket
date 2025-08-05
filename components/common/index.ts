/**
 * Índice de Componentes Comuns
 * 
 * Este arquivo centraliza a exportação de todos os componentes comuns
 * do sistema, facilitando imports e organização.
 */

// Error Boundary
export { ErrorBoundary, useErrorHandler, withErrorBoundary } from './ErrorBoundary';

// Loading Components
export { 
  Loading, 
  Skeleton, 
  CardLoading, 
  ListLoading, 
  TableLoading 
} from './Loading';

// Modal Components
export { 
  Modal, 
  ModalWithActions, 
  useModal, 
  ConfirmModal, 
  InfoModal 
} from './Modal';

// Form Components
export { 
  Form, 
  FormField, 
  useFormValidation 
} from './Form';

// Re-export common UI components for convenience
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Label } from '@/components/ui/label';
export { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export { Alert, AlertDescription } from '@/components/ui/alert';
export { Badge } from '@/components/ui/badge';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Utility functions
export { cn } from '@/lib/utils'; 