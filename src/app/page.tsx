export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          MediPort Hub
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Secure healthcare platform with GDPR compliance
        </p>
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            <strong>API Endpoints:</strong>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• POST /api/auth/register/doctor</div>
            <div>• POST /api/auth/register/patient</div>
            <div>• POST /api/auth/login</div>
          </div>
        </div>
      </div>
    </div>
  );
}
