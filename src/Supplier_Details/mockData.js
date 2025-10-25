const supplierInvoices = [
    {
      id: "1",
      supplier: "Jane Cooper",
      supplierAddress:"789/1 Sector-2c, 38200 Gandhinagar, Colombo",
      location: "Colombo",
      phone: "(225)555-0118",
      billingAddress: "1445 West Norwood Avenue, Itasca, Illinois, USA",
      billDate: "03/05/2020",
      deliveryDate: "03/05/2020",
      invoiceNumber: "2025-01-0001",
      products: [
        { name: "Product A", description: "Product Description", quantity: 150, unitPrice: 20 },
        { name: "Product B", description: "Product Description", quantity: 150, unitPrice: 20},
      ],
      total: 3030,
      payment: 2000,
      balance: 1030,
    },
    {
      id: "2",
      supplier: "Floyd Miles",
      supplierAddress:"1445 West Norwood Avenue, Itasca, Illinois, USA",
      location: "Colombo",
      phone: "(225)555-0119",
      billingAddress: "7891 Sector-2c, Gandhinagar, Colombo",
      billDate: "04/06/2020",
      deliveryDate: "05/06/2020",
      invoiceNumber: "2025-01-0002",
      products: [
        { name: "Product C", description: "Product Description", quantity: 100, unitPrice: 25},
      ],
      total: 2500,
      payment: 1000,
      balance: 1500,
    },
    {
      id: "3",
      supplier: "Floyd Miles",
      supplierAddress:"1445 West Norwood Avenue, Itasca, Illinois, USA",
      location: "Colombo",
      phone: "(225)555-0119",
      billingAddress: "7891 Sector-2c, Gandhinagar, Colombo",
      billDate: "04/06/2020",
      deliveryDate: "05/06/2020",
      invoiceNumber: "2025-01-0002",
      products: [
        { name: "Product C", description: "Product Description", quantity: 100, unitPrice: 25},
      ],
      total: 2500,
      payment: 1000,
      balance: 1500,
    },
  ];
  
  export default supplierInvoices;
  