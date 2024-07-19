import React, { useCallback } from "react";
import { Select } from "@shopify/polaris";

export type SelectDataProps = {
  options: { label: string; value: string }[];
  selectedCustomer: string;
  selectedCustomerDetails: any;
  selectedOrder: any;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<string>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<any>>;
  setOrderModified: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function SelectCustomerData({
  options,
  selectedCustomer,
  selectedCustomerDetails,
  selectedOrder,
  setSelectedCustomer,
  setSelectedOrder,
  setOrderModified,
}: SelectDataProps) {
  // Function to handle customer change
  const handleCustomerChange = useCallback(
    (value: string) => {
      setSelectedCustomer(value);
      setOrderModified(false);
    },
    
    [setOrderModified, setSelectedCustomer],
  );

  // Function to handle order change
  const handleOrderChange = useCallback(
    (value: any) => {
      const selectedOrderId = value.toString();
      const newSelectedOrder = selectedCustomerDetails?.orders.find(
        (order: any) => order.orderId.toString() === selectedOrderId,
      );
      setSelectedOrder(newSelectedOrder);
      setOrderModified(false);
    },
    [selectedCustomerDetails?.orders, setOrderModified, setSelectedOrder],
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
    <>
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
      <div>
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
      </div>
    </>
  );
}
