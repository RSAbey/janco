const VerticalProgressBar = ({ totalAmount = 0, completedAmount = 0 }) => {
  const progress = totalAmount > 0 ? Math.min(Math.max((completedAmount / totalAmount) * 100, 0), 100).toFixed(2) : 0

  return (
    <div className="h-full flex flex-col items-center justify-center gap-2">
      <div className="text-sm font-semibold text-gray-700">
        <div>Total: {totalAmount.toLocaleString()} LKR</div>
        <div className="text-green-600">Completed: {completedAmount.toLocaleString()} LKR</div>
      </div>
      <div className="relative h-full w-8 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute bottom-0 w-full bg-green-500 transition-all duration-300 flex items-center justify-center"
          style={{ height: `${progress}%` }}
        >
          <span
            className="text-[14px] text-white font-semibold rotate-[-180deg] whitespace-nowrap"
            style={{ writingMode: "vertical-lr" }}
          >
            {progress}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default VerticalProgressBar
