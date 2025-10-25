import { useState } from "react"
import { authService } from "../services/authService"

const ConfirmPasswordModal = ({ isOpen, onClose, onSuccess, title = "Confirm Action" }) => {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      setLoading(true)
      await authService.verifyPassword(password)
      setPassword("")
      onSuccess && (await onSuccess())
      onClose && onClose()
    } catch (err) {
      setError(err.message || "Invalid password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>

        <h2 className="text-lg font-bold text-center mb-4">{title}</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">Enter your account password to continue.</p>

        {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3"
            placeholder="Password"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ConfirmPasswordModal
