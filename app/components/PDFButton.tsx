import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BlockStack, Button } from "@shopify/polaris";

export type PDFButtonProps = {
  selectedCustomerDetails: any;
  selectedOrder: any;
  quantities: { [key: string]: number };
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  const formatter = new Intl.DateTimeFormat("en-GB", dateOptions);
  const formattedDate = formatter.format(date);

  // Separate date and time
  const [datePart, timePart] = formattedDate.split(", ");
  return `${datePart} (${timePart} IST)`;
}

export default function PDFButton({
  selectedCustomerDetails,
  selectedOrder,
  quantities,
}: PDFButtonProps) {
  const generatePDF = () => {
    if (!selectedCustomerDetails || !selectedOrder) {
      console.error("Customer details or order is not selected.");
      return;
    }

    const doc = new jsPDF();

    // Add customer details
    if (selectedCustomerDetails) {
      doc.setFontSize(16);
      doc.text(
        `Customer: ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName}`,
        15,
        20,
      );
      doc.text(`Email: ${selectedCustomerDetails.email}`, 15, 30);
      doc.text(`Phone: ${selectedCustomerDetails.phone}`, 15, 40);
    }

    // Add order details
    if (selectedOrder) {
      doc.setFontSize(14);
      doc.text(`Order ID: ${selectedOrder.orderId}`, 15, 60);
      doc.text(`Order Name: ${selectedOrder.orderName}`, 15, 70);
      doc.text(`Date: ${formatDate(selectedOrder.createdAt)}`, 15, 80);

      // Add line items
      const lineItems = selectedOrder.lineItems.map(
        (item: any, index: number) => [
          item.title,
          item.unitPrice,
          quantities[item.productId],
          item.discount,
          item.discount == "-"
            ? `${(item.unitPrice * quantities[item.productId]).toFixed(2)}`
            : (
                item.unitPrice * quantities[item.productId] -
                (item.discount.includes("%")
                  ? (item.unitPrice *
                      quantities[item.productId] *
                      parseFloat(item.discount)) /
                    100
                  : parseFloat(item.discount))
              ).toFixed(2),
        ],
      );

      autoTable(doc, {
        head: [["Title", "Price/Unit", "Quantity", "Discount", "Final Price"]],
        body: lineItems,
        startY: 90,
        margin: { top: 85 },
      });

      let finalY = (doc as any).lastAutoTable.finalY || 0;

      const totalQuantity = Object.values(quantities).reduce(
        (total: number, quantity: number) => total + quantity,
        0,
      );

      const totalFinalPrice = selectedOrder.lineItems
        .reduce(
          (total: number, item: any) =>
            total +
            (item.discount == "-"
              ? item.unitPrice * quantities[item.productId]
              : item.unitPrice * quantities[item.productId] -
                (item.discount.includes("%")
                  ? (item.unitPrice *
                      quantities[item.productId] *
                      parseFloat(item.discount)) /
                    100
                  : parseFloat(item.discount))),
          0,
        )
        .toFixed(2);

      doc.text("Total", 15, finalY + 10);
      doc.text(`Quantity: ${totalQuantity}`, 70, finalY + 10);
      doc.text(`Price: ${totalFinalPrice}`, 140, finalY + 10);
    }

    const formattedDate = formatDate(selectedOrder.createdAt).replace(
      /[:\s]/g,
      "-",
    );

    doc.save(
      `${selectedOrder.orderName} - ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName} ${formattedDate}.pdf`,
    );
  };

  return (
    <BlockStack gap="500" inlineAlign="center">
      <Button
        variant="primary"
        tone="critical"
        size="large"
        onClick={generatePDF}
      >
        Generate PDF
      </Button>
    </BlockStack>
  );
}
