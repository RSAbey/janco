import React, { useState, useEffect } from 'react'
import Table from '../components/Table'
import supplierService from '../services/supplierService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const SupplierTable = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        setError('')
        
        const suppliersData = await supplierService.getSuppliers()
        
        // Get only the first 4 suppliers for the dashboard
        const dashboardSuppliers = suppliersData.slice(0, 4)
        
        const tableData = dashboardSuppliers.map(supplier => ({
          company: supplier.name || supplier.companyName,
          location: `${supplier.address?.city || ''}, ${supplier.address?.state || ''}`.trim() || 'Location not specified',
          phone: supplier.contactInfo?.primaryContact?.phone || supplier.contactInfo?.primaryContact?.mobile || 'No phone',
          id: supplier._id
        }))

        setSuppliers(tableData)
      } catch (err) {
        setError(err.message || 'Failed to fetch suppliers')
        console.error('Error fetching suppliers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  const retryFetch = () => {
    setError('')
    setLoading(true)
    window.location.reload()
  }

  if (loading) {
    return <LoadingSpinner size="md" message="Loading suppliers..." />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={retryFetch} />
  }

  return (
    <Table 
      title="Suppliers" 
      columns={["Supplier Company", "Location", "Phone Number"]} 
      data={suppliers}
      buttonLabel="View All"
      buttonRoute="/suppliers"    
    />
  )
}

export default SupplierTable