"use client"

import { useState, useEffect } from "react"
import Table from "../components/Table"
import materialService from "../services/materialService"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"

const MaterialCard = () => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState("")

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        setError("")

        const materialsData = await materialService.getMaterials()
        
        // Get only the first 4 materials for the dashboard
        const dashboardMaterials = materialsData.slice(0, 4)

        // Transform data for table display
        const tableData = dashboardMaterials.map((material) => ({
          material: material.material || material.name,
          amount: `${material.amount} ${material.amountType || material.unit || ''}`,
          id: material._id
        }))

        setMaterials(tableData)

        // Set last updated info
        if (materialsData.length > 0) {
          const latestUpdate = materialsData.reduce((latest, current) => {
            return new Date(current.updatedAt || current.updatedOn) > new Date(latest.updatedAt || latest.updatedOn) ? current : latest
          })
          const timeAgo = getTimeAgo(new Date(latestUpdate.updatedAt || latestUpdate.updatedOn))
          setLastUpdated(`Updated ${timeAgo}`)
        }
      } catch (error) {
        setError(error.message || "Failed to fetch materials")
        console.error("Error fetching materials:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const retryFetch = () => {
    setError("")
    setLoading(true)
    // Re-trigger useEffect
    window.location.reload()
  }

  if (loading) {
    return <LoadingSpinner size="md" message="Loading materials..." />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={retryFetch} />
  }

  return (
    <Table
      title="Material List"
      columns={["Materials", "Amount"]}
      data={materials}
      buttonLabel="View All"
      buttonRoute="/materials"
      upDateInfo={lastUpdated || "No recent updates"}
    />
  )
}

export default MaterialCard