import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReward extends Document {
  restaurantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  code: string;
  description: string;
  status: "active" | "redeemed" | "expired";
  expiresAt: Date;
  redeemedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "redeemed", "expired"],
      default: "active",
      index: true,
    },
    expiresAt: { type: Date, required: true },
    redeemedAt: { type: Date },
  },
  { timestamps: true }
);

RewardSchema.index({ restaurantId: 1, customerId: 1, createdAt: -1 });

export const Reward: Model<IReward> =
  mongoose.models.Reward || mongoose.model<IReward>("Reward", RewardSchema);
export default Reward;
