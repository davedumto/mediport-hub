import { ConsentService } from "../../services/consentService";
import { GDPR_CONSENT_TEMPLATES } from "../../utils/constants";

describe("GDPR Consent Service", () => {
  describe("getDefaultDataProcessingConsent", () => {
    it("should return the default data processing consent template", () => {
      const consent = ConsentService.getDefaultDataProcessingConsent();

      expect(consent).toBeDefined();
      expect(consent.title).toBe("Data Processing Consent");
      expect(consent.version).toBe("1.0");
      expect(consent.legalBasis).toBe("CONSENT");
      expect(consent.text).toContain("GDPR Article 6(1)(a)");
    });
  });

  describe("getDefaultMedicalTreatmentConsent", () => {
    it("should return the default medical treatment consent template", () => {
      const consent = ConsentService.getDefaultMedicalTreatmentConsent();

      expect(consent).toBeDefined();
      expect(consent.title).toBe("Medical Treatment Consent");
      expect(consent.version).toBe("1.0");
      expect(consent.legalBasis).toBe("LEGAL_OBLIGATION");
      expect(consent.text).toContain("Article 9(2)(h)");
    });
  });

  describe("GDPR Consent Templates", () => {
    it("should have proper consent templates defined", () => {
      expect(GDPR_CONSENT_TEMPLATES.DATA_PROCESSING).toBeDefined();
      expect(GDPR_CONSENT_TEMPLATES.MEDICAL_TREATMENT).toBeDefined();

      expect(GDPR_CONSENT_TEMPLATES.DATA_PROCESSING.title).toBe(
        "Data Processing Consent"
      );
      expect(GDPR_CONSENT_TEMPLATES.MEDICAL_TREATMENT.title).toBe(
        "Medical Treatment Consent"
      );
    });

    it("should include required GDPR information in consent text", () => {
      const dataProcessingText = GDPR_CONSENT_TEMPLATES.DATA_PROCESSING.text;
      const medicalText = GDPR_CONSENT_TEMPLATES.MEDICAL_TREATMENT.text;

      // Check for GDPR compliance elements
      expect(dataProcessingText).toContain("GDPR Article 6(1)(a)");
      expect(dataProcessingText).toContain("withdraw this consent");
      expect(dataProcessingText).toContain("Privacy Policy");

      expect(medicalText).toContain("GDPR Article 6(1)(c)");
      expect(medicalText).toContain("Article 9(2)(h)");
      expect(medicalText).toContain("healthcare privacy standards");
    });
  });
});
