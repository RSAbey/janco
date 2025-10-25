"use client"

import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import mockInvoices from "./mockData"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Button } from "@mui/material"
import { green, grey } from "@mui/material/colors"
import { Download, Edit } from "@mui/icons-material"
import AddInvoceMaterials from "./AddInvoceMaterials"

const SupplierInvoice = () => {
  const { id } = useParams()
  const invoice = mockInvoices.find((inv) => inv.id === id)
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [invoiceMaterials, setInvoiceMaterial] = useState([])
  const [isEditing, setIsEditing] = useState(false) // toggle editing
  const [isBillEditing, setIsBillEditing] = useState(false)
  const [payment, setPayment] = useState(0) // payment input value

  const [editableInvoice, setEditableInvoice] = useState({
    supplier: invoice.supplier,
    supplierAddress: invoice.supplierAddress,
    billDate: invoice.billDate,
    deliveryDate: invoice.deliveryDate,
    billingAddress: invoice.billingAddress,
  })

  if (!invoice) {
    return <div className="text-center p-4">Invoice not found</div>
  }
  //PDF Downloading Function
  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.text(`Invoice #${invoice.id}`, 20, 20)
    doc.text(`Supplier: ${invoice.supplier}`, 20, 30)
    doc.text(`Bill Date: ${invoice.billDate}`, 20, 40)
    doc.text(`Delivery Date: ${invoice.deliveryDate}`, 20, 50)

    // Combine mock data and newly added materials
    const allProducts = [...invoice.products, ...invoiceMaterials]

    // Generate table
    doc.autoTable({
      startY: 60,
      head: [["Product", "Quantity", "Unit Price", "Total"]],
      body: allProducts.map((product) => [
        product.name,
        product.quantity,
        `$${product.unitPrice}`,
        `$${product.quantity * product.unitPrice}`,
      ]),
    })

    // Get last printed table position
    const finalY = doc.lastAutoTable?.finalY || 70 // Default to below the table

    // Calculate total
    const totalAmount = allProducts.reduce((total, product) => total + product.quantity * product.unitPrice, 0)

    // Add total below the table
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, finalY + 10)

    doc.save(`Invoice_${invoice.id}.pdf`)
  }

  //Displaying total calculation
  const calculateTotal = () => {
    return [...invoice.products, ...invoiceMaterials].reduce((total, product) => {
      return total + product.quantity * product.unitPrice
    }, 0)
  }

  const balanceDue = calculateTotal().toFixed(2) - payment

  //Handling adding materials to the invoice
  const handleAddMaterials = (newInvoiceMaterial) => {
    const formattedInvoiceMaterial = {
      name: newInvoiceMaterial.name,
      quantity: newInvoiceMaterial.quantity,
      unitPrice: newInvoiceMaterial.unitPrice,
    }
    setInvoiceMaterial([...invoiceMaterials, formattedInvoiceMaterial])
  }

  return (
    <div className="flex gap-4">
      {/* Invoice component */}
      <div className="flex-[2] p-6 bg-white rounded-lg shadow-md">
        <Button
          variant="outlined"
          style={{ color: green[900], borderColor: green[800] }}
          onClick={() => {
            navigate("/suppliers")
          }}
        >
          Back
        </Button>
        <div className="bg-green-100 font-sans p-4 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">
              Invoice #{invoice.id}-{invoice.invoiceNumber}
            </h2>
            <div className="flex gap-2">
              <span className="bg-green-500 rounded-md p-1 shadow-md">
                <Edit style={{ color: grey[100] }} onClick={() => setIsBillEditing(!isBillEditing)} />
              </span>
              <span className="bg-green-500 rounded-md p-1 shadow-md">
                <Download style={{ color: grey[100] }} onClick={downloadPDF} />
              </span>
            </div>
          </div>
          {/* Billing Details  "Editing Supllier" */}
          <div className="bg-green-200  p-4 mb-2 rounded-md shadow-md">
            {isBillEditing ? (
              <>
                <p>
                  <strong>Supplier:</strong>{" "}
                  <input
                    value={editableInvoice.supplier}
                    onChange={(e) => setEditableInvoice({ ...editableInvoice, supplier: e.target.value })}
                    className="border px-2 py-1 rounded w-1/2"
                  />
                </p>
                <p>
                  <input
                    value={editableInvoice.supplierAddress}
                    onChange={(e) =>
                      setEditableInvoice({
                        ...editableInvoice,
                        supplierAddress: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded w-full mt-2"
                  />
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Supplier:</strong> {editableInvoice.supplier}
                </p>
                <p>{editableInvoice.supplierAddress}</p>
              </>
            )}
          </div>
          {/* Billing Details  "Bill Date, Delivery Date, Billing Address" */}
          <div className="flex justify-between">
            <div className="bg-green-200 p-4 rounded-md shadow-md">
              <p>
                <strong>Bill Date:</strong>{" "}
                {isBillEditing ? (
                  <input
                    type="date"
                    value={editableInvoice.billDate}
                    onChange={(e) => setEditableInvoice({ ...editableInvoice, billDate: e.target.value })}
                    className="border px-2 py-1 rounded"
                  />
                ) : (
                  editableInvoice.billDate
                )}
              </p>
              <p>
                <strong>Delivery Date:</strong>{" "}
                {isBillEditing ? (
                  <input
                    type="date"
                    value={editableInvoice.deliveryDate}
                    onChange={(e) =>
                      setEditableInvoice({
                        ...editableInvoice,
                        deliveryDate: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                  />
                ) : (
                  editableInvoice.deliveryDate
                )}
              </p>
            </div>
            <div className="bg-green-200 p-4 rounded-md shadow-md">
              <p>
                <strong>Billing Address :</strong>{" "}
                {isBillEditing ? (
                  <input
                    value={editableInvoice.billingAddress}
                    onChange={(e) =>
                      setEditableInvoice({
                        ...editableInvoice,
                        billingAddress: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                ) : (
                  editableInvoice.billingAddress
                )}
              </p>
            </div>
          </div>
        </div>
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-green-600">
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Unit Price</th>
              <th className="p-2 border">Amount</th>
            </tr>
          </thead>

          <tbody>
            {[...invoice.products, ...invoiceMaterials]?.map((product, index) => (
              <tr key={index}>
                <td className="p-2 border">{product.name}</td>
                <td className="p-2 border">{product.quantity}</td>
                <td className="p-2 border">Rs {Number(product.unitPrice).toFixed(2)}</td>
                <td className="p-2 border">Rs {(product.quantity * Number(product.unitPrice)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-right font-bold">Total: Rs {calculateTotal().toFixed(2)}</p>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={() => setIsModalOpen(true)}>
          + Add Materials
        </button>
        <AddInvoceMaterials
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRegister={handleAddMaterials}
        />
      </div>
      {/* Payment Editing Area */}
      <div>
        <div className="bg-white rounded-lg shadow-md mb-4">
          <div className="p-1 mx-2">Summary</div>
          <div className=" flex justify-between p-2 bg-gray-100 rounded-sm">
            <span className="mx-2">Total</span>
            <span>Rs {calculateTotal().toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-1 mx-2">Payement Status</div>
          <div className=" flex justify-between p-2 bg-gray-100 rounded-sm">
            <span className="mx-2">Total</span>
            <span>Rs {calculateTotal().toFixed(2)}</span>
          </div>
          <div className=" flex justify-between items-center p-2 bg-gray-100 rounded-sm">
            <span className="mx-2">Payment</span>
            {isEditing ? (
              <input
                value={payment}
                onChange={(e) => setPayment(Number.parseFloat(e.target.value) || 0)}
                className="p-2 w-32 border rounded text-right "
              />
            ) : (
              <span className="mx-2 text-end">Rs {payment.toFixed(2)}</span>
            )}
          </div>
          <div className=" flex justify-between p-2 bg-gray-200 rounded-sm text-red-600 gap-28">
            <span className="mx-2">Balance(Due)</span>
            <span>Rs {balanceDue.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {/* <button className="bg-gray-200 py-1 shadow-md rounded-md">Edit Payment Amount</button> */}
          <button className="bg-gray-200 py-1 shadow-md rounded-md" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Done" : "Edit Payment Amount"}
          </button>
          <button className="bg-green-500 py-1 shadow-md rounded-md">Mark as Paid</button>
        </div>
      </div>
    </div>
  )
}

export default SupplierInvoice
