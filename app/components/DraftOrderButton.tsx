import { Button } from "@shopify/polaris";

export type DraftOrderButtonProps = {
  selectedOrder: any;
  quantities: { [key: string]: number };
};

export default function DraftOrderButton({
  selectedOrder,
  quantities,
}: DraftOrderButtonProps) {
  const saveDraftOrder = async () => {
    try {
      const draftOrderId = selectedOrder.orderId;
      const updatedLineItems = selectedOrder.lineItems.map((item: any) => ({
        id: item.variantId,
        quantity: quantities[item.productId] || item.quantity,
      }));

      const updatedData = {
        line_items: updatedLineItems,
      };
      console.log('updated data to be send to resource route=', updatedData);

      const response = await fetch("/api/updateDraftOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftOrderId,
          updatedData,
        }),
      });

      console.log('res=', response);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update draft order");
      }

      // Display success message or handle success state
      shopify.toast.show("Draft order updated successfully");
    } catch (error: any) {
      // Display error message or handle error state
      shopify.toast.show(error.message || "Failed to update draft order");
    }
  };

  return (
    <Button
      variant="primary"
      size="large"
      textAlign="center"
      onClick={saveDraftOrder}
    >
      Save Draft Order
    </Button>
  );
}
