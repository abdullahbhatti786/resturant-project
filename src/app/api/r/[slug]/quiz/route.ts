import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import QuizQuestion from "@/models/QuizQuestion";

export async function GET() {
  try {
    await connectToDatabase();
    // Fetch 10 random questions
    const questions = await QuizQuestion.aggregate([{ $sample: { size: 10 } }]);

    return NextResponse.json({
      success: true,
      questions: questions.map((q) => ({
        id: q._id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        category: q.category,
      })),
    });
  } catch (err: unknown) {
    console.error("Quiz questions error:", err);
    return NextResponse.json({ success: false, message: "Failed to load quiz" }, { status: 500 });
  }
}
