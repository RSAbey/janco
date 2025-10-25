import React, { useState } from 'react'


const EditConfirm = () => {
    const [labourers, setLabourers] = useState([]);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingEditLabor, setPendingEditLabor] = useState(null);
    //States for editing materials
    const [editingLabor, setEditingLabor] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    //Labor details editing function
    const handleEditLabor = (material) => {
        setPendingEditLabor(material);
        setIsDeleting(false);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = () => {
        const correctPassword = "admin123";

        if (passwordInput === correctPassword) {
            if (isDeleting) {
                handleDeleteLabor();
            } else {
                setEditingLabor(pendingEditLabor);
                setIsEditModalOpen(true);
            }

            // Close modal
            setIsPasswordModalOpen(false);
            setPasswordInput("");
            setPasswordError("");
        } else {
            setPasswordError("Incorrect password. Please try again.");
        }
    };

    const handleDeleteLabor = () => {
        const updatedLabors = labourers.filter(
            (lab) => lab.id !== pendingEditLabor.id
        );
        console.log(updatedLabors);
        setLabourers(updatedLabors);
        setPendingEditLabor(null);
        setIsPasswordModalOpen(false);
        setPasswordInput("");
        setPasswordError("");
    };
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                {isDeleting ? (<h2 className="text-xl font-bold mb-4 text-center">Enter Password to Delete</h2>)
                    : (<h2 className="text-xl font-bold mb-4 text-center">Enter Password to Edit</h2>)
                }
                <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password"
                    className="w-full p-2 border rounded mb-2"
                />
                {passwordError && (
                    <p className="text-sm text-red-600 mb-2">{passwordError}</p>
                )}
                <div className="flex justify-between space-x-3 mt-4">
                    <button
                        onClick={() => {
                            setIsPasswordModalOpen(false);
                            setPasswordInput("");
                            setPasswordError("");
                        }}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePasswordSubmit}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditConfirm
