import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  customerId?: mongoose.Types.ObjectId;
  publicToken: string;
  items: IOrderItem[];
  total: number;
  status: "received" | "preparing" | "ready" | "served";
  paymentStatus: "unpaid" | "bill_requested" | "paid";
  paymentMethod?: "cash" | "card" | "online";
  paidAt?: Date;
  paidByStaffId?: mongoose.Types.ObjectId;
  billRequestedAt?: Date;
  servedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    specialInstructions: { type: String, maxlength: 200, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    tableNumber: { type: Number, required: true, min: 1 },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    publicToken: { type: String, required: true, unique: true, index: true },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["received", "preparing", "ready", "served"],
      default: "received",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "bill_requested", "paid"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash",
    },
    paidAt: { type: Date },
    paidByStaffId: { type: Schema.Types.ObjectId, ref: "User" },
    billRequestedAt: { type: Date },
    servedAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ restaurantId: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
