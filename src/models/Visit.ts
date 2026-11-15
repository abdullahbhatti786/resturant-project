import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisit extends Document {
  restaurantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VisitSchema.index({ restaurantId: 1, customerId: 1, date: 1 }, { unique: true });

export const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
export default Visit;
