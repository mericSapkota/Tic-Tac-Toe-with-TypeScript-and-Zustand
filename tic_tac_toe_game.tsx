/**
 * Tic Tac Toe – beginner-friendly TypeScript + Zustand (no `combine`)
 *
 * LEARNING GUIDE
 * ==============
 * Before writing TypeScript + Zustand code, ask yourself three questions:
 *
 *  1. WHAT data does my app need?          → define types / interfaces first
 *  2. WHERE does that data live?            → create a Zustand store
 *  3. HOW do components talk to that data? → pass typed props
 *
 * Reading order for this file:
 *   Types → Store → Utility functions → Components (Square → Board → Game)
 */

import React from 'react'
import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 – Define your types BEFORE writing any logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SquareValue – what can a single square hold?
 *
 * The "|" symbol means "OR" — this is called a **Union Type**.
 * TypeScript will raise an error if you try to put anything else
 * (e.g. a number or the string 'Z') into a variable typed as SquareValue.
 */
type SquareValue = 'X' | 'O' | null

/**
 * Squares – the whole 3×3 board is an array of 9 SquareValues.
 *
 * We use a named type alias so we can write `Squares` everywhere instead of
 * the longer `SquareValue[]`. Both mean exactly the same thing to TypeScript.
 */
type Squares = SquareValue[]

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 – Describe your Zustand store with an interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GameStore – the "shape" of our global state.
 *
 * An **interface** is like a contract / blueprint.
 * It says: "any object that claims to be a GameStore MUST have all of these."
 *
 * We include both the data (state) and the functions that change it (actions)
 * in the same interface.  Keeping them together makes it easy to see the full
 * picture at a glance.
 */
interface GameStore {
  // ── State ──────────────────────────────────────────────────────────────────
  /** Every board position that has been played, oldest first. */
  history: Squares[]
  /** Index into `history` that we are currently viewing (0 = start). */
  currentMove: number

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Replace the history array with a new one after each move. */
  setHistory: (nextHistory: Squares[]) => void
  /** Jump to (or record) a specific move number. */
  setCurrentMove: (nextMove: number) => void
}

/**
 * useGameStore – our Zustand store, typed with <GameStore>.
 *
 * WHY no `combine` middleware?
 * ────────────────────────────
 * `combine` splits the object you pass into "initial state" and "actions",
 * which is powerful but confusing for beginners.  The simpler pattern below
 * puts everything in one flat object and TypeScript still catches all mistakes.
 *
 * The generic `<GameStore>` tells Zustand: "the store must look exactly like
 * my GameStore interface — warn me if it doesn't."
 */
const useGameStore = create<GameStore>((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  history: [Array(9).fill(null)], // one empty board to start
  currentMove: 0,

  // ── Actions ────────────────────────────────────────────────────────────────
  // `set` is the Zustand function that merges new values into the store.
  // We pass it an object containing only the keys we want to change.
  setHistory: (nextHistory) => set({ history: nextHistory }),
  setCurrentMove: (nextMove) => set({ currentMove: nextMove }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 – Utility functions (pure logic, no React, easy to unit-test)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateWinner – scan every winning line and return 'X', 'O', or null.
 *
 * Return type annotation `: SquareValue` guarantees we only ever return
 * something that fits the SquareValue union — TypeScript will refuse to
 * compile if we accidentally return a plain string like 'win'.
 */
function calculateWinner(squares: Squares): SquareValue {
  // All eight possible winning combinations (rows, columns, diagonals).
  const lines: [number, number, number][] = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal ↘
    [2, 4, 6], // diagonal ↙
  ]

  for (const [a, b, c] of lines) {
    // squares[a] must be non-null AND the same value at b and c.
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a] // 'X' or 'O'
    }
  }

  return null // no winner yet
}

/**
 * calculateTurns – count how many squares have been filled so far.
 *
 * `filter(Boolean)` keeps only truthy values, so null squares are excluded.
 * This tells us how many moves have been played in the current position.
 */
function calculateTurns(squares: Squares): number {
  return squares.filter(Boolean).length
}

/**
 * calculateStatus – build the human-readable status message shown above the board.
 *
 * Parameters:
 *   winner – result of calculateWinner (null if nobody has won yet)
 *   turns  – result of calculateTurns  (used to detect a draw)
 *   player – whose turn it is right now ('X' or 'O')
 *
 * The literal union `'X' | 'O'` for `player` is narrower than SquareValue
 * (which also allows null).  This prevents callers from passing null here.
 */
function calculateStatus(
  winner: SquareValue,
  turns: number,
  player: 'X' | 'O',
): string {
  if (winner) return `Winner: ${winner}`
  if (turns === 9) return "It's a draw!"
  return `Next player: ${player}`
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 – Component prop interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SquareProps – what the <Square> component needs from its parent.
 *
 * Defining props in an interface makes it immediately obvious what a
 * component expects.  If you forget to pass `onSquareClick`, TypeScript
 * highlights the error before you even run the app.
 */
interface SquareProps {
  /** The current content of this square ('X', 'O', or null = empty). */
  value: SquareValue
  /** Called with no arguments when the player clicks this square. */
  onSquareClick: () => void
}

/**
 * BoardProps – what the <Board> component needs from its parent (<Game>).
 */
interface BoardProps {
  /** true when it is X's turn, false when it is O's turn. */
  xIsNext: boolean
  /** Snapshot of the 9 squares for the current move. */
  squares: Squares
  /** Called by Board with the updated squares array after a valid click. */
  onPlay: (nextSquares: Squares) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 – React components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Square – a single clickable cell on the board.
 *
 * `React.FC<SquareProps>` means:
 *   React.FC  = "React Functional Component"
 *   <SquareProps> = "…whose props must match the SquareProps interface"
 *
 * TypeScript infers the return type (JSX.Element) automatically, but writing
 * React.FC makes the component contract explicit and documents it for readers.
 */
const Square: React.FC<SquareProps> = ({ value, onSquareClick }) => {
  return (
    <button
      // Tailwind classes replace inline styles — each class maps to one CSS rule:
      //   w-16 h-16  → width/height 4rem (64px)
      //   text-2xl   → font-size 1.5rem
      //   font-bold  → font-weight 700
      //   cursor-pointer → cursor: pointer
      //   m-0.5      → margin 2px
      //   border-2 border-gray-400 → visible cell border
      //   rounded    → slightly rounded corners
      //   bg-white hover:bg-gray-100 → subtle hover feedback
      //   transition-colors → smooth color change on hover
      className="w-16 h-16 text-2xl font-bold cursor-pointer m-0.5 border-2 border-gray-400 rounded bg-white hover:bg-gray-100 transition-colors"
      onClick={onSquareClick}
    >
      {/* value is SquareValue — React renders null as nothing, which is fine */}
      {value}
    </button>
  )
}

/**
 * Board – the 3×3 grid plus a status line.
 *
 * Board does NOT own any state; it receives everything it needs via props.
 * This pattern (lifting state up to the parent) keeps Board simple and
 * easy to test.
 */
const Board: React.FC<BoardProps> = ({ xIsNext, squares, onPlay }) => {
  /**
   * handleClick – called when the player clicks square at index `i`.
   *
   * We type `i` as `number` so TypeScript knows we're dealing with an index,
   * not just any value.
   */
  function handleClick(i: number): void {
    // Ignore the click if there is already a winner or the square is filled.
    if (calculateWinner(squares) || squares[i]) return

    // slice() creates a shallow copy so we never mutate the original array
    // (immutability is a key rule in React state management).
    const nextSquares: Squares = squares.slice()
    nextSquares[i] = xIsNext ? 'X' : 'O'

    // Notify the parent (<Game>) so it can update the store.
    onPlay(nextSquares)
  }

  // Derive display values from the current board snapshot.
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player: 'X' | 'O' = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  // Helper: render one Square for position `i`.
  const renderSquare = (i: number) => (
    <Square key={i} value={squares[i]} onSquareClick={() => handleClick(i)} />
  )

  return (
    <div>
      {/* Status text — bold and with bottom spacing */}
      <p className="font-bold mb-2 text-lg">{status}</p>

      {/* Row 0: squares 0-2 */}
      <div className="flex">{[0, 1, 2].map(renderSquare)}</div>
      {/* Row 1: squares 3-5 */}
      <div className="flex">{[3, 4, 5].map(renderSquare)}</div>
      {/* Row 2: squares 6-8 */}
      <div className="flex">{[6, 7, 8].map(renderSquare)}</div>
    </div>
  )
}

/**
 * Game – the top-level component that owns state via Zustand.
 *
 * Responsibility split:
 *   Game  → reads/writes the store, builds the move list
 *   Board → renders the grid, handles click logic
 *   Square → renders one cell
 *
 * We export Game as the default export so a host app (e.g. create-react-app)
 * can import and render it directly.
 */
const Game: React.FC = () => {
  // ── Read from the Zustand store ────────────────────────────────────────────
  // Each selector picks only what this component needs.
  // Zustand re-renders Game only when the selected value changes.
  const history = useGameStore((state) => state.history)
  const currentMove = useGameStore((state) => state.currentMove)
  const setHistory = useGameStore((state) => state.setHistory)
  const setCurrentMove = useGameStore((state) => state.setCurrentMove)

  // ── Derived values (no extra state needed) ─────────────────────────────────
  // currentMove is even  → X's turn (move 0, 2, 4, …)
  // currentMove is odd   → O's turn (move 1, 3, 5, …)
  const xIsNext: boolean = currentMove % 2 === 0

  // The board snapshot we're currently viewing.
  const currentSquares: Squares = history[currentMove]

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * handlePlay – called by Board after a valid move.
   *
   * `nextSquares: Squares` — TypeScript ensures Board only passes a proper
   * board array here.  Any mismatch is caught at compile time.
   */
  function handlePlay(nextSquares: Squares): void {
    // Discard any "future" history when the player makes a new move mid-game.
    const nextHistory: Squares[] = [
      ...history.slice(0, currentMove + 1),
      nextSquares,
    ]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  /**
   * jumpTo – teleport to any previous move from the history list.
   *
   * `nextMove: number` prevents accidentally passing a string or undefined.
   */
  function jumpTo(nextMove: number): void {
    setCurrentMove(nextMove)
  }

  // ── Build the move history list ────────────────────────────────────────────
  // `history.map` iterates over every recorded board state and produces a
  // list item with a "Go to move #N" / "Go to game start" button.
  const moves = history.map((_squares: Squares, move: number) => {
    const description =
      move > 0 ? `Go to move #${move}` : 'Go to game start'

    return (
      <li key={move} className="mb-1">
        <button
          // px-3 py-1   → horizontal/vertical padding
          // rounded     → rounded corners
          // border border-gray-300 → subtle border
          // hover:bg-gray-100 → hover feedback
          // text-sm     → readable but compact text
          // cursor-pointer → shows pointer on hover
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm cursor-pointer"
          onClick={() => jumpTo(move)}
        >
          {description}
        </button>
      </li>
    )
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // flex gap-6 p-4 → horizontal layout with gap and padding
    // font-sans      → clean sans-serif font
    // min-h-screen   → fills the viewport height
    // bg-gray-50     → very light grey page background
    <div className="flex gap-6 p-4 font-sans min-h-screen bg-gray-50">
      {/* Left side: the game board */}
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>

      {/* Right side: the move history list */}
      <div>
        <h3 className="mt-0 mb-2 text-lg font-semibold">Move history</h3>
        <ol className="pl-5 m-0 list-decimal">{moves}</ol>
      </div>
    </div>
  )
}

export default Game
