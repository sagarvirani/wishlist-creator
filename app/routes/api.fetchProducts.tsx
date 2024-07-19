import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader: LoaderFunction = async () => {
  return new Response(null, { status: 405 });
};

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const requestData = await request.json();
  const { query } = requestData;

  if (!query) {
    return json({ error: "Missing input query" }, { status: 400 });
  }

  try {
    let products: any[] = [];
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
      const response = await admin.graphql(
        `#graphql
          query inventoryItems($query: String!, $after: String) {
            products(first: 250, query: $query, after: $after) {
              edges {
                node {
                  id
                  handle
                  title
                  description
                  featuredImage {
                    url
                  }
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  status
                  totalInventory
                  variantsCount {
                    count
                  }
                  variants(first: 50) {
                    edges {
                      node {
                        id
                        title
                        image {
                          url
                        }
                        inventoryQuantity
                        price
                      }
                    }
                  }
                }
              }
               pageInfo {
                hasPreviousPage
                hasNextPage
                endCursor
                startCursor
              }
            }
          }`,
        {
          variables: { query: `title:*${query}*`, after: endCursor },
        },
      );

      const data: any = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const newProducts = data.data.products.edges.map(
        (edge: any) => edge.node,
      );
      products = products.concat(newProducts);
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      endCursor = data.data.products.pageInfo.endCursor;
      //console.log("has=", data.data.products.pageInfo);
    }

    return json({ products }, { status: 200 });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
