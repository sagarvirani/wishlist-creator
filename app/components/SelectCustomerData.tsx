import React, { useCallback } from "react";
import { Select } from "@shopify/polaris";

export type SelectDataProps = {
  options: { label: string; value: string }[];
  selectedCustomer: string;
  selectedCustomerDetails: any;
  selectedOrder: any;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<string>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<any>>;
};

export default function SelectData({
  options,
  selectedCustomer,
  selectedCustomerDetails,
  selectedOrder,
  setSelectedCustomer,
  setSelectedOrder,
}: SelectDataProps) {
  // Function to handle customer change
  const handleCustomerChange = useCallback(
    (value: string) => {
      setSelectedCustomer(value);
    },
    [setSelectedCustomer],
  );

  // Function to handle order change
  const handleOrderChange = useCallback(
    (value: any) => {
      const selectedOrderId = value.toString();
      const newSelectedOrder = selectedCustomerDetails?.orders.find(
        (order: any) => order.orderId.toString() === selectedOrderId,
      );
      setSelectedOrder(newSelectedOrder);
    },
    [selectedCustomerDetails, setSelectedOrder],
  );

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
  return (
    <div>
      <Select
        label="Select Customer"
        options={options}
        onChange={handleCustomerChange}
        value={selectedCustomer}
      />
      {selectedCustomerDetails && (
        <Select
          label="Select Order"
          options={selectedCustomerDetails.orders.map((order: any) => ({
            label: `${formatDate(order.createdAt)}`,
            value: order.orderId,
          }))}
          onChange={handleOrderChange}
          value={selectedOrder?.orderId}
        />
      )}
    </div>
  );
}
