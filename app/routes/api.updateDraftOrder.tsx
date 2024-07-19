import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader: LoaderFunction = async () => {
  return new Response(null, { status: 405 });
};

export const action: ActionFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const requestData = await request.json();
  //console.log("request data=", requestData);
  const { draftOrderId, updatedData } = requestData;

  if (!draftOrderId || !updatedData) {
    return json(
      { error: "Missing draftOrderId or updatedData" },
      { status: 400 },
    );
  }

  try {
    const draft_order = new admin.rest.resources.DraftOrder({
      session: session,
    });
    draft_order.id = draftOrderId;
   
    // Update line items
    if (updatedData.line_items) {
      // Map the structure of updated line items to match the structure expected by draft_order.line_items
      const mappedLineItems = updatedData.line_items.map((item: any) => ({
        variant_id: item.id,
        quantity: item.quantity,
      }));

      // Set the line items to the mapped line items
      draft_order.line_items = mappedLineItems;
    }

    await draft_order.save({
      update: true,
    });
    //console.log("draft order=", draft_order);

    return json(draft_order, { status: 200 });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
