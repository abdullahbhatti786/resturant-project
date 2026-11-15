import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  restaurantId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  marketingConsent: boolean;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    marketingConsent: { type: Boolean, default: false },
    lastVisit: { type: Date },
  },
  { timestamps: true }
);

CustomerSchema.index({ restaurantId: 1, email: 1 }, { unique: true });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export default Customer;
