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

    // Add customer details box
    const customerBoxY = 20;
    const customerBoxHeight = 30;
    const customerBoxMargin = 15;

    // Draw customer details box
    doc.setFillColor(200, 220, 255); // Light blue color for the box
    doc.rect(customerBoxMargin, customerBoxY - 5, 180, customerBoxHeight, "F"); // Draw filled rectangle
    doc.setDrawColor(0, 0, 0); // Black color for the border
    doc.rect(customerBoxMargin, customerBoxY - 5, 180, customerBoxHeight); // Draw border

    // Add customer details text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for text
    doc.text(
      `Customer: ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName}`,
      customerBoxMargin + 5,
      customerBoxY,
    );
    doc.text(
      `Email: ${selectedCustomerDetails.email}`,
      customerBoxMargin + 5,
      customerBoxY + 10,
    );
    doc.text(
      `Phone: ${selectedCustomerDetails.phone}`,
      customerBoxMargin + 5,
      customerBoxY + 20,
    );

    // Add order details box
    const orderBoxY = customerBoxY + customerBoxHeight + 10;
    const orderBoxHeight = 30;
    const orderBoxMargin = 15;

    // Draw order details box
    doc.setFillColor(255, 230, 200); // Light orange color for the box
    doc.rect(orderBoxMargin, orderBoxY - 5, 180, orderBoxHeight, "F"); // Draw filled rectangle
    doc.setDrawColor(0, 0, 0); // Black color for the border
    doc.rect(orderBoxMargin, orderBoxY - 5, 180, orderBoxHeight); // Draw border

    // Add order details text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for text
    doc.text(
      `Order Name: ${selectedOrder.orderName}`,
      orderBoxMargin + 5,
      orderBoxY,
    );
    doc.text(
      `Order ID: ${selectedOrder.orderId}`,
      orderBoxMargin + 130,
      orderBoxY,
    );
    doc.text(
      `Order Date: ${formatDate(selectedOrder.createdAt)}`,
      orderBoxMargin + 5,
      orderBoxY + 10,
    );

    // Add line items table
    const tableStartY = orderBoxY + orderBoxHeight + 10;
    const lineItems = selectedOrder.lineItems.map(
      (item: any, index: number) => [
        item.title,
        item.unitPrice,
        quantities[item.productId],
        (item.unitPrice * quantities[item.productId]).toFixed(2),
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
    // Add summary row
    lineItems.push([
      "Total",
      "", // Empty cell for Price/Unit
      totalQuantity,
      "", // Empty cell for Total Price
      "", // Empty cell for Discount
      totalFinalPrice,
    ]);

    autoTable(doc, {
      head: [
        [
          "Product Title",
          "Price/Unit",
          "Quantity",
          "Total Price",
          "Discount",
          "Final Price",
        ],
      ],
      body: lineItems,
      startY: tableStartY,
      margin: { top: 85 },
      styles: {
        halign: "right", // All columns right aligned by default
        fontSize: 10,
      },
      headStyles: {
        halign: "right", // Center align headings
        fontSize: 12, // Increase font size for headings
        fontStyle: "bold", // Make headings bold
      },
      columnStyles: {
        0: { halign: "left" }, // First column (Title) left aligned
      },
      didParseCell: (data) => {
        if (data.row.index === lineItems.length - 1) {
          data.cell.styles.fontStyle = "bold"; // Apply bold font to last row
          data.cell.styles.fillColor = "lightblue";
        }
      },
    });

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
