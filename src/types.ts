export interface Plant {
  id: number;
  name: string;
  category: "todos" | "interior" | "tropical";
  price: number;
  image: string;
  desc: string;
  stock?: number;
}

export interface CartItem extends Plant {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  deliveryType?: "pickup" | "delivery";
  district?: string;
  shippingFee?: number;
}

export type PaymentMethodType = "culqi" | "yape" | "plin" | "transfer";

export interface OrderDetails {
  id: string;
  items: CartItem[];
  customerInfo: CustomerInfo;
  paymentMethod: PaymentMethodType;
  transactionCode?: string;
  total: number;
  date: string;
  status: "pending" | "completed";
}
