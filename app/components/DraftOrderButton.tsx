import { Button } from "@shopify/polaris";

export type DraftOrderButtonProps = {
  selectedOrder: any;
  quantities: { [key: string]: number };
  isDisabled: boolean;
  setOrderModified: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function DraftOrderButton({
  selectedOrder,
  quantities,
  isDisabled,
  setOrderModified,
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update draft order");
      }
      setOrderModified(false);
      shopify.toast.show("Draft order updated successfully");
    } catch (error: any) {
      shopify.toast.show(error.message || "Failed to update draft order");
    }
  };

  return (
    <Button
      variant="primary"
      size="large"
      textAlign="center"
      onClick={saveDraftOrder}
      disabled={isDisabled}
    >
      Save Draft Order
    </Button>
  );
}
