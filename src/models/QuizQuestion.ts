import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizQuestion extends Document {
  question: string;
  options: string[];
  correctIndex: number;
  category: "general" | "pakistan" | "cricket";
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    category: { type: String, enum: ["general", "pakistan", "cricket"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const QuizQuestion: Model<IQuizQuestion> =
  mongoose.models.QuizQuestion ||
  mongoose.model<IQuizQuestion>("QuizQuestion", QuizQuestionSchema);
export default QuizQuestion;
