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
  const formatAddress = (address: {
    address1: any;
    address2: any;
    city: any;
    province: any;
    country: any;
    zip: any;
  }) => {
    if (!address) return "Not Provided";
    const { address1, address2, city, province, country, zip } = address;
    return `${address1 || ""}${address2 ? `, ${address2}` : ""},\n${city}, ${province}, ${country} - ${zip}`;
  };

  const generatePDF = () => {
    if (!selectedCustomerDetails || !selectedOrder) {
      console.error("Customer details or order is not selected.");
      return;
    }

    const doc = new jsPDF();

    // Define colors
    const borderColor = [0, 0, 0]; // Black color
    const headerBackgroundColor = [255, 255, 204]; // Light yellow color
    const bodyBackgroundColorInfoTable = [245, 245, 220]; // Muted Beige color for Customer and Order Information table
    const bodyBackgroundColorAddressTable = [255, 255, 204]; // Light yellow color for Address table

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14; // Margin from the edges of the page
    const usableWidth = pageWidth - 2 * margin; // Usable width accounting for margins
    const columnWidth = usableWidth / 2; // Width for each column

    // Create Customer and Order Information table
    autoTable(doc, {
      head: [["Customer Information", "Order Information"]],
      body: [
        [
          `Name: ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName}\nEmail: ${selectedCustomerDetails.email || 'Not Provided'}\nPhone: ${selectedCustomerDetails.phone}`,
          `Order Name: ${selectedOrder.orderName}\nOrder ID: ${selectedOrder.orderId}\nOrder Date: ${formatDate(selectedOrder.createdAt)}\nSales Person: ${selectedOrder.salesPerson}`,
        ],
      ],
      startY: 10,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineWidth: 0.25,
        lineColor: borderColor as [number, number, number], // Explicitly cast to tuple
        fillColor: bodyBackgroundColorInfoTable as [number, number, number], // Explicitly cast to tuple
        textColor: [0, 0, 0], // Black text color
        overflow: "linebreak", // Ensure text wraps within the cell
      },
      headStyles: {
        fontSize: 12,
        fontStyle: "bold",
        lineColor: borderColor as [number, number, number], // Explicitly cast to tuple
        fillColor: headerBackgroundColor as [number, number, number], // Explicitly cast to tuple
        textColor: [0, 0, 0], // Black text color
      },
      columnStyles: {
        0: { cellWidth: columnWidth }, // Set width of the first column
        1: { cellWidth: columnWidth }, // Set width of the second column
      },
      margin: { right: margin }, // Add margin on the right
    });

    // Insert address table after the "Customer and Order Information" table
    autoTable(doc, {
      body: [
        ["Customer Address:", formatAddress(selectedOrder.billingAddress)],
      ],
      startY: (doc as any).previousAutoTable.finalY,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineWidth: 0.25,
        lineColor: borderColor as [number, number, number], // Explicitly cast to tuple
        fillColor: bodyBackgroundColorAddressTable as [number, number, number], // Explicitly cast to tuple
        textColor: [0, 0, 0], // Black text color
        overflow: "linebreak", // Ensure text wraps within the cell
      },
      columnStyles: {
        0: { cellWidth: columnWidth }, // Fixed width for label column
        1: { cellWidth: columnWidth }, // Remaining width for address
      },
      margin: { right: margin }, // Add margin on the right
    });
    const additionalText = `* For all future communications, please provide your "ORDER NAME" and "SALES PERSON'S NAME" to help us provide you with better service.`;

    // Add the additional text below the address table
    doc.setFontSize(8); // Set the font size
    doc.setTextColor(0, 0, 0); // Set text color to black
    doc.text(
      additionalText,
      margin,
      (doc as any).previousAutoTable.finalY + 3,
    );


    // Add line items table
    const tableStartY = (doc as any).previousAutoTable.finalY + 13;
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
