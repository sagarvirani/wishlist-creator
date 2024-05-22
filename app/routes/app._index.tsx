import { useEffect, useState, useCallback, useRef } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Select,
  DataTable,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const encodeGlobalId = (type: string, id: any) => {
  return String(`gid://shopify/${type}/${id}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
   const { admin } = await authenticate.admin(request);

  const response = await fetch(
    `https://elysium-homedecor.myshopify.com/admin/api/2024-04/draft_orders.json`,
    {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": "shpua_078e143910e674339f076f07463a2530",
        "Content-Type": "application/json",
      },
    },
  );

  const draftOrders = await response.json();

  const groupedCustomerDetails: { [key: string]: any } = {};
  
  draftOrders.draft_orders.forEach((order: any) => {
    const customer = order.customer;
    if (customer) {
      const customerId = customer.id.toString();
      if (!groupedCustomerDetails[customerId]) {
        groupedCustomerDetails[customerId] = {
          id: customerId,
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          orders: [],
        };
      }
      const variantIds: string[] = [];
      groupedCustomerDetails[customerId].orders.push({
        orderId: order.id,
        orderName: order.name,
        createdAt: order.created_at,
        lineItems: order.line_items.map((item: any) => {
          const variantId = item.variant_id.toString();
          variantIds.push(encodeGlobalId("ProductVariant", variantId));
          const discountValueType = item.applied_discount?.value_type;
          const formattedDiscountValueType =
            discountValueType === "percentage" ? "%" : discountValueType;
          const discountAmount = item.applied_discount?.amount || 0;
          const finalPrice =
            item.quantity * item.price -
            (discountValueType === "%"
              ? (item.price * item.quantity * item.applied_discount.value) / 100
              : discountAmount);

          return {
            variantId: variantId,
            variantIds: variantIds,
            title: item.title,
            unitPrice: item.price,
            quantity: item.quantity,
            discount: item.applied_discount
              ? `${item.applied_discount.value} ${formattedDiscountValueType}`
              : "-",
            finalPrice: finalPrice.toFixed(2),
            imageUrl: null,
          };
        }),
      });
    }
  });

  // const variantResponse = await admin.graphql(
  //   `#graphql query ($variantIds: [ID!]!) {
  //     nodes(ids: $variantIds) {
  //       ... on ProductVariant {
  //         id
  //         image {
  //           url
  //         }
  //       }
  //     }
  //   }
  // `);

  // console.log("variant data=", variantResponse);

  // const variantImages: { [key: string]: string } = {};
  // variantData.nodes.forEach((variant: any) => {
  //   if (variant && variant.image) {
  //     variantImages[variant.id] = variant.image.url;
  //   }
  // });

  // // Assign images to line items
  // Object.values(groupedCustomerDetails).forEach((customer: any) => {
  //   customer.orders.forEach((order: any) => {
  //     order.lineItems.forEach((item: any) => {
  //       item.imageUrl =
  //         variantImages[encodeGlobalId("ProductVariant", item.variantId)] ||
  //         null;
  //     });
  //   });
  // });

  const customerDetails = Object.values(groupedCustomerDetails);

  return json({ customerDetails });
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

export default function Index() {
  const { customerDetails: initialCustomerDetails } = useLoaderData<any>();
  const [customerDetails, setCustomerDetails] = useState(
    initialCustomerDetails,
  );
  console.log('details=', customerDetails);

  const options = customerDetails.map((customer: any) => ({
    label: `${customer.firstName} ${customer.lastName}`,
    value: customer.id,
  }));

  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    options.length > 0 ? options[0].value : "",
  );

  const handleCustomerChange = useCallback((value: string) => {
    setSelectedCustomer(value);
  }, []);

  const selectedCustomerDetails = customerDetails.find(
    (customer: any) => customer.id === selectedCustomer,
  );

  const [selectedOrder, setSelectedOrder] = useState<any>(
    selectedCustomerDetails?.orders[0],
  );

  const handleOrderChange = useCallback(
    (value: any) => {
      const selectedOrderId = value.toString();
      const newSelectedOrder = selectedCustomerDetails?.orders.find(
        (order: any) => order.orderId.toString() === selectedOrderId,
      );
      setSelectedOrder(newSelectedOrder);
    },
    [selectedCustomerDetails],
  );

  useEffect(() => {
    if (options.length > 0 && !selectedCustomer) {
      setSelectedCustomer(options[0].value);
    }
  }, [options]);

  useEffect(() => {
    setSelectedOrder(selectedCustomerDetails?.orders[0]);
  }, [selectedCustomerDetails]);

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add customer details
    if (selectedCustomerDetails) {
      doc.setFontSize(12);
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
          item.quantity,
          item.discount,
          item.discount == "-"
            ? `${(item.unitPrice * item.quantity).toFixed(2)}`
            : item.finalPrice,
        ],
      );

      autoTable(doc, {
        head: [["Title", "Price/Unit", "Quantity", "Discount", "Final Price"]],
        body: lineItems,
        startY: 90,
        margin: { top: 85 },
      });
      // Get the finalY value after the autoTable is rendered
      let finalY = (doc as any).lastAutoTable.finalY || 0;

      // Calculate total quantity
      const totalQuantity = selectedOrder.lineItems.reduce(
        (total: number, item: any) => total + item.quantity,
        0,
      );

      // Calculate total final price
      const totalFinalPrice = selectedOrder.lineItems
        .reduce(
          (total: number, item: any) => total + parseFloat(item.finalPrice),
          0,
        )
        .toFixed(2);

      doc.text("Total", 15, finalY + 10);
      // Add total quantity at the end of the Quantity column
      doc.text(`${totalQuantity}`, 99, finalY + 10);

      // Add total final price at the end of the Final Price column
      doc.text(`${totalFinalPrice}`, 154, finalY + 10);
    }

    // Format the createdAt date for the filename
    const formattedDate = formatDate(selectedOrder.createdAt).replace(
      /[:\s]/g,
      "-",
    );

    doc.save(
      `${selectedOrder.orderName} - ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName} ${formattedDate}.pdf`,
    );
  };

  const dataTableRef = useRef(null);
  return (
    <Page>
      <TitleBar title="Wishlist App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Select
                    label="Select Customer"
                    options={options}
                    onChange={handleCustomerChange}
                    value={selectedCustomer}
                  />
                  {selectedCustomerDetails && (
                    <Select
                      label="Select Order"
                      options={selectedCustomerDetails.orders.map(
                        (order: any) => ({
                          label: `${formatDate(order.createdAt)}`,
                          value: order.orderId,
                        }),
                      )}
                      onChange={handleOrderChange}
                      value={selectedOrder?.orderId}
                    />
                  )}
                </BlockStack>
                {selectedCustomerDetails && selectedOrder && (
                  <div>
                    <p>
                      <strong>Order Id:</strong> {selectedOrder.orderId}
                    </p>
                    <p>
                      <strong>Order Name:</strong> {selectedOrder.orderName}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedCustomerDetails.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedCustomerDetails.phone}
                    </p>
                  </div>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        {selectedOrder && (
          <>
            <Card>
              <div ref={dataTableRef}>
                <DataTable
                  columnContentTypes={[
                    "text",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                  ]}
                  headings={[
                    "Title",
                    "Price/Unit",
                    "Quantity",
                    "Discount",
                    "Final Price",
                  ]}
                  rows={selectedOrder.lineItems.map(
                    (item: any, index: number) => [
                      item.title,
                      item.unitPrice,
                      item.quantity,
                      <div key={index}>{item.discount}</div>,
                      <div key={index}>
                        {item.discount !== "-" && (
                          <span style={{ textDecoration: "line-through" }}>
                            {(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                        <div>
                          {item.discount !== "-"
                            ? `${item.finalPrice}`
                            : item.finalPrice}
                        </div>
                      </div>,
                    ],
                  )}
                  totals={[
                    "", // Title column doesn't have a total
                    "", // Price/Unit column doesn't have a total
                    selectedOrder.lineItems.reduce(
                      (totalQuantity: number, item: any) =>
                        totalQuantity + item.quantity,
                      0,
                    ), // Total quantity
                    "", // Discount column doesn't have a total
                    selectedOrder.lineItems
                      .reduce(
                        (totalPrice: number, item: any) =>
                          totalPrice + parseFloat(item.finalPrice),
                        0,
                      )
                      .toFixed(2), // Total final price
                  ]}
                  showTotalsInFooter
                />
              </div>
            </Card>
          </>
        )}
        <BlockStack gap="500" inlineAlign="center">
          <Button
            variant="primary"
            tone="critical"
            size="large"
            textAlign="center"
            onClick={generatePDF}
          >
            Generate PDF
          </Button>
        </BlockStack>
      </BlockStack>
    </Page>
  );
}
