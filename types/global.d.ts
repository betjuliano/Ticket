// Global type definitions for the Ticket System

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: string;
      POSTGRES_DB: string;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      
      // Next.js & Auth
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      
      // Email
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASSWORD?: string;
      SMTP_FROM?: string;
      
      // AWS S3
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_REGION?: string;
      AWS_S3_BUCKET?: string;
      
      // Redis
      REDIS_URL?: string;
      REDIS_PASSWORD?: string;
      
      // Environment
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      
      // Monitoring
      SENTRY_DSN?: string;
      NEW_RELIC_LICENSE_KEY?: string;
      
      // External APIs
      EXTERNAL_API_URL?: string;
      EXTERNAL_API_KEY?: string;
      OPENAI_API_KEY?: string;
    }
  }
  
  // Extend Window interface for client-side globals
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
  
  // Custom utility types
  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {};
  
  type NonEmptyArray<T> = [T, ...T[]];
  
  type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  
  type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
  };
  
  // API Response types
  type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  
  type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  // Common ID types
  type ID = string | number;
  type UUID = string;
  
  // Date types
  type DateString = string; // ISO date string
  type Timestamp = number;
  
  // File types
  type FileUpload = {
    file: File;
    preview?: string;
    progress?: number;
    error?: string;
  };
  
  // Form types
  type FormState = 'idle' | 'loading' | 'success' | 'error';
  
  // Theme types
  type Theme = 'light' | 'dark' | 'system';
  
  // Status types
  type Status = 'active' | 'inactive' | 'pending' | 'suspended';
  
  // Priority types
  type Priority = 'low' | 'medium' | 'high' | 'urgent';
  
  // User role types
  type UserRole = 'admin' | 'user' | 'moderator' | 'guest';
  
  // Ticket status types
  type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  
  // Notification types
  type NotificationType = 'info' | 'success' | 'warning' | 'error';
  
  // Agent types
  type Agent = {
    id: string;
    name: string;
    status: 'active' | 'standby' | 'compromised' | 'training';
    location: string;
    lastSeen: string;
    missions: number;
    risk: 'low' | 'medium' | 'high' | 'critical';
  };
}

// Module augmentations
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

export {};

