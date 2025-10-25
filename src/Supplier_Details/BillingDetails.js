import React from 'react'
import { useNavigate, useParams } from "react-router-dom";
import mockInvoices from "./mockData";

const BillingDetails = ({isBillEditing, onChange}) => {
    const { id } = useParams();
    const invoice = mockInvoices.find((inv) => inv.id === id);

    const handleChange = (field, value) => {
        onChange({ ...invoice, [field]: value });
    };

    if (!invoice) return null;
    return (
        <div className="bg-green-100 font-sans p-4 mt-2">
            {/* <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">
                    Invoice #{invoice.id}-{invoice.invoiceNumber}
                </h2>
            </div> */}

            {/* Supplier Info */}
            <div className="bg-green-200 p-4 mb-2 rounded-md shadow-md">
                <p>
                    <strong>Supplier:</strong>{" "}
                    {isBillEditing ? (
                        <input
                            value={invoice.supplier}
                            onChange={(e) => handleChange("supplier", e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    ) : (
                        invoice.supplier
                    )}
                </p>
                <h2>
                    {isBillEditing ? (
                        <input
                            value={invoice.supplierAddress}
                            onChange={(e) => handleChange("supplierAddress", e.target.value)}
                            className="border rounded px-2 py-1 w-full mt-1"
                        />
                    ) : (
                        invoice.supplierAddress
                    )}
                </h2>
            </div>

            {/* Dates and Billing Address */}
            <div className="flex justify-between gap-4">
                <div className="bg-green-200 p-4 rounded-md shadow-md flex-1">
                    <p>
                        <strong>Bill Date:</strong>{" "}
                        {isBillEditing ? (
                            <input
                                type="date"
                                value={invoice.billDate}
                                onChange={(e) => handleChange("billDate", e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                            />
                        ) : (
                            invoice.billDate
                        )}
                    </p>
                    <p className="mt-2">
                        <strong>Delivery Date:</strong>{" "}
                        {isBillEditing ? (
                            <input
                                type="date"
                                value={invoice.deliveryDate}
                                onChange={(e) => handleChange("deliveryDate", e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                            />
                        ) : (
                            invoice.deliveryDate
                        )}
                    </p>
                </div>
                <div className="bg-green-200 p-4 rounded-md shadow-md flex-1">
                    <p>
                        <strong>Billing Address:</strong>{" "}
                        {isBillEditing ? (
                            <textarea
                                value={invoice.billingAddress}
                                onChange={(e) => handleChange("billingAddress", e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                            />
                        ) : (
                            invoice.billingAddress
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default BillingDetails
