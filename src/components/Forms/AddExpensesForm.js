"use client"
import { Button } from "@mui/material"
import { green } from "@mui/material/colors"
import { useNavigate } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useState } from "react"
import projectService from "../../services/projectService"

const AddExpensesForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    date: new Date(),
    description: "",
    expenseType: "Outcome",
    amount: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const expenseData = {
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        category: formData.expenseType.toLowerCase(),
        date: formData.date,
        type: formData.expenseType.toLowerCase() === "income" ? "income" : "expense",
      }

      await projectService.createExpense(expenseData)

      // Reset form
      setFormData({
        date: new Date(),
        description: "",
        expenseType: "Outcome",
        amount: "",
      })

      alert("Expense added successfully!")
      navigate("/finance")
    } catch (error) {
      setError(error.message || "Failed to add expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full bg-white p-4 md:p-10 shadow-md rounded-md">
      <div className="flex justify-start items-center">
        <Button
          variant="outlined"
          style={{ color: green[900], borderColor: green[800] }}
          onClick={() => {
            navigate("/finance")
          }}
        >
          Back
        </Button>
      </div>

      <div className="flex justify-center items-center">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Labourer Registration</h2>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
        <div>
          <label className="block mb-1 text-sm font-medium">Select Expense Date</label>
          <DatePicker
            selected={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            placeholderText="Expense Date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            dateFormat="yyyy-MM-dd"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <input
            type="text"
            name="description"
            placeholder="Enter Description "
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
            disabled={loading}
          />
        </div>
        <div className="flex gap-2">
          <select
            name="expenseType"
            value={formData.expenseType}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            disabled={loading}
          >
            <option value="Income">Income</option>
            <option value="Outcome">Outcome</option>
          </select>
          <input
            type="number"
            name="amount"
            placeholder="Enter Amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
            disabled={loading}
          />
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddExpensesForm
