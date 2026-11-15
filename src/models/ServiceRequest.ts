import mongoose, { Schema, Document, Model } from "mongoose";

export interface IServiceRequest extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  type: "water" | "bill" | "waiter" | "other";
  note?: string;
  status: "submitted" | "acknowledged" | "in_progress" | "resolved";
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    tableNumber: { type: Number, required: true },
    type: { type: String, enum: ["water", "bill", "waiter", "other"], required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "acknowledged", "in_progress", "resolved"],
      default: "submitted",
      index: true,
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ restaurantId: 1, tableNumber: 1, type: 1, createdAt: -1 });

export const ServiceRequest: Model<IServiceRequest> =
  mongoose.models.ServiceRequest ||
  mongoose.model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);
export default ServiceRequest;
