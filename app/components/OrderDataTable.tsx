import {
  Card,
  DataTable,
  Thumbnail,
  TextField,
  Button,
} from "@shopify/polaris";

import { DeleteIcon } from "@shopify/polaris-icons";

export type LineItem = {
  imageUrl: string | null;
  title: string;
  unitPrice: number;
  productId: string;
  discount: string;
};

export type OrderDataTableProps = {
  selectedOrder: {
    lineItems: LineItem[];
  };
  quantities: { [productId: string]: number };
  setQuantities: React.Dispatch<
    React.SetStateAction<{ [productId: string]: number }>
  >;
  setSelectedOrder: React.Dispatch<
    React.SetStateAction<{
      lineItems: LineItem[];
    }>
  >;
  setOrderModified: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function OrderDataTable({
  selectedOrder,
  quantities,
  setQuantities,
  setSelectedOrder,
  setOrderModified,
}: OrderDataTableProps) {
  // Function to handle quantity change
  const handleQuantityChange = (productId: string, value: string) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      // Update quantities
      setQuantities((prevQuantities: any) => ({
        ...prevQuantities,
        [productId]: parsedValue,
      }));

      // Update selectedOrder
      setSelectedOrder((prevSelectedOrder) => ({
        ...prevSelectedOrder,
        lineItems: prevSelectedOrder.lineItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: parsedValue }
            : item,
        ),
      }));

      // Mark the order as modified
      setOrderModified(true);
    }
  };

  // Function to handle deletion
  const handleDelete = (productId: string) => {
    // Remove the item from the lineItems list
    const updatedLineItems = selectedOrder.lineItems.filter(
      (item) => item.productId !== productId,
    );
    setSelectedOrder((prevSelectedOrder) => ({
      ...prevSelectedOrder,
      lineItems: updatedLineItems,
    }));

    // Mark the order as modified
    setOrderModified(true);
  };

  return (
    <Card>
      <DataTable
        columnContentTypes={[
          "text",
          "text",
          "numeric",
          "numeric",
          "numeric",
          "numeric",
          "numeric",
        ]}
        headings={[
          "Image",
          "Title",
          "Price/Unit",
          "Quantity",
          "Discount",
          "Final Price",
          "",
        ]}
        rows={selectedOrder.lineItems.map((item: any, index: number) => [
          item.imageUrl ? (
            <Thumbnail source={item.imageUrl} alt={item.title} />
          ) : (
            "No Image"
          ),
          item.title,
          item.unitPrice,
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <div style={{ width: "80px" }}>
              <TextField
                label="Quantity"
                labelHidden
                type="number"
                value={quantities[item.productId]?.toString() || "0"}
                onChange={(value) =>
                  handleQuantityChange(item.productId, value)
                }
                autoComplete="off"
              />
            </div>
          </div>,
          <div key={index}>{item.discount}</div>,
          <div key={index}>
            {item.discount !== "-" && (
              <span style={{ textDecoration: "line-through" }}>
                {(item.unitPrice * quantities[item.productId]).toFixed(2)}
              </span>
            )}
            <div>
              {item.discount !== "-"
                ? (
                    item.unitPrice * quantities[item.productId] -
                    (item.discount.includes("%")
                      ? (item.unitPrice *
                          quantities[item.productId] *
                          parseFloat(item.discount)) /
                        100
                      : parseFloat(item.discount))
                  ).toFixed(2)
                : (item.unitPrice * quantities[item.productId]).toFixed(2)}
            </div>
          </div>,
          <div key={index}>
            <Button
              variant="plain"
              icon={DeleteIcon}
              accessibilityLabel="Remove item"
              onClick={() => handleDelete(item.productId)}
            />
          </div>,
        ])}
        totals={[
          "", // Image column doesn't have a total
          "", // Title column doesn't have a total
          "", // Price/Unit column doesn't have a total
          Object.values(quantities).reduce(
            (totalQuantity, quantity) => totalQuantity + quantity,
            0,
          ), // Total quantity
          "", // Discount column doesn't have a total
          selectedOrder.lineItems
            .reduce(
              (totalPrice, item) =>
                totalPrice +
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
            .toFixed(2), // Total final price
          "",
        ]}
        showTotalsInFooter
      />
    </Card>
  );
}
