import type {
  CompanyDetails as CompanyDetailsType,
  KeyPersonDetails,
} from '@/infrastructure/serverActions/getCompanyDetails.server.js'

interface CompanyDetailsProps {
  company: CompanyDetailsType | null
  keyPerson: KeyPersonDetails | null
  isLoading: boolean
  error: string | null
}

/**
 * Company Details presentational component.
 * Pure presentation component that receives all data and callbacks as props.
 * No business logic - follows DDD architecture View layer principles.
 */
export function CompanyDetails({ company, error, isLoading, keyPerson }: CompanyDetailsProps) {
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Company Details</h1>
        <p className="text-gray-600">Loading company details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Company Details</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!company || !keyPerson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Company Details</h1>
        <p className="text-gray-600">No company or key person data available.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Company Details</h1>

      {/* Company Information Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Company Information</h2>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Legal Name</h3>
            <p className="text-lg">{company.legalName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Display Name</h3>
            <p className="text-lg">{company.displayName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="text-lg">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  company.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : company.status === 'prospect'
                      ? 'bg-blue-100 text-blue-800'
                      : company.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                }`}
              >
                {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
              </span>
            </p>
          </div>

          {company.industry && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Industry</h3>
              <p className="text-lg">{company.industry}</p>
            </div>
          )}

          {company.companySize && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Company Size</h3>
              <p className="text-lg">{company.companySize} employees</p>
            </div>
          )}

          {company.websiteUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Website</h3>
              <p className="text-lg">
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {company.websiteUrl}
                </a>
              </p>
            </div>
          )}

          {company.billingCountry && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Billing Country</h3>
              <p className="text-lg">{company.billingCountry}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Timezone</h3>
            <p className="text-lg">{company.timezone}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="text-lg">{new Date(company.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="text-lg">{new Date(company.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Person Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Key Person Contact</h2>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Name</h3>
            <p className="text-lg">
              {keyPerson.firstName} {keyPerson.lastName}
            </p>
          </div>

          {keyPerson.email && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-lg">
                <a href={`mailto:${keyPerson.email}`} className="text-blue-600 hover:underline">
                  {keyPerson.email}
                </a>
              </p>
            </div>
          )}

          {keyPerson.phone && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="text-lg">
                <a href={`tel:${keyPerson.phone}`} className="text-blue-600 hover:underline">
                  {keyPerson.phone}
                </a>
              </p>
            </div>
          )}

          {keyPerson.jobTitle && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Job Title</h3>
              <p className="text-lg">{keyPerson.jobTitle}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="text-lg">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  keyPerson.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {keyPerson.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="text-lg">{new Date(keyPerson.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="text-lg">{new Date(keyPerson.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
