"use client"

import { useState, useEffect, useCallback } from "react"

const useAsync = (asyncFunction, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || "An error occurred")
      throw err
    } finally {
      setLoading(false)
    }
  }, dependencies)

  const retry = useCallback(() => {
    execute()
  }, [execute])

  useEffect(() => {
    execute()
  }, [execute])

  return {
    data,
    loading,
    error,
    execute,
    retry,
    setData,
    setError,
  }
}

export default useAsync
