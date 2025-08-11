// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  search: {
    query: string;
    filters: Record<string, any>;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
}

// Common API Patterns
export interface CreateResponse {
  id: string;
  createdAt: string;
  createdBy: string;
}

export interface UpdateResponse {
  id: string;
  updatedAt: string;
  updatedBy: string;
  changes: Record<string, any>;
}

export interface DeleteResponse {
  id: string;
  deletedAt: string;
  deletedBy: string;
  softDelete: boolean;
}

// Bulk Operations
export interface BulkOperationRequest<T> {
  operations: Array<{
    action: "create" | "update" | "delete";
    data?: T;
    id?: string;
  }>;
  options?: {
    validateOnly?: boolean;
    skipValidation?: boolean;
    transaction?: boolean;
  };
}

export interface BulkOperationResponse {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    id?: string;
    error?: string;
  }>;
}

// File Upload
export interface FileUploadRequest {
  file: File;
  category:
    | "medical_record"
    | "consent_form"
    | "id_document"
    | "prescription"
    | "other";
  patientId?: string;
  description?: string;
  tags?: string[];
  accessLevel: "public" | "private" | "restricted";
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  metadata: {
    category: string;
    patientId?: string;
    description?: string;
    tags?: string[];
    accessLevel: string;
  };
}

// Health Check
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: "healthy" | "degraded" | "unhealthy";
      responseTime: number;
      lastCheck: string;
    };
    encryption: {
      status: "healthy" | "degraded" | "unhealthy";
      algorithm: string;
      keySize: number;
    };
    logging: {
      status: "healthy" | "degraded" | "unhealthy";
      level: string;
      transports: string[];
    };
  };
  version: string;
  environment: string;
}

// Audit and Monitoring
export interface AuditLogResponse {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export interface SystemMetricsResponse {
  timestamp: string;
  metrics: {
    users: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    patients: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    appointments: {
      total: number;
      scheduled: number;
      completed: number;
      cancelled: number;
      today: number;
    };
    medicalRecords: {
      total: number;
      thisMonth: number;
      thisYear: number;
    };
    system: {
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
  };
}

// Export and Import
export interface ExportRequest {
  entityType:
    | "users"
    | "patients"
    | "medical_records"
    | "appointments"
    | "consultations";
  format: "json" | "csv" | "xml";
  filters?: Record<string, any>;
  fields?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeDeleted?: boolean;
}

export interface ExportResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  expiresAt: string;
  recordCount: number;
  fileSize?: number;
  createdAt: string;
}

export interface ImportRequest {
  entityType:
    | "users"
    | "patients"
    | "medical_records"
    | "appointments"
    | "consultations";
  file: File;
  options: {
    validateOnly?: boolean;
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    mapping?: Record<string, string>;
  };
}

export interface ImportResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    current: number;
  };
  results?: {
    summary: {
      total: number;
      created: number;
      updated: number;
      skipped: number;
      errors: number;
    };
    errors: Array<{
      row: number;
      field: string;
      message: string;
      value?: any;
    }>;
  };
  createdAt: string;
  completedAt?: string;
}

// Webhook and Integration
export interface WebhookRequest {
  url: string;
  events: string[];
  secret: string;
  headers?: Record<string, string>;
  retryCount?: number;
  timeout?: number;
  active: boolean;
}

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive" | "error";
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  status: "pending" | "delivered" | "failed";
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  nextRetry?: string;
  deliveredAt?: string;
  createdAt: string;
}

// Rate Limiting
export interface RateLimitResponse {
  limit: number;
  remaining: number;
  reset: string;
  retryAfter?: number;
}

// API Versioning
export interface ApiVersionInfo {
  version: string;
  status: "stable" | "beta" | "deprecated";
  releaseDate: string;
  endOfLife?: string;
  changes: Array<{
    type: "added" | "changed" | "deprecated" | "removed";
    description: string;
    breaking: boolean;
  }>;
  documentation: string;
}

// Error Response Details
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
    timestamp: string;
    requestId: string;
    path: string;
    method: string;
  };
}

// Success Response Details
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Generic CRUD Operations
export interface CrudOperations<T, CreateInput, UpdateInput> {
  create(data: CreateInput): Promise<CreateResponse>;
  findById(id: string): Promise<T>;
  findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResponse<T>>;
  update(id: string, data: UpdateInput): Promise<UpdateResponse>;
  delete(id: string, softDelete?: boolean): Promise<DeleteResponse>;
  bulk(
    operations: BulkOperationRequest<CreateInput | UpdateInput>
  ): Promise<BulkOperationResponse>;
}
