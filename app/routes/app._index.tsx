import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import PDFButton from "~/components/PDFButton";
import DraftOrderButton from "~/components/DraftOrderButton";
import SelectCustomerData from "~/components/SelectCustomerData";
import OrderDataTable from "~/components/OrderDataTable";


const encodeGlobalId = (type: string, id: any) => {
  return String(`gid://shopify/${type}/${id}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const draftOrder = await admin.rest.resources.DraftOrder.all({
    session: session,
  });

  const groupedCustomerDetails: { [key: string]: any } = {};

  draftOrder.data.forEach((order: any) => {
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
      const productIds: string[] = [];
      const variantIds: string[] = [];
      groupedCustomerDetails[customerId].orders.push({
        orderId: order.id,
        orderName: order.name,
        createdAt: order.created_at,
        lineItems: order.line_items.map((item: any) => {
          const productId = item.product_id.toString();
          const variantId = item.variant_id.toString();
          productIds.push(encodeGlobalId("Product", productId));
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
            productId: productId,
            variantId: variantId,
            productIds: productIds,
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

  const productIds = Array.from(
    new Set(
      Object.values(groupedCustomerDetails)
        .flatMap((customer: any) =>
          customer.orders.flatMap((order: any) =>
            order.lineItems.map((item: any) =>
              encodeGlobalId("Product", item.productId),
            ),
          ),
        )
        .filter(Boolean),
    ),
  );

  const variantIds = Array.from(
    new Set(
      Object.values(groupedCustomerDetails)
        .flatMap((customer: any) =>
          customer.orders.flatMap((order: any) =>
            order.lineItems.map((item: any) =>
              encodeGlobalId("ProductVariant", item.variantId),
            ),
          ),
        )
        .filter(Boolean),
    ),
  );

  const productResponse = await admin.graphql(
    `#graphql
      query GetProductImages($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    `,
    { variables: { ids: productIds } },
  );

  const variantResponse = await admin.graphql(
    `#graphql
      query GetVariantImages($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            image {
              url
            }
          }
        }
      }
    `,
    { variables: { ids: variantIds } },
  );

  const productData = await productResponse.json();
  const variantData = await variantResponse.json();

  const productImages: { [key: string]: string } = {};
  productData.data.nodes.forEach((product: any) => {
    if (product && product.images.edges.length > 0) {
      productImages[product.id] = product.images.edges[0].node.url;
    }
  });

  const variantImages: { [key: string]: string } = {};
  variantData.data.nodes.forEach((variant: any) => {
    if (variant && variant.image) {
      variantImages[variant.id] = variant.image.url;
    }
  });

  Object.values(groupedCustomerDetails).forEach((customer: any) => {
    customer.orders.forEach((order: any) => {
      order.lineItems.forEach((item: any) => {
        item.imageUrl =
          variantImages[encodeGlobalId("ProductVariant", item.variantId)] ||
          productImages[encodeGlobalId("Product", item.productId)] ||
          null;
      });
    });
  });

  const customerDetails = Object.values(groupedCustomerDetails);

  return json({ customerDetails });
};

export default function Index() {
  const { customerDetails: initialCustomerDetails } = useLoaderData<any>();
  const [customerDetails, setCustomerDetails] = useState(
    initialCustomerDetails,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    initialCustomerDetails.length > 0 ? initialCustomerDetails[0].id : "",
  );

  const options = customerDetails.map((customer: any) => ({
    label: `${customer.firstName} ${customer.lastName}`,
    value: customer.id,
  }));

  const selectedCustomerDetails = customerDetails.find(
    (customer: any) => customer.id === selectedCustomer,
  );

  const [selectedOrder, setSelectedOrder] = useState<any>(
    selectedCustomerDetails?.orders[0],
  );

  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    selectedOrder?.lineItems.reduce((acc: any, item: any) => {
      acc[item.productId] = item.quantity;
      return acc;
    }, {}) || {},
  );

  useEffect(() => {
    if (options.length > 0 && !selectedCustomer) {
      setSelectedCustomer(options[0].value);
    }
  }, [options]);

  useEffect(() => {
    setSelectedOrder(selectedCustomerDetails?.orders[0]);
  }, [selectedCustomerDetails]);

  useEffect(() => {
    setQuantities(
      selectedOrder?.lineItems.reduce((acc: any, item: any) => {
        acc[item.productId] = item.quantity;
        return acc;
      }, {}) || {},
    );
  }, [selectedOrder]);

  return (
    <Page>
      <TitleBar title="Wishlist App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <SelectCustomerData
                  options={options}
                  selectedCustomer={selectedCustomer}
                  selectedCustomerDetails={selectedCustomerDetails}
                  selectedOrder={selectedOrder}
                  setSelectedCustomer={setSelectedCustomer}
                  setSelectedOrder={setSelectedOrder}
                />
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
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <DraftOrderButton
                selectedOrder={selectedOrder}
                quantities={quantities}
              />
            </div>
            <OrderDataTable
              selectedOrder={selectedOrder}
              quantities={quantities}
              setQuantities={setQuantities}
              setSelectedOrder={setSelectedOrder}
            />
          </>
        )}
        <PDFButton
          selectedCustomerDetails={selectedCustomerDetails}
          selectedOrder={selectedOrder}
          quantities={quantities}
        />
      </BlockStack>
    </Page>
  );
}
