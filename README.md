# Implication Table — Interactive FSM State Minimization Tool

An interactive web application that performs **Finite State Machine (FSM) state minimization** for both **Mealy** and **Moore** sequential logic networks using the **Implication Table algorithm**.

**Live Demo:** [https://yasseenkamel.github.io/Implication-Table/](https://yasseenkamel.github.io/Implication-Table/)

---

## Key Features

- **Configurable FSM Specifications**: Supports **0–5 binary inputs** ($n$, automatically generating $2^n$ next-state columns), configurable outputs ($m$), and instant switching between **Mealy** and **Moore** machine representations.
- **Dynamic State-Transition Table Editor**: Automatically expands rows as new states are entered, supports deleting arbitrary states, and validates binary output entries.
- **Step-by-Step Implication Table Visualization**:
  - Evaluates initial state-pair compatibility based on matching output vectors (`first_implications`).
  - Records next-state pair dependencies when outputs match.
  - Iteratively propagates incompatibilities (`Previous` / `Next` step navigation) until convergence, color-coding equivalent pairs (green) and incompatible pairs (red).
- **Equivalence Class Partitioning & Minimized Table Output**:
  - Builds a compatibility graph over surviving state pairs and runs Depth-First Search (DFS) to group equivalent states into equivalence classes (`A`, `B`, `C`, ...).
  - Renders the reduced, deduplicated FSM state-transition table automatically.

---

## How It Works

1. **Output Compatibility Check (Pass 0)**: Every pair of states $(S_i, S_j)$ with differing output rows is marked incompatible (`red`). Pairs with matching outputs either become unconditionally compatible (`green`) or store their implied next-state pairs.
2. **Iterative Propagation (Passes $1 \dots k$)**: On each pass, any cell whose implied next-state pair has been marked incompatible is crossed out (`red`), repeating until no further eliminations occur.
3. **Graph Partitioning & Reduction**: Remaining compatible pairs form edges in an undirected equivalence graph; connected components are collapsed via DFS into minimized symbolic states (`A`, `B`, `C`, ...), producing the final reduced state table.

---

## Tech Stack

- **JavaScript (ES6+)**: `FSMTableGenerator`, `StaticTableGenerator`, iterative Implication Table solver, and DFS equivalence-class reducer (`script.js`)
- **HTML5 & CSS3 / Bootstrap 5**: Responsive table layout and UI controls (`index.html`, `styles.css`, `bootstrap.min.css`)

---

## Running Locally

Clone the repository and open `index.html` in any modern browser (or serve it with a local static server):

```bash
git clone https://github.com/YasseenKamel/Implication-Table.git
cd Implication-Table
# Open index.html directly in your browser, or run:
python -m http.server 8000
```
