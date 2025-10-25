import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";

const EditExpenseForm = ({ isOpen, onClose, onSave, expense }) => {
  
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    expense: "",
    expenseType:"",
    updatedOn: "",
  })

    useEffect(() => {
      if (expense) {
        setFormData({
          date: expense.date,
          description: expense.description,
          expense: expense.expense,
          expenseType: expense.expenseType,
          updatedOn: expense.updatedOn,
        });
      }
    }, [expense, isOpen]);

    if (!isOpen || !expense) return null;
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Edit Expense / Income</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
          className="space-y-4"
        >
          {/* select a Date input field    */}
          <div className="flex flex-col">
            <label>Date</label>
            <DatePicker
              selected={formData.date ? new Date(formData.date) : null}
              onChange={(date) =>
                setFormData({
                  ...formData,
                  date: date.toISOString().split("T")[0],
                })
              }
              dateFormat="yyyy-MM-dd"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            />
          </div>
          {/* Description input field    */}
          <input
            type="text"
            name="description"
            value={formData.description}
            placeholder="Description"
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          />
          {/* Enter expense Type input field    */}
          <select
            name="expenseType"
            value={formData.expenseType}
            onChange={(e) =>
              setFormData({ ...formData, expenseType: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
          >
            <option value="Income">Income</option>
            <option value="Outcome">Outcome</option>
          </select>
          {/* Enter Expense amount input field    */}
          <input
            type="text"
            name="expense"
            placeholder="Enter Amount"
            value={formData.expense}
            onChange={(e) =>
              setFormData({ ...formData, expense: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseForm;
