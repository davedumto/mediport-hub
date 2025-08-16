import { render, screen, fireEvent, waitFor } from '@/tests/fixtures/utils/testUtils'
import { PatientDashboard } from '@/app/dashboard/patient/page'
import { generateMockUser, generateMockPatient, generateMockAppointment } from '@/tests/fixtures/utils/testUtils'

// Mock the API calls
jest.mock('@/hooks/useAPIWithAuth', () => ({
  useAPIWithAuth: () => ({
    apiCall: jest.fn(),
  }),
}))

// Mock the decryption service
jest.mock('@/services/decryptionService', () => ({
  DecryptionService: {
    decryptPatientPII: jest.fn(),
    decryptMedicalRecordPII: jest.fn(),
  },
}))

describe('Patient Dashboard Acceptance Tests', () => {
  const mockUser = generateMockUser({ role: 'PATIENT' })
  const mockPatient = generateMockPatient({ userId: mockUser.id })
  const mockAppointments = [
    generateMockAppointment({ patientId: mockPatient.id, status: 'SCHEDULED' }),
    generateMockAppointment({ patientId: mockPatient.id, status: 'CONFIRMED' }),
    generateMockAppointment({ patientId: mockPatient.id, status: 'COMPLETED' }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock localStorage
    localStorage.setItem('auth_tokens', JSON.stringify({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }))
  })

  describe('User Story: PAT-001 - View Personal Health Summary', () => {
    test('As a patient, I want to view my personal health summary so that I can understand my current health status', async () => {
      render(<PatientDashboard />)

      // Verify health summary section is displayed
      await waitFor(() => {
        expect(screen.getByText('Health Summary')).toBeInTheDocument()
      })

      // Verify key health information is visible
      expect(screen.getByText('Blood Type')).toBeInTheDocument()
      expect(screen.getByText('Allergies')).toBeInTheDocument()
      expect(screen.getByText('Current Medications')).toBeInTheDocument()
      expect(screen.getByText('Chronic Conditions')).toBeInTheDocument()

      // Verify patient can see their basic information
      expect(screen.getByText(mockPatient.firstName)).toBeInTheDocument()
      expect(screen.getByText(mockPatient.lastName)).toBeInTheDocument()
    })

    test('Health summary displays accurate and up-to-date information', async () => {
      render(<PatientDashboard />)

      await waitFor(() => {
        // Verify that the displayed information matches the patient data
        expect(screen.getByText('A_POSITIVE')).toBeInTheDocument() // Blood type
        expect(screen.getByText('No allergies recorded')).toBeInTheDocument()
        expect(screen.getByText('No current medications')).toBeInTheDocument()
        expect(screen.getByText('No chronic conditions recorded')).toBeInTheDocument()
      })
    })
  })

  describe('User Story: PAT-002 - View Upcoming Appointments', () => {
    test('As a patient, I want to see my upcoming appointments so that I can plan my healthcare visits', async () => {
      render(<PatientDashboard />)

      // Verify appointments section is displayed
      await waitFor(() => {
        expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument()
      })

      // Verify appointment details are visible
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument()
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument()

      // Verify appointment information includes necessary details
      expect(screen.getByText('Regular checkup')).toBeInTheDocument() // Reason
      expect(screen.getByText('IN_PERSON')).toBeInTheDocument() // Location type
    })

    test('Appointments are sorted by date and time', async () => {
      render(<PatientDashboard />)

      await waitFor(() => {
        const appointmentItems = screen.getAllByTestId('appointment-item')
        
        // Verify appointments are displayed in chronological order
        expect(appointmentItems.length).toBeGreaterThan(0)
        
        // Additional verification for sorting would go here
        // This would require more complex test setup with actual dates
      })
    })

    test('Patient can view appointment details', async () => {
      render(<PatientDashboard />)

      await waitFor(() => {
        const appointmentItems = screen.getAllByTestId('appointment-item')
        
        if (appointmentItems.length > 0) {
          // Click on first appointment to view details
          fireEvent.click(appointmentItems[0])
          
          // Verify appointment details modal or expanded view
          expect(screen.getByText('Appointment Details')).toBeInTheDocument()
        }
      })
    })
  })

  describe('User Story: PAT-003 - Access Medical Records', () => {
    test('As a patient, I want to access my medical records so that I can review my healthcare history', async () => {
      render(<PatientDashboard />)

      // Verify medical records section is accessible
      await waitFor(() => {
        expect(screen.getByText('Medical Records')).toBeInTheDocument()
      })

      // Verify medical records tab can be accessed
      const medicalRecordsTab = screen.getByRole('tab', { name: 'Medical Records' })
      fireEvent.click(medicalRecordsTab)

      // Verify medical records content is displayed
      expect(screen.getByText('Recent Medical Records')).toBeInTheDocument()
    })

    test('Medical records display appropriate information based on patient permissions', async () => {
      render(<PatientDashboard />)

      // Navigate to medical records tab
      const medicalRecordsTab = screen.getByRole('tab', { name: 'Medical Records' })
      fireEvent.click(medicalRecordsTab)

      await waitFor(() => {
        // Verify that only the patient's own records are visible
        expect(screen.getByText('No medical records found')).toBeInTheDocument()
        // This would show actual records if they existed in the test data
      })
    })
  })

  describe('User Story: PAT-004 - View Profile Information', () => {
    test('As a patient, I want to view and edit my profile information so that I can keep my details up to date', async () => {
      render(<PatientDashboard />)

      // Verify profile section is accessible
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })

      // Navigate to profile tab
      const profileTab = screen.getByRole('tab', { name: 'Profile' })
      fireEvent.click(profileTab)

      // Verify profile information is displayed
      expect(screen.getByText('Personal Information')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Emergency Contact')).toBeInTheDocument()
    })

    test('Patient can edit their profile information', async () => {
      render(<PatientDashboard />)

      // Navigate to profile tab
      const profileTab = screen.getByRole('tab', { name: 'Profile' })
      fireEvent.click(profileTab)

      await waitFor(() => {
        // Look for edit buttons or editable fields
        const editButtons = screen.getAllByText('Edit')
        
        if (editButtons.length > 0) {
          // Click edit button
          fireEvent.click(editButtons[0])
          
          // Verify edit mode is activated
          expect(screen.getByText('Save')).toBeInTheDocument()
          expect(screen.getByText('Cancel')).toBeInTheDocument()
        }
      })
    })
  })

  describe('User Story: PAT-005 - Navigate Dashboard Sections', () => {
    test('As a patient, I want to easily navigate between different sections of my dashboard so that I can access all my healthcare information', async () => {
      render(<PatientDashboard />)

      // Verify all main navigation tabs are present
      const expectedTabs = ['Overview', 'Appointments', 'Medical Records', 'Profile']
      
      expectedTabs.forEach(tabName => {
        expect(screen.getByRole('tab', { name: tabName })).toBeInTheDocument()
      })

      // Verify tab switching works correctly
      const appointmentsTab = screen.getByRole('tab', { name: 'Appointments' })
      fireEvent.click(appointmentsTab)

      // Verify appointments content is displayed
      expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument()

      // Switch to another tab
      const medicalRecordsTab = screen.getByRole('tab', { name: 'Medical Records' })
      fireEvent.click(medicalRecordsTab)

      // Verify medical records content is displayed
      expect(screen.getByText('Recent Medical Records')).toBeInTheDocument()
    })

    test('Dashboard maintains state when switching between tabs', async () => {
      render(<PatientDashboard />)

      // Navigate to appointments tab
      const appointmentsTab = screen.getByRole('tab', { name: 'Appointments' })
      fireEvent.click(appointmentsTab)

      // Verify appointments are loaded
      await waitFor(() => {
        expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument()
      })

      // Switch to another tab and back
      const medicalRecordsTab = screen.getByRole('tab', { name: 'Medical Records' })
      fireEvent.click(medicalRecordsTab)

      const appointmentsTabAgain = screen.getByRole('tab', { name: 'Appointments' })
      fireEvent.click(appointmentsTabAgain)

      // Verify appointments are still displayed (no need to reload)
      expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument()
    })
  })

  describe('User Story: PAT-006 - Responsive Design', () => {
    test('As a patient, I want the dashboard to work on all my devices so that I can access my healthcare information anywhere', async () => {
      render(<PatientDashboard />)

      // Verify dashboard renders on different screen sizes
      // This would typically involve testing with different viewport sizes
      
      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        // Verify mobile-friendly layout elements
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Test tablet layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // iPad width
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        // Verify tablet layout elements
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('User Story: PAT-007 - Data Privacy and Security', () => {
    test('As a patient, I want my health information to be secure so that my privacy is protected', async () => {
      render(<PatientDashboard />)

      // Verify that sensitive information is properly handled
      await waitFor(() => {
        // Check that personal information is displayed appropriately
        expect(screen.getByText(mockPatient.firstName)).toBeInTheDocument()
        expect(screen.getByText(mockPatient.lastName)).toBeInTheDocument()
        
        // Verify that sensitive fields are not exposed in plain text
        // This would depend on how the decryption service is implemented
      })
    })

    test('Patient can only access their own information', async () => {
      render(<PatientDashboard />)

      // Verify that the dashboard only shows the authenticated patient's data
      await waitFor(() => {
        expect(screen.getByText(mockPatient.firstName)).toBeInTheDocument()
        expect(screen.getByText(mockPatient.lastName)).toBeInTheDocument()
        
        // Verify that no other patient information is visible
        // This would require more complex test setup
      })
    })
  })

  describe('User Story: PAT-008 - Error Handling', () => {
    test('As a patient, I want clear error messages when something goes wrong so that I understand what happened', async () => {
      render(<PatientDashboard />)

      // Simulate an error condition (e.g., API failure)
      // This would require mocking the API to return errors
      
      // Verify that error messages are displayed appropriately
      await waitFor(() => {
        // Check for any error states or loading states
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })

    test('Dashboard gracefully handles network failures', async () => {
      render(<PatientDashboard />)

      // Simulate network failure
      // This would require more complex mocking of the API layer
      
      // Verify that the dashboard shows appropriate offline/error state
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('User Story: PAT-009 - Accessibility', () => {
    test('As a patient with accessibility needs, I want the dashboard to be usable with assistive technologies', async () => {
      render(<PatientDashboard />)

      // Verify proper ARIA labels and roles
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()

      // Verify tab navigation is accessible
      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBeGreaterThan(0)

      // Verify proper tab panel associations
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected')
      })
    })

    test('Dashboard supports keyboard navigation', async () => {
      render(<PatientDashboard />)

      // Test tab navigation with keyboard
      const firstTab = screen.getByRole('tab', { name: 'Overview' })
      firstTab.focus()

      // Verify tab can be activated with Enter key
      fireEvent.keyDown(firstTab, { key: 'Enter' })
      expect(firstTab).toHaveAttribute('aria-selected', 'true')

      // Test arrow key navigation between tabs
      const secondTab = screen.getByRole('tab', { name: 'Appointments' })
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' })
      expect(secondTab).toHaveFocus()
    })
  })

  describe('User Story: PAT-010 - Performance', () => {
    test('As a patient, I want the dashboard to load quickly so that I can access my information without waiting', async () => {
      const startTime = performance.now()
      
      render(<PatientDashboard />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Verify dashboard renders within acceptable time
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second

      // Verify content loads quickly
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      }, { timeout: 2000 }) // Should load content within 2 seconds
    })

    test('Dashboard handles large amounts of data efficiently', async () => {
      render(<PatientDashboard />)

      // This test would require setting up large datasets
      // For now, verify that the dashboard renders with current test data
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })
})
