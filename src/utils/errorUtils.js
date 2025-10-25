// Utility functions for error handling

export const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return "An unexpected error occurred"
}

export const isNetworkError = (error) => {
  return (
    error?.code === "NETWORK_ERROR" || error?.message?.includes("Network Error") || error?.message?.includes("fetch")
  )
}

export const isAuthError = (error) => {
  return (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    error?.message?.includes("unauthorized") ||
    error?.message?.includes("forbidden")
  )
}

export const handleApiError = (error, customHandlers = {}) => {
  const errorMessage = getErrorMessage(error)

  if (isAuthError(error) && customHandlers.onAuthError) {
    customHandlers.onAuthError(error)
    return
  }

  if (isNetworkError(error) && customHandlers.onNetworkError) {
    customHandlers.onNetworkError(error)
    return
  }

  if (customHandlers.onGenericError) {
    customHandlers.onGenericError(errorMessage)
    return
  }

  console.error("Unhandled API error:", error)
  throw new Error(errorMessage)
}
