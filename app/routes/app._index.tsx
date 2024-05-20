import { useEffect, useState, useCallback } from "react";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

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
      groupedCustomerDetails[customerId].orders.push({
        orderId: order.id,
        createdAt: order.created_at,
        lineItems: order.line_items.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      });
    }
  });

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
      doc.text(
        `Customer: ${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName}`,
        10,
        10,
      );
      doc.text(`Email: ${selectedCustomerDetails.email}`, 10, 20);
      doc.text(`Phone: ${selectedCustomerDetails.phone}`, 10, 30);
    }

    // Add order details
    if (selectedOrder) {
      doc.text(`Order ID: ${selectedOrder.orderId}`, 10, 40);
      doc.text(`Date: ${formatDate(selectedOrder.createdAt)}`, 10, 50);

      // Add line items
      const lineItems = selectedOrder.lineItems.map((item: any) => [
        item.title,
        item.quantity,
        item.price,
      ]);
      autoTable(doc, {
        head: [["Title", "Quantity", "Price"]],
        body: lineItems,
        startY: 60,
      });
    }

    // Format the createdAt date for the filename
    const formattedDate = formatDate(selectedOrder.createdAt).replace(
      /[:\s]/g,
      "-",
    );

    doc.save(
      `${selectedCustomerDetails.firstName} ${selectedCustomerDetails.lastName} ${formattedDate}.pdf`,
    );
  };

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
              <DataTable
                columnContentTypes={["text", "numeric", "numeric"]}
                headings={["Title", "Quantity", "Price"]}
                rows={selectedOrder.lineItems.map((item: any) =>
                  Object.values(item),
                )}
              />
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
