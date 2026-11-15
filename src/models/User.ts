import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "waiter" | "kitchen";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "waiter", "kitchen"], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ restaurantId: 1, email: 1 }, { unique: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
