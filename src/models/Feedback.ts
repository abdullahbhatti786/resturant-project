import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  customerId?: mongoose.Types.ObjectId;
  ratings: {
    food: number;
    service: number;
    cleanliness: number;
    waitingTime: number;
  };
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    tableNumber: { type: Number, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    ratings: {
      food: { type: Number, required: true, min: 1, max: 5 },
      service: { type: Number, required: true, min: 1, max: 5 },
      cleanliness: { type: Number, required: true, min: 1, max: 5 },
      waitingTime: { type: Number, required: true, min: 1, max: 5 },
    },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

FeedbackSchema.index({ restaurantId: 1, createdAt: -1 });

export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
export default Feedback;
