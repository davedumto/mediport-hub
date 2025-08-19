export const mockReports: MedicalReport[] = [
  {
    id: "#MR-0724",
    patient: { id: "1", name: "John Michael" },
    doctor: { id: "1", name: "Dr. Sarah Johnson" },
    date: "2024-08-14",
    subject: "Annual Check-up",
    status: "Reviewed",
    primaryDiagnosis: "Hypertension, Stage 1",
    reportDetails: `**Patient Examination Summary:**

Patient presented for annual physical examination. Blood pressure is 120/80 mmHg, heart rate is 72 bpm. Lungs are clear to auscultation. All lab results are within normal limits.

**Recommendations:**
• Continue current lifestyle and diet
• Follow up in one year
• Monitor blood pressure regularly

**Assessment:**
Patient is in good overall health with well-controlled hypertension. No immediate concerns noted.`,
    attachedFiles: [
      {
        id: "1",
        name: "blood_work_results.pdf",
        size: 245760,
        type: "application/pdf",
        url: "/files/blood_work_results.pdf",
      },
      {
        id: "2",
        name: "chest_xray.jpg",
        size: 1024000,
        type: "image/jpeg",
        url: "/files/chest_xray.jpg",
      },
    ],
  },
  {
    id: "#MR-0723",
    patient: { id: "2", name: "Sarah Smith" },
    doctor: { id: "2", name: "Dr. Michael Chen" },
    date: "2024-08-13",
    subject: "Post-Surgery Follow-up",
    status: "Submitted",
    primaryDiagnosis: "Post-operative care, Appendectomy",
    reportDetails: `**Post-Operative Assessment:**

Patient is *2 weeks post-appendectomy* and healing well. Incision sites are clean and dry with no signs of infection.

**Current Status:**
1. Pain levels manageable with prescribed medication
2. No fever or signs of complications
3. Patient ambulating well
4. Diet tolerance good

**Plan:**
• Continue current pain management
• Remove sutures in 1 week
• Return to normal activities gradually
• Follow-up in 2 weeks

**Instructions given to patient regarding activity restrictions and wound care.**`,
    attachedFiles: [
      {
        id: "3",
        name: "surgical_notes.pdf",
        size: 156789,
        type: "application/pdf",
        url: "/files/surgical_notes.pdf",
      },
      {
        id: "4",
        name: "incision_photos.jpg",
        size: 892341,
        type: "image/jpeg",
        url: "/files/incision_photos.jpg",
      },
    ],
  },
  {
    id: "#MR-0722",
    patient: { id: "3", name: "Robert Johnson" },
    doctor: { id: "1", name: "Dr. Sarah Johnson" },
    date: "2024-08-12",
    subject: "Diabetes Management Review",
    status: "Pending Review",
    primaryDiagnosis: "Type 2 Diabetes Mellitus",
    reportDetails: `**Diabetes Management Assessment:**

Patient with **Type 2 Diabetes** presents for routine follow-up. HbA1c level is 7.2%, showing improvement from previous 8.1%.

**Current Medications:**
• Metformin 1000mg twice daily
• Glipizide 5mg once daily

**Laboratory Results:**
• Fasting glucose: 126 mg/dL
• HbA1c: 7.2%
• Kidney function: Normal
• Lipid panel: Within target ranges

**Plan:**
1. Continue current medication regimen
2. Dietary consultation scheduled
3. Increase exercise as tolerated
4. Follow-up in 3 months

Patient education provided regarding **blood glucose monitoring** and dietary modifications.`,
    attachedFiles: [
      {
        id: "5",
        name: "lab_results_diabetes.pdf",
        size: 198432,
        type: "application/pdf",
        url: "/files/lab_results_diabetes.pdf",
      },
      {
        id: "6",
        name: "glucose_log.xlsx",
        size: 45678,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        url: "/files/glucose_log.xlsx",
      },
    ],
  },
  {
    id: "#MR-0721",
    patient: { id: "4", name: "Emily Davis" },
    doctor: { id: "3", name: "Dr. Emily Rodriguez" },
    date: "2024-08-11",
    subject: "Cardiology Consultation",
    status: "Reviewed",
    primaryDiagnosis: "Atrial Fibrillation, Chronic",
    reportDetails: `**Cardiology Consultation Report:**

Patient referred for **atrial fibrillation** evaluation. ECG shows persistent atrial fibrillation with controlled ventricular response.

**Assessment:**
• Heart rate: 78 bpm (controlled)
• Blood pressure: 132/84 mmHg
• No signs of heart failure
• Anticoagulation therapy effective

**Current Management:**
1. Warfarin 5mg daily (INR target 2-3)
2. Metoprolol 50mg twice daily
3. Regular INR monitoring

**Recommendations:**
• Continue current anticoagulation
• Consider rhythm control if symptoms worsen
• *Lifestyle modifications* discussed
• Follow-up in 6 months

Patient understands the importance of **medication compliance** and regular monitoring.`,
    attachedFiles: [
      {
        id: "7",
        name: "ecg_report.pdf",
        size: 134567,
        type: "application/pdf",
        url: "/files/ecg_report.pdf",
      },
      {
        id: "8",
        name: "echo_results.pdf",
        size: 267890,
        type: "application/pdf",
        url: "/files/echo_results.pdf",
      },
    ],
  },
  {
    id: "#MR-0720",
    patient: { id: "5", name: "James Wilson" },
    doctor: { id: "4", name: "Dr. James Wilson" },
    date: "2024-08-10",
    subject: "Orthopedic Evaluation",
    status: "Draft",
    primaryDiagnosis: "Osteoarthritis, Right Knee",
    reportDetails: `**Orthopedic Assessment:**

Patient presents with **right knee pain** persisting for 6 months. Physical examination reveals:

**Physical Findings:**
• Limited range of motion
• Crepitus present
• Mild swelling
• Tenderness over medial joint line

**Imaging Results:**
X-ray shows moderate degenerative changes consistent with osteoarthritis.

**Treatment Plan:**
1. Physical therapy referral
2. NSAIDs for pain management
3. Weight loss counseling
4. Consider corticosteroid injection if conservative treatment fails

**Follow-up:** 
Return in *6 weeks* to assess response to conservative management.`,
    attachedFiles: [
      {
        id: "9",
        name: "knee_xray.jpg",
        size: 756234,
        type: "image/jpeg",
        url: "/files/knee_xray.jpg",
      },
    ],
  },
  {
    id: "#MR-0719",
    patient: { id: "6", name: "Maria Garcia" },
    doctor: { id: "2", name: "Dr. Michael Chen" },
    date: "2024-08-09",
    subject: "Pregnancy Check-up",
    status: "Reviewed",
    primaryDiagnosis: "Pregnancy, 28 weeks gestation",
    reportDetails: `**Prenatal Visit - 28 Weeks:**

Patient presents for routine **prenatal care** at 28 weeks gestation. Pregnancy progressing normally.

**Vital Signs:**
• Blood pressure: 118/74 mmHg
• Weight gain: 18 lbs (appropriate)
• Fundal height: 28 cm
• Fetal heart rate: 142 bpm

**Laboratory Results:**
• Glucose screening: Normal
• Hemoglobin: 11.8 g/dL
• Urinalysis: Negative

**Plan:**
1. Continue prenatal vitamins
2. Glucose tolerance test completed
3. Begin weekly visits at 36 weeks
4. *Childbirth education* classes recommended

Patient counseled on **warning signs** and when to contact the office. Next appointment scheduled in 2 weeks.`,
    attachedFiles: [
      {
        id: "10",
        name: "ultrasound_28weeks.jpg",
        size: 634521,
        type: "image/jpeg",
        url: "/files/ultrasound_28weeks.jpg",
      },
      {
        id: "11",
        name: "prenatal_labs.pdf",
        size: 123456,
        type: "application/pdf",
        url: "/files/prenatal_labs.pdf",
      },
    ],
  },
  {
    id: "#MR-0718",
    patient: { id: "7", name: "David Brown" },
    doctor: { id: "1", name: "Dr. Sarah Johnson" },
    date: "2024-08-08",
    subject: "Mental Health Assessment",
    status: "Submitted",
    primaryDiagnosis: "Major Depressive Disorder, Moderate",
    reportDetails: `**Mental Health Evaluation:**

Patient presents with symptoms of **depression** lasting 4 months. PHQ-9 score: 14 (moderate depression).

**Current Symptoms:**
• Persistent sad mood
• Loss of interest in activities
• Sleep disturbances
• Fatigue and low energy
• Difficulty concentrating

**Assessment:**
Patient meets criteria for *Major Depressive Disorder, moderate severity*.

**Treatment Plan:**
1. Initiate SSRI therapy (Sertraline 50mg daily)
2. Cognitive behavioral therapy referral
3. Lifestyle interventions discussed
4. Safety assessment completed - no suicidal ideation

**Follow-up:** 
Return in **2 weeks** to monitor medication response and side effects.`,
    attachedFiles: [
      {
        id: "12",
        name: "phq9_assessment.pdf",
        size: 87654,
        type: "application/pdf",
        url: "/files/phq9_assessment.pdf",
      },
    ],
  },
  {
    id: "#MR-0717",
    patient: { id: "8", name: "Lisa Anderson" },
    doctor: { id: "3", name: "Dr. Emily Rodriguez" },
    date: "2024-08-07",
    subject: "Dermatology Consultation",
    status: "Pending Review",
    primaryDiagnosis: "Atopic Dermatitis",
    reportDetails: `**Dermatological Assessment:**

Patient with history of **atopic dermatitis** presents with flare-up affecting bilateral arms and legs.

**Physical Examination:**
• Erythematous, scaly patches
• No signs of secondary infection
• Xerosis present
• Mild lichenification

**Current Management:**
• Topical corticosteroids (Triamcinolone 0.1%)
• Moisturizer application twice daily
• Antihistamine for pruritus

**Recommendations:**
1. Continue current treatment regimen
2. *Avoid known triggers* (fragranced products, wool)
3. Use fragrance-free skincare products
4. Consider referral to allergist if no improvement

Patient educated on **proper application** of topical medications and trigger avoidance.`,
    attachedFiles: [
      {
        id: "13",
        name: "skin_photos.jpg",
        size: 445678,
        type: "image/jpeg",
        url: "/files/skin_photos.jpg",
      },
    ],
  },
];

export const getMockPatients = () => {
  return Array.from(
    new Set(mockReports.map((report) => report.patient.name))
  ).sort();
};

export const getMockDoctors = () => {
  return [
    "All Doctors",
    ...Array.from(
      new Set(mockReports.map((report) => report.doctor.name))
    ).sort(),
  ];
};

export const getMockReportById = (id: string) => {
  return mockReports.find((report) => report.id === id);
};

export const filterReports = (reports: MedicalReport[], filters: any) => {
  return reports.filter((report) => {
    const matchesPatientSearch =
      !filters.patientSearch ||
      report.patient.name
        .toLowerCase()
        .includes(filters.patientSearch.toLowerCase()) ||
      report.id.toLowerCase().includes(filters.patientSearch.toLowerCase());

    const matchesDoctor =
      !filters.doctorFilter ||
      filters.doctorFilter === "All Doctors" ||
      report.doctor.name === filters.doctorFilter;

    const matchesDateFrom =
      !filters.dateFrom || new Date(report.date) >= new Date(filters.dateFrom);

    const matchesDateTo =
      !filters.dateTo || new Date(report.date) <= new Date(filters.dateTo);

    return (
      matchesPatientSearch && matchesDoctor && matchesDateFrom && matchesDateTo
    );
  });
};
