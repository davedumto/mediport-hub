"use client";

import React from "react";
import { usePIIDecryption } from "@/hooks/usePIIDecryption";
import { Patient } from "@/services/decryptionService";

interface PatientDisplayProps {
  patient: Patient;
}

export function PatientDisplay({ patient }: PatientDisplayProps) {
  const { decryptedData, isDecrypting, error } = usePIIDecryption(patient);

  if (isDecrypting) {
    return <div>Decrypting patient data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!decryptedData) {
    return <div>No patient data available</div>;
  }

  // Type assertion to ensure we have the right data structure
  const patientData = decryptedData as Patient & {
    phone?: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
    addressCountry?: string;
    emergencyName?: string;
    emergencyRelationship?: string;
    emergencyPhone?: string;
  };

  return (
    <div className="patient-display">
      <h2>
        {patientData.firstName} {patientData.lastName}
      </h2>

      {/* Non-encrypted fields - safe to display */}
      <p>Email: {patientData.email}</p>
      <p>Date of Birth: {patientData.dateOfBirth?.toString()}</p>
      <p>Gender: {patientData.gender}</p>

      {/* Decrypted PII fields */}
      {patientData.phone && <p>Phone: {patientData.phone}</p>}

      {patientData.addressStreet && (
        <div>
          <p>Address:</p>
          <p>{patientData.addressStreet}</p>
          <p>
            {patientData.addressCity}, {patientData.addressState}{" "}
            {patientData.addressZip}
          </p>
          <p>{patientData.addressCountry}</p>
        </div>
      )}

      {patientData.emergencyName && (
        <div>
          <p>Emergency Contact:</p>
          <p>
            {patientData.emergencyName} ({patientData.emergencyRelationship})
          </p>
          <p>Phone: {patientData.emergencyPhone}</p>
        </div>
      )}
    </div>
  );
}
