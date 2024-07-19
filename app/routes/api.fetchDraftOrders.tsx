import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
//import { authenticate } from "../shopify.server";

// const encodeGlobalId = (type: string, id: any) => {
//   return `gid://shopify/${type}/${id}`;
// };

export const loader: LoaderFunction = async () => {
  return new Response(null, { status: 405 });
};

export const action: ActionFunction = async ({ request }) => {
  console.log("inside fetch draft orders..");
  //const { admin, session } = await authenticate.admin(request);

  // const draftOrder = await admin.rest.resources.DraftOrder.all({
  //   session: session,
  // });

  // draftOrder.data.reverse();

  // const groupedCustomerDetails: { [key: string]: any } = {};

  // draftOrder.data.forEach((order: any) => {
  //   const customer = order.customer;
  //   if (customer) {
  //     const customerId = customer.id.toString();
  //     if (!groupedCustomerDetails[customerId]) {
  //       groupedCustomerDetails[customerId] = {
  //         id: customerId,
  //         firstName: customer.first_name,
  //         lastName: customer.last_name,
  //         email: customer.email,
  //         phone: customer.phone,
  //         orders: [],
  //       };
  //     }
  //     const productIds: string[] = [];
  //     const variantIds: string[] = [];
  //     groupedCustomerDetails[customerId].orders.push({
  //       orderId: order.id,
  //       orderName: order.name,
  //       createdAt: order.created_at,
  //       lineItems: order.line_items.map((item: any) => {
  //         const productId = item.product_id.toString();
  //         const variantId = item.variant_id.toString();
  //         productIds.push(encodeGlobalId("Product", productId));
  //         variantIds.push(encodeGlobalId("ProductVariant", variantId));
  //         const discountValueType = item.applied_discount?.value_type;
  //         const formattedDiscountValueType =
  //           discountValueType === "percentage" ? "%" : discountValueType;
  //         const discountAmount = item.applied_discount?.amount || 0;
  //         const finalPrice =
  //           item.quantity * item.price -
  //           (discountValueType === "%"
  //             ? (item.price * item.quantity * item.applied_discount.value) / 100
  //             : discountAmount);

  //         return {
  //           productId: productId,
  //           variantId: variantId,
  //           productIds: productIds,
  //           variantIds: variantIds,
  //           title: item.title,
  //           unitPrice: item.price,
  //           quantity: item.quantity,
  //           discount: item.applied_discount
  //             ? `${item.applied_discount.value} ${formattedDiscountValueType}`
  //             : "-",
  //           finalPrice: finalPrice.toFixed(2),
  //           imageUrl: null,
  //         };
  //       }),
  //     });
  //   }
  // });

  // const productIds = Array.from(
  //   new Set(
  //     Object.values(groupedCustomerDetails)
  //       .flatMap((customer: any) =>
  //         customer.orders.flatMap((order: any) =>
  //           order.lineItems.map((item: any) =>
  //             encodeGlobalId("Product", item.productId),
  //           ),
  //         ),
  //       )
  //       .filter(Boolean),
  //   ),
  // );

  // const variantIds = Array.from(
  //   new Set(
  //     Object.values(groupedCustomerDetails)
  //       .flatMap((customer: any) =>
  //         customer.orders.flatMap((order: any) =>
  //           order.lineItems.map((item: any) =>
  //             encodeGlobalId("ProductVariant", item.variantId),
  //           ),
  //         ),
  //       )
  //       .filter(Boolean),
  //   ),
  // );

  // const productResponse = await admin.graphql(
  //   `#graphql
  //     query GetProductImages($ids: [ID!]!) {
  //       nodes(ids: $ids) {
  //         ... on Product {
  //           id
  //           images(first: 1) {
  //             edges {
  //               node {
  //                 url
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   `,
  //   { variables: { ids: productIds } },
  // );

  // const variantResponse = await admin.graphql(
  //   `#graphql
  //     query GetVariantImages($ids: [ID!]!) {
  //       nodes(ids: $ids) {
  //         ... on ProductVariant {
  //           id
  //           image {
  //             url
  //           }
  //         }
  //       }
  //     }
  //   `,
  //   { variables: { ids: variantIds } },
  // );

  // const productData = await productResponse.json();
  // const variantData = await variantResponse.json();

  // const productImages: { [key: string]: string } = {};
  // productData.data.nodes.forEach((product: any) => {
  //   if (product && product.images.edges.length > 0) {
  //     productImages[product.id] = product.images.edges[0].node.url;
  //   }
  // });

  // const variantImages: { [key: string]: string } = {};
  // variantData.data.nodes.forEach((variant: any) => {
  //   if (variant && variant.image) {
  //     variantImages[variant.id] = variant.image.url;
  //   }
  // });

  // Object.values(groupedCustomerDetails).forEach((customer: any) => {
  //   customer.orders.forEach((order: any) => {
  //     order.lineItems.forEach((item: any) => {
  //       item.imageUrl =
  //         variantImages[encodeGlobalId("ProductVariant", item.variantId)] ||
  //         productImages[encodeGlobalId("Product", item.productId)] ||
  //         null;
  //     });
  //   });
  // });

  // const customerDetails = Object.values(groupedCustomerDetails);

  // return json({ customerDetails });
  return json({ abc: "abc" });
};
