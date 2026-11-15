import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  wifiName?: string;
  wifiPassword?: string;
  tableCount: number;
  enabledGames: {
    tictactoe: boolean;
    memory: boolean;
    quiz: boolean;
  };
  loyaltyRules: {
    requiredVisits: number;
    withinDays: number;
    giftDescription: string;
    rewardExpiryDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, default: "/images/placeholder-logo.svg" },
    address: { type: String, default: "Gulberg III, Lahore" },
    wifiName: { type: String, default: "CafeLahore_Guest" },
    wifiPassword: { type: String, default: "karakchai123" },
    tableCount: { type: Number, default: 20 },
    enabledGames: {
      tictactoe: { type: Boolean, default: true },
      memory: { type: Boolean, default: true },
      quiz: { type: Boolean, default: true },
    },
    loyaltyRules: {
      requiredVisits: { type: Number, default: 2 },
      withinDays: { type: Number, default: 30 },
      giftDescription: { type: String, default: "Free Peshawari Kulfa" },
      rewardExpiryDays: { type: Number, default: 14 },
    },
  },
  { timestamps: true }
);

export const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant || mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);
export default Restaurant;
