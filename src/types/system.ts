// System Settings Types
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: SystemSettingCategory;
  type: SystemSettingType;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystem: boolean;
  validation?: string;
  defaultValue?: string;
  options?: string[];
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettingCreate {
  key: string;
  value: string;
  description: string;
  category: SystemSettingCategory;
  type: SystemSettingType;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  isSystem?: boolean;
  validation?: string;
  defaultValue?: string;
  options?: string[];
  metadata?: Record<string, any>;
}

export interface SystemSettingUpdate {
  value?: string;
  description?: string;
  category?: SystemSettingCategory;
  type?: SystemSettingType;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  validation?: string;
  defaultValue?: string;
  options?: string[];
  metadata?: Record<string, any>;
}

export interface SystemSettingSearch {
  key?: string;
  category?: SystemSettingCategory;
  type?: SystemSettingType;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  isSystem?: boolean;
  search?: string;
}

// System Configuration
export interface SystemConfiguration {
  id: string;
  name: string;
  description: string;
  version: string;
  environment: string;
  isActive: boolean;
  settings: Record<string, any>;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfigurationCreate {
  name: string;
  description: string;
  version: string;
  environment: string;
  settings: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SystemConfigurationUpdate {
  name?: string;
  description?: string;
  version?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

// System Health and Monitoring
export interface SystemHealth {
  status: SystemStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  resources: ResourceHealth;
  performance: PerformanceMetrics;
  alerts: SystemAlert[];
  lastCheck: Date;
  nextCheck: Date;
}

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime: number;
  lastCheck: Date;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface ResourceHealth {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    transactionsPerSecond: number;
  };
  errorRate: number;
  availability: number;
}

export interface SystemAlert {
  id: string;
  type: SystemAlertType;
  severity: SystemAlertSeverity;
  message: string;
  component: string;
  timestamp: Date;
  isActive: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// System Maintenance
export interface SystemMaintenance {
  id: string;
  title: string;
  description: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  duration: number; // in minutes
  affectedServices: string[];
  impact: MaintenanceImpact;
  notifications: MaintenanceNotification[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMaintenanceCreate {
  title: string;
  description: string;
  type: MaintenanceType;
  scheduledStart: Date;
  scheduledEnd: Date;
  affectedServices: string[];
  impact: MaintenanceImpact;
  notifications: MaintenanceNotification[];
}

export interface SystemMaintenanceUpdate {
  title?: string;
  description?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  affectedServices?: string[];
  impact?: MaintenanceImpact;
  notifications?: MaintenanceNotification[];
}

export interface MaintenanceNotification {
  type: NotificationType;
  recipients: string[];
  message: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: NotificationStatus;
}

// System Backup and Recovery
export interface SystemBackup {
  id: string;
  name: string;
  description: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  location: string;
  checksum: string;
  encryptionKey?: string;
  compressionType?: string;
  retentionPolicy: RetentionPolicy;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // in minutes
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemBackupCreate {
  name: string;
  description: string;
  type: BackupType;
  location: string;
  retentionPolicy: RetentionPolicy;
  scheduledAt: Date;
  encryptionKey?: string;
  compressionType?: string;
  metadata?: Record<string, any>;
}

export interface SystemBackupUpdate {
  name?: string;
  description?: string;
  status?: BackupStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface RetentionPolicy {
  type: RetentionType;
  value: number;
  unit: RetentionUnit;
  action: RetentionAction;
}

// System Updates and Patches
export interface SystemUpdate {
  id: string;
  version: string;
  type: UpdateType;
  status: UpdateStatus;
  description: string;
  releaseNotes: string;
  changelog: string[];
  requirements: string[];
  compatibility: string[];
  size: number;
  downloadUrl: string;
  checksum: string;
  signature?: string;
  releaseDate: Date;
  scheduledInstallDate?: Date;
  installedAt?: Date;
  installedBy?: string;
  rollbackAvailable: boolean;
  rollbackVersion?: string;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemUpdateCreate {
  version: string;
  type: UpdateType;
  description: string;
  releaseNotes: string;
  changelog: string[];
  requirements: string[];
  compatibility: string[];
  size: number;
  downloadUrl: string;
  checksum: string;
  signature?: string;
  releaseDate: Date;
  rollbackAvailable?: boolean;
  rollbackVersion?: string;
  metadata?: Record<string, any>;
}

export interface SystemUpdateUpdate {
  status?: UpdateStatus;
  scheduledInstallDate?: Date;
  installedAt?: Date;
  installedBy?: string;
  metadata?: Record<string, any>;
}

// System Security
export interface SystemSecurity {
  id: string;
  category: SecurityCategory;
  setting: string;
  value: any;
  description: string;
  riskLevel: SecurityRiskLevel;
  compliance: string[];
  lastAudit: Date;
  nextAudit: Date;
  isCompliant: boolean;
  remediationRequired: boolean;
  remediationNotes?: string;
  assignedTo?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSecurityCreate {
  category: SecurityCategory;
  setting: string;
  value: any;
  description: string;
  riskLevel: SecurityRiskLevel;
  compliance: string[];
  lastAudit: Date;
  nextAudit: Date;
}

export interface SystemSecurityUpdate {
  value?: any;
  description?: string;
  riskLevel?: SecurityRiskLevel;
  compliance?: string[];
  lastAudit?: Date;
  nextAudit?: Date;
  isCompliant?: boolean;
  remediationRequired?: boolean;
  remediationNotes?: string;
  assignedTo?: string;
}

// Enums
export enum SystemSettingCategory {
  GENERAL = "GENERAL",
  SECURITY = "SECURITY",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  EMAIL = "EMAIL",
  STORAGE = "STORAGE",
  BACKUP = "BACKUP",
  MONITORING = "MONITORING",
  LOGGING = "LOGGING",
  INTEGRATION = "INTEGRATION",
  COMPLIANCE = "COMPLIANCE",
  OTHER = "OTHER",
}

export enum SystemSettingType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  JSON = "JSON",
  ENCRYPTED = "ENCRYPTED",
  FILE = "FILE",
  URL = "URL",
  EMAIL = "EMAIL",
  IP_ADDRESS = "IP_ADDRESS",
  DATE = "DATE",
  TIME = "TIME",
  DATETIME = "DATETIME",
  SELECT = "SELECT",
  MULTISELECT = "MULTISELECT",
  OTHER = "OTHER",
}

export enum SystemStatus {
  HEALTHY = "HEALTHY",
  DEGRADED = "DEGRADED",
  UNHEALTHY = "UNHEALTHY",
  MAINTENANCE = "MAINTENANCE",
  OFFLINE = "OFFLINE",
}

export enum ServiceStatus {
  HEALTHY = "HEALTHY",
  DEGRADED = "DEGRADED",
  UNHEALTHY = "UNHEALTHY",
  OFFLINE = "OFFLINE",
  UNKNOWN = "UNKNOWN",
}

export enum SystemAlertType {
  PERFORMANCE = "PERFORMANCE",
  SECURITY = "SECURITY",
  AVAILABILITY = "AVAILABILITY",
  CAPACITY = "CAPACITY",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  OTHER = "OTHER",
}

export enum SystemAlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum MaintenanceType {
  PLANNED = "PLANNED",
  EMERGENCY = "EMERGENCY",
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  UPGRADE = "UPGRADE",
  OTHER = "OTHER",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DELAYED = "DELAYED",
}

export enum MaintenanceImpact {
  NONE = "NONE",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum NotificationType {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  WEBHOOK = "WEBHOOK",
  SLACK = "SLACK",
  OTHER = "OTHER",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum BackupType {
  FULL = "FULL",
  INCREMENTAL = "INCREMENTAL",
  DIFFERENTIAL = "DIFFERENTIAL",
  SNAPSHOT = "SNAPSHOT",
  ARCHIVE = "ARCHIVE",
}

export enum BackupStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum RetentionType {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
  YEARS = "YEARS",
  FOREVER = "FOREVER",
}

export enum RetentionUnit {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export enum RetentionAction {
  DELETE = "DELETE",
  ARCHIVE = "ARCHIVE",
  MOVE = "MOVE",
  COMPRESS = "COMPRESS",
}

export enum UpdateType {
  SECURITY = "SECURITY",
  FEATURE = "FEATURE",
  BUGFIX = "BUGFIX",
  MAJOR = "MAJOR",
  MINOR = "MINOR",
  PATCH = "PATCH",
}

export enum UpdateStatus {
  AVAILABLE = "AVAILABLE",
  DOWNLOADING = "DOWNLOADING",
  DOWNLOADED = "DOWNLOADED",
  INSTALLING = "INSTALLING",
  INSTALLED = "INSTALLED",
  FAILED = "FAILED",
  ROLLED_BACK = "ROLLED_BACK",
}

export enum SecurityCategory {
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  ENCRYPTION = "ENCRYPTION",
  NETWORK = "NETWORK",
  ACCESS_CONTROL = "ACCESS_CONTROL",
  AUDIT = "AUDIT",
  COMPLIANCE = "COMPLIANCE",
  OTHER = "OTHER",
}

export enum SecurityRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
