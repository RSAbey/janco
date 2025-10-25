"use client"

const PaymentSlipViewer = ({ isOpen, onClose, paymentSlipUrl, description }) => {
  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
        >
          &times;
        </button>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-2">Payment Slip</h2>
          {description && <p className="text-gray-600 text-sm">{description}</p>}
        </div>

        <div className="flex justify-center">
          {paymentSlipUrl ? (
            <img
              src={paymentSlipUrl || "/placeholder.svg"}
              alt="Payment Slip"
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "block"
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">No payment slip available</p>
            </div>
          )}
          <div className="hidden flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Failed to load payment slip</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSlipViewer
