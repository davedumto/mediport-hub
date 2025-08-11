// Audit Logging Types
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  changes?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  severity: AuditSeverity;
  category: AuditCategory;
  tags?: string[];
}

export interface AuditLogCreate {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  changes?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
  category?: AuditCategory;
  tags?: string[];
}

export interface AuditLogSearch {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  requestId?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  success?: boolean;
  severity?: AuditSeverity;
  category?: AuditCategory;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  search?: string;
}

// System Audit Events
export interface SystemAuditEvent {
  id: string;
  timestamp: Date;
  eventType: SystemEventType;
  component: string;
  severity: AuditSeverity;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface SystemAuditEventCreate {
  eventType: SystemEventType;
  component: string;
  severity: AuditSeverity;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface SystemAuditEventUpdate {
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  severity?: AuditSeverity;
  details?: Record<string, any>;
}

// Security Audit
export interface SecurityAudit {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  endpoint: string;
  method: string;
  success: boolean;
  threatLevel: ThreatLevel;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  blocked: boolean;
  blockReason?: string;
  investigationRequired: boolean;
  investigationStatus: InvestigationStatus;
  investigationNotes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditCreate {
  eventType: SecurityEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  endpoint: string;
  method: string;
  success: boolean;
  threatLevel: ThreatLevel;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  blocked?: boolean;
  blockReason?: string;
  investigationRequired?: boolean;
}

export interface SecurityAuditUpdate {
  threatLevel?: ThreatLevel;
  blocked?: boolean;
  blockReason?: string;
  investigationRequired?: boolean;
  investigationStatus?: InvestigationStatus;
  investigationNotes?: string;
  assignedTo?: string;
}

// Data Access Audit
export interface DataAccessAudit {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  patientId?: string;
  resourceType: string;
  resourceId?: string;
  action: DataAccessAction;
  accessLevel: AccessLevel;
  justification?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  endpoint: string;
  method: string;
  success: boolean;
  dataAccessed: string[];
  sensitiveDataAccessed: boolean;
  exportRequested: boolean;
  printRequested: boolean;
  metadata?: Record<string, any>;
}

export interface DataAccessAuditCreate {
  userId: string;
  userEmail: string;
  userRole: string;
  patientId?: string;
  resourceType: string;
  resourceId?: string;
  action: DataAccessAction;
  accessLevel: AccessLevel;
  justification?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  endpoint: string;
  method: string;
  success: boolean;
  dataAccessed: string[];
  sensitiveDataAccessed: boolean;
  exportRequested: boolean;
  printRequested: boolean;
  metadata?: Record<string, any>;
}

// Compliance Audit
export interface ComplianceAudit {
  id: string;
  timestamp: Date;
  auditType: ComplianceAuditType;
  scope: string;
  status: ComplianceStatus;
  findings: ComplianceFinding[];
  recommendations: string[];
  riskLevel: ComplianceRiskLevel;
  auditor: string;
  auditDate: Date;
  nextAuditDate: Date;
  complianceScore: number;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  remediationRequired: boolean;
  remediationDeadline?: Date;
  remediationNotes?: string;
  assignedTo?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ComplianceAuditCreate {
  auditType: ComplianceAuditType;
  scope: string;
  status?: ComplianceStatus;
  findings: Omit<ComplianceFinding, "id">[];
  recommendations: string[];
  riskLevel: ComplianceRiskLevel;
  auditor: string;
  auditDate: Date;
  nextAuditDate: Date;
  complianceScore: number;
  metadata?: Record<string, any>;
}

export interface ComplianceAuditUpdate {
  status?: ComplianceStatus;
  findings?: Omit<ComplianceFinding, "id">[];
  recommendations?: string[];
  riskLevel?: ComplianceRiskLevel;
  nextAuditDate?: Date;
  complianceScore?: number;
  metadata?: Record<string, any>;
}

// Audit Reports
export interface AuditReport {
  id: string;
  reportType: AuditReportType;
  title: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: Record<string, any>;
  generatedBy: string;
  generatedAt: Date;
  status: ReportStatus;
  downloadUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuditReportCreate {
  reportType: AuditReportType;
  title: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: Record<string, any>;
}

// Audit Statistics
export interface AuditStatistics {
  totalLogs: number;
  logsBySeverity: Record<AuditSeverity, number>;
  logsByCategory: Record<AuditCategory, number>;
  logsByAction: Record<AuditAction, number>;
  logsByUser: Record<string, number>;
  logsByResource: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  securityIncidents: number;
  complianceIssues: number;
  recentTrends: Array<{
    date: string;
    count: number;
    severity: AuditSeverity;
  }>;
}

// Enums
export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ASSIGN = "ASSIGN",
  TRANSFER = "TRANSFER",
  ARCHIVE = "ARCHIVE",
  RESTORE = "RESTORE",
  OTHER = "OTHER",
}

export enum AuditSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AuditCategory {
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  DATA_ACCESS = "DATA_ACCESS",
  DATA_MODIFICATION = "DATA_MODIFICATION",
  SYSTEM_OPERATIONS = "SYSTEM_OPERATIONS",
  SECURITY = "SECURITY",
  COMPLIANCE = "COMPLIANCE",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  CONFIGURATION = "CONFIGURATION",
  BACKUP_RESTORE = "BACKUP_RESTORE",
  OTHER = "OTHER",
}

export enum SystemEventType {
  SYSTEM_STARTUP = "SYSTEM_STARTUP",
  SYSTEM_SHUTDOWN = "SYSTEM_SHUTDOWN",
  SERVICE_START = "SERVICE_START",
  SERVICE_STOP = "SERVICE_STOP",
  CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
  BACKUP_COMPLETED = "BACKUP_COMPLETED",
  BACKUP_FAILED = "BACKUP_FAILED",
  RESTORE_COMPLETED = "RESTORE_COMPLETED",
  RESTORE_FAILED = "RESTORE_FAILED",
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
  PERFORMANCE_ALERT = "PERFORMANCE_ALERT",
  DISK_SPACE_ALERT = "DISK_SPACE_ALERT",
  MEMORY_ALERT = "MEMORY_ALERT",
  CPU_ALERT = "CPU_ALERT",
  NETWORK_ALERT = "NETWORK_ALERT",
  OTHER = "OTHER",
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = "LOGIN_ATTEMPT",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  ROLE_CHANGE = "ROLE_CHANGE",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  FILE_UPLOAD_ATTEMPT = "FILE_UPLOAD_ATTEMPT",
  API_ABUSE = "API_ABUSE",
  DATA_EXFILTRATION_ATTEMPT = "DATA_EXFILTRATION_ATTEMPT",
  OTHER = "OTHER",
}

export enum ThreatLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum InvestigationStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  ESCALATED = "ESCALATED",
}

export enum DataAccessAction {
  VIEW = "VIEW",
  SEARCH = "SEARCH",
  EXPORT = "EXPORT",
  PRINT = "PRINT",
  SHARE = "SHARE",
  DOWNLOAD = "DOWNLOAD",
  UPLOAD = "UPLOAD",
  OTHER = "OTHER",
}

export enum AccessLevel {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  CONFIDENTIAL = "CONFIDENTIAL",
  RESTRICTED = "RESTRICTED",
  CLASSIFIED = "CLASSIFIED",
}

export enum ComplianceAuditType {
  HIPAA = "HIPAA",
  GDPR = "GDPR",
  SOX = "SOX",
  PCI_DSS = "PCI_DSS",
  ISO_27001 = "ISO_27001",
  HITECH = "HITECH",
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
  OTHER = "OTHER",
}

export enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT",
  UNDER_REVIEW = "UNDER_REVIEW",
  PENDING_REMEDIATION = "PENDING_REMEDIATION",
  REMEDIATION_IN_PROGRESS = "REMEDIATION_IN_PROGRESS",
}

export enum ComplianceRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum FindingSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum FindingStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  VERIFIED = "VERIFIED",
}

export enum AuditReportType {
  SECURITY_AUDIT = "SECURITY_AUDIT",
  COMPLIANCE_AUDIT = "COMPLIANCE_AUDIT",
  DATA_ACCESS_AUDIT = "DATA_ACCESS_AUDIT",
  SYSTEM_AUDIT = "SYSTEM_AUDIT",
  USER_ACTIVITY = "USER_ACTIVITY",
  COMPREHENSIVE = "COMPREHENSIVE",
  CUSTOM = "CUSTOM",
}

export enum ReportStatus {
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}
