"use client"

import { useState, useCallback } from "react"

const useErrorHandler = () => {
  const [error, setError] = useState(null)

  const handleError = useCallback((err) => {
    console.error("Error occurred:", err)

    // Extract meaningful error message
    let errorMessage = "An unexpected error occurred"

    if (typeof err === "string") {
      errorMessage = err
    } else if (err?.message) {
      errorMessage = err.message
    } else if (err?.response?.data?.message) {
      errorMessage = err.response.data.message
    }

    setError(errorMessage)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(
    (asyncFn) => {
      return async (...args) => {
        try {
          clearError()
          return await asyncFn(...args)
        } catch (err) {
          handleError(err)
          throw err
        }
      }
    },
    [handleError, clearError],
  )

  return {
    error,
    handleError,
    clearError,
    withErrorHandling,
  }
}

export { useErrorHandler }
export default useErrorHandler
