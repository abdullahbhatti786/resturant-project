"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export default function GamesHubPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [activeGame, setActiveGame] = useState<"hub" | "tictactoe" | "memory" | "quiz">("hub");

  // Tic Tac Toe State
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  // Memory Match State
  const initialCards = [
    "local_cafe",
    "skillet",
    "kebab_dining",
    "ramen_dining",
    "icecream",
    "set_meal",
    "local_cafe",
    "skillet",
    "kebab_dining",
    "ramen_dining",
    "icecream",
    "set_meal",
  ];
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Initialize Memory Game
  const startMemoryGame = () => {
    const shuffled = [...initialCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  // Initialize Quiz
  const startQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const res = await fetch(`/api/r/${slug}/quiz`);
      const data = await res.json();
      if (data.success && data.questions) {
        setQuizQuestions(data.questions);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setQuizScore(0);
        setQuizFinished(false);
      }
    } catch {
      alert("Failed to load quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (activeGame === "memory") startMemoryGame();
    if (activeGame === "quiz") startQuiz();
  }, [activeGame]);

  // Tic Tac Toe Check
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every((sq) => sq !== null)) return "Tie";
    return null;
  };

  const handleTttClick = (index: number) => {
    if (board[index] || tttWinner) return;
    const nextBoard = [...board];
    nextBoard[index] = xIsNext ? "X" : "O";
    setBoard(nextBoard);
    const win = checkWinner(nextBoard);
    if (win) {
      setTttWinner(win);
    } else {
      setXIsNext(!xIsNext);
    }
  };

  const resetTtt = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setTttWinner(null);
  };

  // Memory Click
  const handleCardClick = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    const nextFlipped = [...flipped, idx];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = nextFlipped;
      if (cards[first] === cards[second]) {
        setMatched((prev) => [...prev, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  // Quiz Answer
  const handleAnswerSelect = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === quizQuestions[currentQ].correctIndex) {
      setQuizScore((s) => s + 10);
    }
    setTimeout(() => {
      if (currentQ + 1 < quizQuestions.length) {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1200);
  };

  return (
    <CustomerLayout>
      <div className="p-4 flex flex-col gap-4">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeGame !== "hub" ? (
              <button
                onClick={() => setActiveGame("hub")}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
            ) : (
              <Link
                href={`/r/${slug}/menu`}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </Link>
            )}
            <h2 className="font-bold text-base text-on-surface">
              {activeGame === "hub"
                ? "Dine & Play Hub"
                : activeGame === "tictactoe"
                ? "Tic-Tac-Toe (2 Players)"
                : activeGame === "memory"
                ? "Desi Food Memory Match"
                : "Desi Trivia Quiz"}
            </h2>
          </div>
        </div>

        {/* HUB SELECTOR */}
        {activeGame === "hub" && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-primary-container/15 border border-primary-container/30">
              <h3 className="font-extrabold text-sm text-on-surface">Table Entertainment</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Play on this single screen with your friends and family while your order is prepared!
              </p>
            </div>

            {/* Game 1: Tic Tac Toe */}
            <button
              onClick={() => {
                resetTtt();
                setActiveGame("tictactoe");
              }}
              className="w-full p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between shadow-xs hover:border-primary transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">grid_3x3</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                    Tic-Tac-Toe (Kaanta-Zero)
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Classic 2-player pass & play game.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                chevron_right
              </span>
            </button>

            {/* Game 2: Memory Match */}
            <button
              onClick={() => setActiveGame("memory")}
              className="w-full p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between shadow-xs hover:border-primary transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">style</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                    Food Memory Match
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Flip cards and match pairs of Pakistani treats.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                chevron_right
              </span>
            </button>

            {/* Game 3: Desi Quiz */}
            <button
              onClick={() => setActiveGame("quiz")}
              className="w-full p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between shadow-xs hover:border-primary transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">quiz</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                    Desi Trivia Quiz
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    10 questions on Pakistani cricket, culture & food.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                chevron_right
              </span>
            </button>
          </div>
        )}

        {/* TIC TAC TOE */}
        {activeGame === "tictactoe" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm flex flex-col items-center">
            <div className="mb-4 text-center">
              {tttWinner ? (
                <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  {tttWinner === "Tie" ? "Match Draw!" : `Player ${tttWinner} Won! 🎉`}
                </div>
              ) : (
                <div className="text-xs font-bold text-on-surface">
                  Turn: Player <span className="text-primary font-extrabold">{xIsNext ? "X" : "O"}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-64 h-64 mb-6">
              {board.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTttClick(idx)}
                  className={`w-full h-full rounded-2xl border text-3xl font-extrabold flex items-center justify-center transition-all ${
                    sq === "X"
                      ? "border-primary bg-primary/10 text-primary"
                      : sq === "O"
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-outline-variant/40 bg-surface hover:bg-surface-container active:scale-95"
                  }`}
                >
                  {sq}
                </button>
              ))}
            </div>

            <button
              onClick={resetTtt}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs"
            >
              Play Again
            </button>
          </div>
        )}

        {/* MEMORY MATCH */}
        {activeGame === "memory" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 shadow-sm flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4 px-2 text-xs font-bold text-on-surface">
              <span>Moves: {moves}</span>
              <span>Matched: {matched.length / 2} / 6</span>
            </div>

            {matched.length === 12 ? (
              <div className="my-8 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">
                  celebration
                </span>
                <h4 className="font-bold text-base text-on-surface">Mubarak! All Matched!</h4>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">Completed in {moves} moves.</p>
                <button
                  onClick={startMemoryGame}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-4">
                {cards.map((icon, idx) => {
                  const isFlipped = flipped.includes(idx) || matched.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCardClick(idx)}
                      className={`h-20 rounded-2xl border flex items-center justify-center transition-all text-2xl ${
                        isFlipped
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {isFlipped ? (
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-xl text-on-surface-variant/40">
                          help
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* QUIZ */}
        {activeGame === "quiz" && (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 shadow-sm">
            {loadingQuiz ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">Loading trivia questions...</div>
            ) : quizFinished ? (
              <div className="p-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-3xl">emoji_events</span>
                </div>
                <h3 className="font-extrabold text-base text-on-surface">Quiz Completed!</h3>
                <p className="text-2xl font-black text-primary my-2">{quizScore} / 100 Points</p>
                <p className="text-xs text-on-surface-variant mb-6">
                  {quizScore >= 80
                    ? "SubhanAllah! Desi Culture Master! 🌟"
                    : quizScore >= 50
                    ? "Bohat Aala! Good Effort! 👍"
                    : "Agli baar aur behtar! Try again! 💪"}
                </p>
                <button
                  onClick={startQuiz}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs"
                >
                  Play Another Round
                </button>
              </div>
            ) : quizQuestions.length > 0 ? (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant mb-3">
                  <span>Question {currentQ + 1} of {quizQuestions.length}</span>
                  <span className="text-primary font-bold">Score: {quizScore}</span>
                </div>

                <h3 className="font-bold text-sm text-on-surface mb-4 leading-snug">
                  {quizQuestions[currentQ].question}
                </h3>

                <div className="space-y-2.5">
                  {quizQuestions[currentQ].options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === quizQuestions[currentQ].correctIndex;
                    let style = "bg-surface border-outline-variant/40 hover:bg-surface-container";

                    if (selectedAnswer !== null) {
                      if (isCorrect) {
                        style = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
                      } else if (isSelected) {
                        style = "bg-rose-50 border-rose-500 text-rose-900 font-bold";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {selectedAnswer !== null && isCorrect && (
                          <span className="material-symbols-outlined text-emerald-600 text-base">
                            check_circle
                          </span>
                        )}
                        {selectedAnswer !== null && isSelected && !isCorrect && (
                          <span className="material-symbols-outlined text-rose-600 text-base">
                            cancel
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
