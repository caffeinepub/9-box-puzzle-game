import { Button } from "@/components/ui/button";
import { RotateCcw, Shuffle, Star, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Game Logic ---

function fisherYatesShuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function isSolved(tiles: number[]): boolean {
  return tiles.every((v, i) => v === SOLVED[i]);
}

function createShuffled(): number[] {
  let shuffled = fisherYatesShuffle(SOLVED);
  // Ensure it's not accidentally solved on start
  while (isSolved(shuffled)) {
    shuffled = fisherYatesShuffle(SOLVED);
  }
  return shuffled;
}

// --- Confetti Particle ---
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

const CONFETTI_COLORS = [
  "oklch(0.82 0.16 85)", // gold
  "oklch(0.72 0.20 30)", // orange
  "oklch(0.75 0.18 140)", // green
  "oklch(0.72 0.22 260)", // blue
  "oklch(0.80 0.18 320)", // pink
  "oklch(0.90 0.08 100)", // cream
];

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 1.5,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

// Static star positions for decorative background
const STAR_POSITIONS = [
  { id: 1, size: 2, top: 8, left: 15, opacity: 0.5 },
  { id: 2, size: 1.5, top: 22, left: 73, opacity: 0.4 },
  { id: 3, size: 2.5, top: 35, left: 42, opacity: 0.6 },
  { id: 4, size: 1, top: 50, left: 88, opacity: 0.35 },
  { id: 5, size: 2, top: 65, left: 5, opacity: 0.55 },
  { id: 6, size: 1.5, top: 78, left: 60, opacity: 0.45 },
  { id: 7, size: 2, top: 12, left: 90, opacity: 0.5 },
  { id: 8, size: 1, top: 45, left: 28, opacity: 0.3 },
  { id: 9, size: 2.5, top: 88, left: 33, opacity: 0.6 },
  { id: 10, size: 1.5, top: 5, left: 55, opacity: 0.4 },
  { id: 11, size: 1, top: 95, left: 78, opacity: 0.35 },
  { id: 12, size: 2, top: 58, left: 18, opacity: 0.5 },
  { id: 13, size: 1.5, top: 30, left: 95, opacity: 0.45 },
  { id: 14, size: 2.5, top: 72, left: 48, opacity: 0.55 },
  { id: 15, size: 1, top: 18, left: 38, opacity: 0.3 },
  { id: 16, size: 2, top: 82, left: 12, opacity: 0.5 },
  { id: 17, size: 1.5, top: 42, left: 67, opacity: 0.4 },
  { id: 18, size: 2, top: 60, left: 82, opacity: 0.45 },
  { id: 19, size: 1, top: 25, left: 10, opacity: 0.35 },
  { id: 20, size: 2.5, top: 90, left: 55, opacity: 0.6 },
];

// --- Main Component ---

export default function App() {
  const [tiles, setTiles] = useState<number[]>(createShuffled);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const s = localStorage.getItem("puzzle-best-score");
    return s ? Number.parseInt(s) : null;
  });

  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTileClick = useCallback(
    (index: number) => {
      if (index === 0 || won) return;

      setAnimatingIndex(index);
      setTimeout(() => setAnimatingIndex(null), 250);

      setTiles((prev) => {
        const next = [...prev];
        [next[index], next[index - 1]] = [next[index - 1], next[index]];
        return next;
      });

      setMoves((prev) => {
        const next = prev + 1;
        return next;
      });
    },
    [won],
  );

  // Check win after tiles/moves update
  useEffect(() => {
    if (isSolved(tiles) && moves > 0) {
      setWon(true);
      setConfetti(generateConfetti());
      // Update best score
      setBestScore((prev) => {
        const newBest = prev === null || moves < prev ? moves : prev;
        localStorage.setItem("puzzle-best-score", String(newBest));
        return newBest;
      });
    }
  }, [tiles, moves]);

  const handleShuffle = useCallback(() => {
    setTiles(createShuffled());
    setMoves(0);
    setWon(false);
    setConfetti([]);
    setAnimatingIndex(null);
  }, []);

  const isInOrder = useCallback(
    (index: number) => {
      return tiles[index] === SOLVED[index];
    },
    [tiles],
  );

  const solvedCount = tiles.filter((v, i) => v === SOLVED[i]).length;
  const progress = Math.round((solvedCount / 9) * 100);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Starfield background */}
      <div className="starfield" aria-hidden="true" />

      {/* Floating star decorations - static positions for performance */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {STAR_POSITIONS.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              background: "oklch(0.95 0.05 270)",
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5" style={{ color: "oklch(0.82 0.16 85)" }} />
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "oklch(0.65 0.08 265)" }}
            >
              Number Puzzle
            </span>
            <Zap className="w-5 h-5" style={{ color: "oklch(0.82 0.16 85)" }} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold title-shimmer leading-tight">
            Arrange Numbers 1 to 9
            <br />
            <span className="text-xl sm:text-2xl">in Order</span>
          </h1>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4 pb-8">
        <AnimatePresence mode="wait">
          {!won ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center gap-6"
            >
              {/* Stats bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-6"
              >
                <div className="text-center">
                  <div
                    className="text-3xl font-display font-black"
                    style={{ color: "oklch(0.82 0.16 85)" }}
                  >
                    {moves}
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "oklch(0.60 0.05 265)" }}
                  >
                    Moves
                  </div>
                </div>

                {bestScore !== null && (
                  <>
                    <div
                      className="w-px h-10"
                      style={{ background: "oklch(0.35 0.06 265)" }}
                    />
                    <div className="text-center">
                      <div
                        className="text-3xl font-display font-black"
                        style={{ color: "oklch(0.75 0.18 140)" }}
                      >
                        {bestScore}
                      </div>
                      <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: "oklch(0.60 0.05 265)" }}
                      >
                        Best
                      </div>
                    </div>
                  </>
                )}

                <div
                  className="w-px h-10"
                  style={{ background: "oklch(0.35 0.06 265)" }}
                />

                <div className="text-center">
                  <div
                    className="text-3xl font-display font-black"
                    style={{ color: "oklch(0.72 0.18 200)" }}
                  >
                    {progress}%
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "oklch(0.60 0.05 265)" }}
                  >
                    Done
                  </div>
                </div>
              </motion.div>

              {/* Puzzle grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                aria-label="Number puzzle grid"
                className="p-4 rounded-2xl"
                style={{
                  background: "oklch(0.16 0.05 265 / 0.6)",
                  border: "1px solid oklch(0.35 0.08 265 / 0.5)",
                  backdropFilter: "blur(12px)",
                  boxShadow:
                    "0 20px 60px oklch(0 0 0 / 0.5), 0 4px 12px oklch(0 0 0 / 0.3)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 100px)",
                    gap: "8px",
                  }}
                >
                  {tiles.map((num, index) => (
                    <motion.button
                      key={`tile-${num}`}
                      ref={(el) => {
                        tileRefs.current[index] = el;
                      }}
                      className={`puzzle-tile ${isInOrder(index) ? "tile-solved" : ""} ${
                        animatingIndex === index ? "tile-animate" : ""
                      }`}
                      aria-label={`Tile ${num}${index === 0 ? ", cannot move" : ", click to move left"}`}
                      aria-disabled={index === 0}
                      onClick={() => handleTileClick(index)}
                      layout
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 400,
                          damping: 28,
                        },
                      }}
                      whileTap={index > 0 ? { scale: 0.93 } : {}}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Progress hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-center max-w-xs"
                style={{ color: "oklch(0.58 0.05 265)" }}
              >
                {solvedCount === 0
                  ? "Click any tile to swap it with the one before it"
                  : solvedCount < 5
                    ? `${solvedCount} tile${solvedCount > 1 ? "s" : ""} in place — keep going!`
                    : solvedCount < 8
                      ? `Almost there! ${9 - solvedCount} more to go`
                      : solvedCount === 8
                        ? "One more move! You're so close!"
                        : "Click to solve it!"}
              </motion.p>

              {/* Shuffle button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleShuffle}
                  variant="outline"
                  className="gap-2 font-semibold px-6 py-2 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: "oklch(0.35 0.08 265)",
                    color: "oklch(0.82 0.16 85)",
                    background: "oklch(0.20 0.05 265 / 0.8)",
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="win"
              className="flex flex-col items-center gap-6 text-center max-w-sm w-full"
            >
              {/* Confetti */}
              <div
                className="fixed inset-0 pointer-events-none overflow-hidden z-20"
                aria-hidden="true"
              >
                {confetti.map((piece) => (
                  <div
                    key={piece.id}
                    className="absolute"
                    style={{
                      left: `${piece.x}%`,
                      top: "-10px",
                      width: `${piece.size}px`,
                      height: `${piece.size}px`,
                      background: piece.color,
                      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                      transform: `rotate(${piece.rotation}deg)`,
                      animation: `confetti-drift ${1.5 + Math.random() * 2}s ease-in ${piece.delay}s forwards`,
                      opacity: 0,
                    }}
                  />
                ))}
              </div>

              {/* Win card */}
              <div className="win-card relative z-30 w-full">
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "oklch(0.18 0.06 265 / 0.9)",
                    border: "2px solid oklch(0.82 0.16 85 / 0.5)",
                    backdropFilter: "blur(20px)",
                    boxShadow:
                      "0 0 60px oklch(0.82 0.16 85 / 0.2), 0 20px 60px oklch(0 0 0 / 0.5)",
                  }}
                >
                  {/* Win image */}
                  <div className="relative">
                    <img
                      src="/assets/uploads/Snapchat-1151831458-1.jpg"
                      alt="Victory celebration"
                      className="w-full object-cover"
                      style={{ maxHeight: "300px" }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 50%, oklch(0.18 0.06 265))",
                      }}
                    />
                  </div>

                  {/* Win message */}
                  <div className="px-6 pb-6 pt-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star
                          className="w-5 h-5 fill-current"
                          style={{ color: "oklch(0.82 0.16 85)" }}
                        />
                        <Trophy
                          className="w-6 h-6"
                          style={{ color: "oklch(0.82 0.16 85)" }}
                        />
                        <Star
                          className="w-5 h-5 fill-current"
                          style={{ color: "oklch(0.82 0.16 85)" }}
                        />
                      </div>
                      <h2 className="font-display text-2xl font-extrabold title-shimmer mb-1">
                        Puzzle Solved!
                      </h2>
                      <p
                        className="text-base font-semibold mb-1"
                        style={{ color: "oklch(0.85 0.05 270)" }}
                      >
                        Completed in{" "}
                        <span
                          className="font-display text-2xl font-black"
                          style={{ color: "oklch(0.82 0.16 85)" }}
                        >
                          {moves}
                        </span>{" "}
                        move{moves !== 1 ? "s" : ""}
                      </p>
                      {bestScore !== null && moves === bestScore && (
                        <motion.p
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.5,
                            type: "spring",
                            stiffness: 300,
                          }}
                          className="text-sm font-semibold mb-3"
                          style={{ color: "oklch(0.75 0.18 140)" }}
                        >
                          🏆 New personal best!
                        </motion.p>
                      )}
                      {bestScore !== null && moves > bestScore && (
                        <p
                          className="text-xs mb-3"
                          style={{ color: "oklch(0.60 0.05 265)" }}
                        >
                          Best: {bestScore} moves
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={handleShuffle}
                        className="w-full gap-2 font-bold text-base py-3 rounded-xl transition-all duration-200 animate-pulse-gold"
                        style={{
                          background: "oklch(0.82 0.16 85)",
                          color: "oklch(0.12 0.03 265)",
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Play Again
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center">
        <p className="text-xs" style={{ color: "oklch(0.45 0.04 265)" }}>
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors duration-200"
            style={{ color: "oklch(0.60 0.05 265)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
