import React, { useState, useEffect } from "react";

const EditSalaryForm = ({ isOpen, onClose, onSave, labourer }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    skill: "",
    salary: "",
    status: "",
  });

  useEffect(() => {
    if (labourer) {
      setFormData({
        id: labourer.id,
        name: labourer.name,
        phone: labourer.phone,
        skill: labourer.skill,
        salary: labourer.salary,
        status: labourer.status,
      });
    }
  }, [labourer, isOpen]);

  if (!isOpen || !labourer) return null;

  return <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-bold text-green-700 mb-4">
        Edit Salary
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}
        className="space-y-4"
      >
        <input
          type="text"
          name="id"
          placeholder="Labourer ID"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Contact No"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <select
          name="skill"
          value={formData.skill}
          onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="Skilled">Skilled</option>
          <option value="Non">Non</option>
        </select>
        <input
          type="number"
          name="salary"
          placeholder="Salary Amount"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <select
          name="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="Paid">Paid</option>
          <option value="Not Paid">Not Paid</option>
        </select>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>;
};

export default EditSalaryForm;
