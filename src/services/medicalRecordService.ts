import { PIIProtectionService } from "./piiProtectionService";
import { AuditService } from "../lib/audit";
import prisma from "../lib/db";
import logger from "../lib/logger";
import { createHash } from "crypto";

export interface MedicalRecordData {
  patientId: string;
  providerId: string;
  type: string;
  title: string;
  recordDate: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  attachments?: any[];
  isPrivate?: boolean;
  status?: string;
}

export interface UpdateMedicalRecordData {
  title?: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  attachments?: any[];
  isPrivate?: boolean;
  status?: string;
}

export class MedicalRecordService {
  /**
   * Create a new medical record with proper encryption
   */
  static async createMedicalRecord(
    data: MedicalRecordData,
    userId: string,
    requestInfo: any
  ) {
    try {
      // Encrypt sensitive fields
      const encryptedFields: any = {};
      
      if (data.description) {
        const encrypted = PIIProtectionService.encryptField(data.description);
        encryptedFields.descriptionEncrypted = Buffer.from(
          JSON.stringify(encrypted),
          'utf8'
        );
      }
      
      if (data.findings) {
        const encrypted = PIIProtectionService.encryptField(data.findings);
        encryptedFields.findingsEncrypted = Buffer.from(
          JSON.stringify(encrypted),
          'utf8'
        );
      }
      
      if (data.recommendations) {
        const encrypted = PIIProtectionService.encryptField(data.recommendations);
        encryptedFields.recommendationsEncrypted = Buffer.from(
          JSON.stringify(encrypted),
          'utf8'
        );
      }
      
      if (data.diagnosis) {
        const encrypted = PIIProtectionService.encryptField(data.diagnosis);
        encryptedFields.diagnosisEncrypted = Buffer.from(
          JSON.stringify(encrypted),
          'utf8'
        );
      }
      
      if (data.treatmentPlan) {
        const encrypted = PIIProtectionService.encryptField(data.treatmentPlan);
        encryptedFields.treatmentPlanEncrypted = Buffer.from(
          JSON.stringify(encrypted),
          'utf8'
        );
      }

      // Create the medical record
      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId: data.patientId,
          providerId: data.providerId,
          type: data.type as any,
          title: data.title,
          recordDate: new Date(data.recordDate),
          descriptionEncrypted: encryptedFields.descriptionEncrypted,
          findingsEncrypted: encryptedFields.findingsEncrypted,
          recommendationsEncrypted: encryptedFields.recommendationsEncrypted,
          diagnosisEncrypted: encryptedFields.diagnosisEncrypted,
          treatmentPlanEncrypted: encryptedFields.treatmentPlanEncrypted,
          attachments: data.attachments || [],
          isPrivate: data.isPrivate || false,
          status: (data.status as any) || 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      });

      // Create audit trail
      await this.createAuditEntry(
        medicalRecord.id,
        userId,
        'CREATE',
        null,
        'Medical record created',
        requestInfo
      );

      // Log the action
      await AuditService.log({
        userId,
        action: 'MEDICAL_RECORD_CREATE',
        resource: 'medical_record',
        resourceId: medicalRecord.id,
        success: true,
        ...requestInfo,
      });

      return {
        ...medicalRecord,
        // Don't return encrypted fields in the response
        descriptionEncrypted: undefined,
        findingsEncrypted: undefined,
        recommendationsEncrypted: undefined,
        diagnosisEncrypted: undefined,
        treatmentPlanEncrypted: undefined,
      };
    } catch (error) {
      logger.error('Failed to create medical record:', error);
      throw error;
    }
  }

  /**
   * Update a medical record with proper encryption and audit trail
   */
  static async updateMedicalRecord(
    recordId: string,
    data: UpdateMedicalRecordData,
    userId: string,
    requestInfo: any
  ) {
    try {
      // Get the current record
      const currentRecord = await prisma.medicalRecord.findUnique({
        where: { id: recordId },
        include: {
          patient: true,
          provider: true,
        },
      });

      if (!currentRecord) {
        throw new Error('Medical record not found');
      }

      // Check permissions (doctor can only edit their own records)
      if (currentRecord.providerId !== userId) {
        throw new Error('Unauthorized to edit this medical record');
      }

      const updates: any = {};
      const changedFields: string[] = [];
      
      // Handle non-encrypted fields
      if (data.title && data.title !== currentRecord.title) {
        updates.title = data.title;
        changedFields.push('title');
      }
      
      if (data.isPrivate !== undefined && data.isPrivate !== currentRecord.isPrivate) {
        updates.isPrivate = data.isPrivate;
        changedFields.push('isPrivate');
      }
      
      if (data.status && data.status !== currentRecord.status) {
        updates.status = data.status;
        changedFields.push('status');
      }

      // Handle encrypted fields
      const encryptedUpdates = await this.handleEncryptedFieldUpdates(
        currentRecord,
        data,
        changedFields
      );
      
      Object.assign(updates, encryptedUpdates);

      if (Object.keys(updates).length === 0) {
        throw new Error('No changes detected');
      }

      // Increment version and set updatedBy
      updates.version = currentRecord.version + 1;
      updates.updatedBy = userId;

      // Update the record
      const updatedRecord = await prisma.medicalRecord.update({
        where: { id: recordId },
        data: updates,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      });

      // Create audit entries for each changed field
      for (const field of changedFields) {
        await this.createAuditEntry(
          recordId,
          userId,
          'UPDATE',
          field,
          `Updated ${field}`,
          requestInfo
        );
      }

      // Log the action
      await AuditService.log({
        userId,
        action: 'MEDICAL_RECORD_UPDATE',
        resource: 'medical_record',
        resourceId: recordId,
        success: true,
        changes: { fields: changedFields },
        ...requestInfo,
      });

      return {
        ...updatedRecord,
        // Don't return encrypted fields in the response
        descriptionEncrypted: undefined,
        findingsEncrypted: undefined,
        recommendationsEncrypted: undefined,
        diagnosisEncrypted: undefined,
        treatmentPlanEncrypted: undefined,
      };
    } catch (error) {
      logger.error('Failed to update medical record:', error);
      throw error;
    }
  }

  /**
   * Get decrypted medical record data for authorized users
   */
  static async getMedicalRecord(recordId: string, userId: string, userRole: string) {
    try {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: recordId },
        include: {
          patient: true,
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          auditTrail: {
            orderBy: { timestamp: 'desc' },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        throw new Error('Medical record not found');
      }

      // Check permissions
      const canAccess = 
        record.providerId === userId || // Provider who created it
        record.patient.userId === userId || // Patient themselves
        userRole === 'SUPER_ADMIN'; // Super admin

      if (!canAccess) {
        throw new Error('Unauthorized to access this medical record');
      }

      // Decrypt the fields if user has permission
      const decryptedData: any = {
        ...record,
        descriptionEncrypted: undefined,
        findingsEncrypted: undefined,
        recommendationsEncrypted: undefined,
        diagnosisEncrypted: undefined,
        treatmentPlanEncrypted: undefined,
      };

      try {
        if (record.descriptionEncrypted) {
          const encrypted = JSON.parse(record.descriptionEncrypted.toString());
          decryptedData.description = PIIProtectionService.decryptField(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.tag
          );
        }

        if (record.findingsEncrypted) {
          const encrypted = JSON.parse(record.findingsEncrypted.toString());
          decryptedData.findings = PIIProtectionService.decryptField(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.tag
          );
        }

        if (record.recommendationsEncrypted) {
          const encrypted = JSON.parse(record.recommendationsEncrypted.toString());
          decryptedData.recommendations = PIIProtectionService.decryptField(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.tag
          );
        }

        if (record.diagnosisEncrypted) {
          const encrypted = JSON.parse(record.diagnosisEncrypted.toString());
          decryptedData.diagnosis = PIIProtectionService.decryptField(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.tag
          );
        }

        if (record.treatmentPlanEncrypted) {
          const encrypted = JSON.parse(record.treatmentPlanEncrypted.toString());
          decryptedData.treatmentPlan = PIIProtectionService.decryptField(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.tag
          );
        }
      } catch (decryptionError) {
        logger.error('Failed to decrypt medical record data:', decryptionError);
        // Return without decrypted data if decryption fails
      }

      // Log the view action
      await this.createAuditEntry(
        recordId,
        userId,
        'VIEW',
        null,
        'Medical record viewed',
        {}
      );

      return decryptedData;
    } catch (error) {
      logger.error('Failed to get medical record:', error);
      throw error;
    }
  }

  /**
   * Get medical records for a patient (for patient dashboard)
   */
  static async getPatientMedicalRecords(patientId: string, userId: string, userRole: string, category?: string | null) {
    try {
      // Check permissions
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { 
          userId: true,
          assignedProviderId: true,
        },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      const canAccess = 
        patient.userId === userId || // Patient themselves
        patient.assignedProviderId === userId || // Assigned doctor
        userRole === 'SUPER_ADMIN'; // Super admin

      if (!canAccess) {
        throw new Error('Unauthorized to access patient medical records');
      }

      // Build where clause with category filtering
      let whereClause: any = {
        patientId,
        // Show all records to doctors, only published/approved to patients
        ...(userRole === 'DOCTOR' ? {} : { status: { in: ['PUBLISHED', 'APPROVED'] } }),
      };

      // Add category filtering - TEMPORARY DEBUG VERSION
      if (category === 'reports') {
        // Medical Reports: Only records with title containing "Report" (from medical report form)
        whereClause.title = { contains: "Report" };
      } else if (category === 'records') {
        // Medical Records: All records that don't contain "Report" in title
        whereClause.title = { not: { contains: "Report" } };
      }
      // If no category specified, show all records
      
      console.log(`[DEBUG] Filtering for category: ${category}, whereClause:`, JSON.stringify(whereClause, null, 2));

      const records = await prisma.medicalRecord.findMany({
        where: whereClause,
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
      });

      // Return records without encrypted data (patients see summary only)
      return records.map(record => ({
        id: record.id,
        type: record.type,
        title: record.title,
        recordDate: record.recordDate,
        provider: record.provider,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));
    } catch (error) {
      logger.error('Failed to get patient medical records:', error);
      throw error;
    }
  }

  /**
   * Get medical records for a doctor (their patients)
   */
  static async getDoctorMedicalRecords(doctorId: string) {
    try {
      const records = await prisma.medicalRecord.findMany({
        where: {
          providerId: doctorId,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
      });

      // Return records without encrypted data (summary view)
      return records.map(record => ({
        id: record.id,
        type: record.type,
        title: record.title,
        recordDate: record.recordDate,
        patient: record.patient,
        status: record.status,
        version: record.version,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));
    } catch (error) {
      logger.error('Failed to get doctor medical records:', error);
      throw error;
    }
  }

  /**
   * Create audit trail entry
   */
  private static async createAuditEntry(
    medicalRecordId: string,
    userId: string,
    action: string,
    fieldChanged: string | null,
    changeReason: string,
    requestInfo: any
  ) {
    try {
      await prisma.medicalRecordAudit.create({
        data: {
          medicalRecordId,
          userId,
          action,
          fieldChanged,
          changeReason,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit entry:', error);
      // Don't throw - audit failure shouldn't break the main operation
    }
  }

  /**
   * Handle encrypted field updates
   */
  private static async handleEncryptedFieldUpdates(
    currentRecord: any,
    data: UpdateMedicalRecordData,
    changedFields: string[]
  ) {
    const updates: any = {};

    const fieldsToCheck = [
      { key: 'description', encrypted: 'descriptionEncrypted' },
      { key: 'findings', encrypted: 'findingsEncrypted' },
      { key: 'recommendations', encrypted: 'recommendationsEncrypted' },
      { key: 'diagnosis', encrypted: 'diagnosisEncrypted' },
      { key: 'treatmentPlan', encrypted: 'treatmentPlanEncrypted' },
    ];

    for (const field of fieldsToCheck) {
      const newValue = (data as any)[field.key];
      
      if (newValue !== undefined) {
        // Decrypt current value to compare
        let currentValue = '';
        const currentEncrypted = currentRecord[field.encrypted];
        
        if (currentEncrypted) {
          try {
            const encrypted = JSON.parse(currentEncrypted.toString());
            currentValue = PIIProtectionService.decryptField(
              encrypted.encryptedData,
              encrypted.iv,
              encrypted.tag
            );
          } catch (error) {
            logger.error(`Failed to decrypt current ${field.key}:`, error);
          }
        }

        // Only update if value changed
        if (newValue !== currentValue) {
          if (newValue) {
            const encrypted = PIIProtectionService.encryptField(newValue);
            updates[field.encrypted] = Buffer.from(JSON.stringify(encrypted), 'utf8');
          } else {
            updates[field.encrypted] = null;
          }
          changedFields.push(field.key);
        }
      }
    }

    return updates;
  }

  /**
   * Create a hash for audit integrity
   */
  private static createValueHash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}