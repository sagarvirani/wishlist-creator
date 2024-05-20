import { useEffect, useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Select } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

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

  // Extract customer details
  const customerDetails = draftOrders.draft_orders
    .map((order: any) => {
      const customer = order.customer;
      if (customer) {
        return {
          id: customer.id.toString(), // Convert ID to string for consistency
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        };
      }
      return undefined;
    })
    .filter((customer: any) => customer !== undefined);

  return json({ customerDetails });
};

export default function Index() {
  const { customerDetails } = useLoaderData<any>();
  //console.log(customerDetails);

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

  useEffect(() => {
    if (options.length > 0 && !selectedCustomer) {
      setSelectedCustomer(options[0].value);
    }
  }, [options]);

  const selectedCustomerDetails = customerDetails.find(
    (customer: any) => customer.id === selectedCustomer,
  );

  //console.log("Selected customer ID:", selectedCustomer);
  //console.log("Selected customer details:", selectedCustomerDetails);

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
                </BlockStack>
                {selectedCustomerDetails && (
                  <div>
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
      </BlockStack>
    </Page>
  );
}
