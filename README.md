# Expression Calculator Using Stack

<div align="center">

![Stack Calculator Banner](https://img.shields.io/badge/DSA%20Project-Expression%20Calculator-8b5cf6?style=for-the-badge&logo=cplusplus&logoColor=white)
![C++](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A professional DSA project that converts Infix expressions to Postfix notation using the Shunting-Yard algorithm with C++ STL Stack, visualized through a modern web interface.**

</div>

---

## 📋 Table of Contents

1. [Project Introduction](#project-introduction)
2. [Objectives](#objectives)
3. [Technologies Used](#technologies-used)
4. [Algorithm](#algorithm)
5. [Flowchart](#flowchart)
6. [How Stack Works](#how-stack-works)
7. [Infix vs Postfix](#infix-vs-postfix)
8. [Advantages](#advantages)
9. [Applications](#applications)
10. [Future Scope](#future-scope)
11. [Project Structure](#project-structure)
12. [Installation Steps](#installation-steps)
13. [How to Run](#how-to-run)
14. [Sample Inputs & Outputs](#sample-inputs--outputs)
15. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## 🚀 Project Introduction

The **Expression Calculator Using Stack** is a college DSA project that demonstrates the power of the **Stack data structure** in evaluating complex mathematical expressions.

Most programming languages use infix notation internally, but computers find it difficult to evaluate infix expressions directly due to precedence rules and parentheses. By converting to **postfix (Reverse Polish Notation)**, evaluation becomes straightforward using a single stack.

This project implements:
- ✅ Complete **Infix → Postfix conversion** using the Shunting-Yard Algorithm
- ✅ **Postfix expression evaluation** using a stack
- ✅ Step-by-step **visual animation** of every push and pop
- ✅ A professional **web interface** with dark/light mode
- ✅ **Expression history**, download, and copy features
- ✅ Full **error handling** (division by zero, invalid input, etc.)

---

## 🎯 Objectives

| # | Objective |
|---|-----------|
| 1 | Implement Stack using C++ STL `std::stack` |
| 2 | Parse and tokenize mathematical expressions |
| 3 | Convert Infix expressions to Postfix using Shunting-Yard Algorithm |
| 4 | Evaluate Postfix expressions using a Stack |
| 5 | Handle operator precedence: `^`, `*`, `/`, `%`, `+`, `-` |
| 6 | Handle nested parentheses |
| 7 | Validate expressions and provide clear error messages |
| 8 | Visualize the stack state at every step |
| 9 | Build a professional web UI for demonstration |
| 10 | Provide step-by-step output for educational purposes |

---

## 🛠️ Technologies Used

### Backend (Core Algorithm)
| Technology | Purpose |
|------------|---------|
| **C++ 17** | Main language for all stack algorithms |
| **std::stack\<string\>** | Operator stack for Infix→Postfix conversion |
| **std::stack\<double\>** | Operand stack for Postfix evaluation |
| **std::string** | Expression storage and manipulation |
| **std::vector** | Token lists and step recording |
| **std::cmath** | `pow()` for exponentiation, `fmod()` for modulo |

### Frontend (Web Interface)
| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic page structure |
| **Vanilla CSS3** | Glassmorphism dark UI, animations, responsiveness |
| **Vanilla JavaScript** | Algorithm port, DOM manipulation, UI logic |
| **Font Awesome 6** | Icons throughout the UI |
| **Google Fonts** | Outfit, Inter, JetBrains Mono typography |

---

## 📐 Algorithm

### 1. Infix to Postfix (Shunting-Yard Algorithm)

Invented by **Edsger Dijkstra**, this algorithm uses an **operator stack** to reorder tokens.

**Data Structure Used:** `std::stack<std::string>`

**Operator Precedence Table:**

| Operator | Description | Precedence | Associativity |
|----------|-------------|------------|---------------|
| `^` | Exponentiation | 3 (highest) | Right |
| `*` `/` `%` | Multiply, Divide, Modulo | 2 | Left |
| `+` `-` | Add, Subtract | 1 (lowest) | Left |

**Algorithm Steps:**

```
For each token in the input expression:
  ┌─ If TOKEN is a NUMBER:
  │     → Append to postfix output
  │
  ├─ If TOKEN is '(':
  │     → Push to operator stack
  │
  ├─ If TOKEN is ')':
  │     → Pop from stack and append to output UNTIL '(' is found
  │     → Discard the '('
  │
  ├─ If TOKEN is an OPERATOR (op):
  │     → While stack is not empty AND top is not '(' AND
  │         (top has higher precedence OR same precedence AND op is left-associative):
  │           Pop top → append to output
  │     → Push op to stack
  │
After all tokens:
  └─ Pop ALL remaining operators from stack → append to output
```

**Example:** `3 + 4 * 2`

| Step | Token | Action | Operator Stack | Postfix Output |
|------|-------|--------|----------------|----------------|
| 1 | `3` | Operand → output | (empty) | `3` |
| 2 | `+` | Push operator | `+` | `3` |
| 3 | `4` | Operand → output | `+` | `3 4` |
| 4 | `*` | `*` > `+`, push | `+ *` | `3 4` |
| 5 | `2` | Operand → output | `+ *` | `3 4 2` |
| 6 | EOF | Pop all remaining | (empty) | `3 4 2 * +` |

**Result:** `3 4 2 * +` ✅

---

### 2. Postfix Evaluation Algorithm

**Data Structure Used:** `std::stack<double>`

**Algorithm Steps:**

```
For each token in the postfix expression:
  ┌─ If TOKEN is a NUMBER:
  │     → Push to operand stack
  │
  └─ If TOKEN is an OPERATOR:
        → Pop top two values: b = pop(), a = pop()
        → Compute: result = a OP b
        → Push result back to stack

Final Answer = stack.top()
```

**Example:** `3 4 2 * +`

| Step | Token | Action | Stack State |
|------|-------|--------|-------------|
| 1 | `3` | Push 3 | `[3]` |
| 2 | `4` | Push 4 | `[3, 4]` |
| 3 | `2` | Push 2 | `[3, 4, 2]` |
| 4 | `*` | Pop 2,4 → 4*2=8, push 8 | `[3, 8]` |
| 5 | `+` | Pop 8,3 → 3+8=11, push 11 | `[11]` |

**Final Result:** `11` ✅

---

## 📊 Flowchart

### Complete System Flowchart

```
┌─────────────────────────────────┐
│         START                   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     READ INFIX EXPRESSION       │
│     from user input             │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│      VALIDATE EXPRESSION        │◄──────────────────────┐
│  - Check empty                  │                       │
│  - Check balanced parentheses   │                       │
│  - Check invalid characters     │                       │
│  - Check consecutive operators  │                       │
└──────────┬──────────────────────┘                       │
           │                                              │
     ┌─────┴──────┐                                       │
     │            │                                       │
   VALID       INVALID                                    │
     │            │                                       │
     │            ▼                                       │
     │  ┌─────────────────┐                               │
     │  │  DISPLAY ERROR  │──────────────────────────────►┘
     │  └─────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│       TOKENIZE EXPRESSION       │
│  "12+4" → ["12", "+", "4"]      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│    INFIX → POSTFIX CONVERSION   │
│    (Shunting-Yard Algorithm)    │
│                                 │
│  For each token:                │
│    ├─ Number  → output          │
│    ├─ '('     → push stack      │
│    ├─ ')'     → pop until '('   │
│    └─ Operator→ pop+push        │
│  End: drain stack → output      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     POSTFIX EXPRESSION          │
│     (space-separated tokens)    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│    EVALUATE POSTFIX             │
│    (Stack-based evaluation)     │
│                                 │
│  For each token:                │
│    ├─ Number   → push stack     │
│    └─ Operator → pop 2, apply,  │
│                  push result    │
└──────────┬──────────────────────┘
           │                  
     ┌─────┴──────┐
     │            │
  SUCCESS    DIVISION BY ZERO
     │       or other error
     │            │
     │            ▼
     │   ┌─────────────────┐
     │   │  DISPLAY ERROR  │
     │   └─────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│     DISPLAY FINAL RESULT        │
│  - Show original expression     │
│  - Show postfix expression      │
│  - Show all conversion steps    │
│  - Show all evaluation steps    │
│  - Animate stack visualization  │
│  - Save to history              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│            END                  │
└─────────────────────────────────┘
```

---

## 🗂️ How Stack Works

A **Stack** is a linear data structure following the **LIFO** (Last In, First Out) principle.

```
STACK OPERATIONS:
                    ┌───────┐  ◄── TOP
  push("C") ──►    │   C   │
  push("B") ──►    │   B   │
  push("A") ──►    │   A   │
                    └───────┘

  pop() ──► returns "C"    Stack becomes: [A, B]
  top() ──► returns "B"    Stack unchanged
```

### In This Project:

**Operator Stack (Infix→Postfix)**
```
Processing: (3 + 4) * 2

Step 1: push '('    Stack: [ ( ]
Step 2: push '+'    Stack: [ (, + ]
Step 3: push ')'    Stack: pop '+' to output, pop '('  →  Stack: []
Step 4: push '*'    Stack: [ * ]
Step 5: EOF         pop '*' to output → Stack: []
```

**Operand Stack (Postfix Eval)**
```
Evaluating: 3 4 + 2 *

push 3     Stack: [3]
push 4     Stack: [3, 4]
op  +      pop 4, pop 3 → 3+4=7 → push 7    Stack: [7]
push 2     Stack: [7, 2]
op  *      pop 2, pop 7 → 7*2=14 → push 14  Stack: [14]
Result = 14
```

---

## 🔄 Infix vs Postfix

| Feature | Infix | Postfix (RPN) |
|---------|-------|---------------|
| Example | `3 + 4 * 2` | `3 4 2 * +` |
| Parentheses | Required for grouping | **Never needed** |
| Operator position | Between operands | After operands |
| Evaluation | Complex (needs precedence + parenthesis parsing) | **Simple** (single left-to-right scan) |
| Human readable | ✅ Yes | ❌ No |
| Machine friendly | ❌ No | ✅ Yes |
| Stack needed | Yes (operator + operand) | Yes (operand only) |

| Infix | Postfix |
|-------|---------|
| `3 + 4` | `3 4 +` |
| `3 + 4 * 2` | `3 4 2 * +` |
| `(3 + 4) * 2` | `3 4 + 2 *` |
| `2 ^ 3 ^ 2` | `2 3 2 ^ ^` |
| `((12+4)*5)-(8/2)` | `12 4 + 5 * 8 2 / -` |

---

## ✅ Advantages

1. **Efficient Evaluation**: Postfix requires only one linear scan — O(n) time
2. **No Parentheses**: Eliminates the need for parentheses during evaluation
3. **Stack-Friendly**: Naturally maps to stack operations, easy to implement
4. **Unambiguous**: No ambiguity about operator precedence in postfix form
5. **Educational**: Makes operator precedence and parsing transparent
6. **Foundation for Compilers**: Used internally by almost all programming language compilers

---

## 🌍 Applications

| Domain | Application |
|--------|-------------|
| **Compilers** | Intermediate code generation (Three-address code) |
| **Calculators** | HP scientific calculators (classic RPN calculators) |
| **Databases** | Query parsing and expression evaluation |
| **Spreadsheets** | Formula evaluation engines |
| **Operating Systems** | Expression parsing in shell scripts |
| **Game Engines** | Scripting language evaluators |
| **Mathematics** | Computer algebra systems (CAS) |

---

## 🔭 Future Scope

- [ ] Support for trigonometric functions: `sin`, `cos`, `tan`
- [ ] Support for logarithmic functions: `log`, `ln`
- [ ] Support for factorial: `5!`
- [ ] Support for variables: `x = 5; x + 3`
- [ ] Graphing mode: plot `f(x)` on a coordinate system
- [ ] Multi-expression solver (system of equations)
- [ ] Expression simplification / symbolic math
- [ ] Voice input using Web Speech API
- [ ] PWA (Progressive Web App) for offline use
- [ ] Export results as PDF report
- [ ] Unit converter integration (degrees ↔ radians)

---

## 📁 Project Structure

```
ExpressionCalculator/
│
├── 📄 index.html          → Web interface (semantic HTML5)
├── 🎨 style.css           → Glassmorphism dark UI stylesheet
├── ⚙️  script.js           → JS algorithm engine + UI controller
│
├── 🔷 main.cpp            → C++ console driver / entry point
├── 🔷 stack_algorithm.cpp → Core C++ algorithm implementation
├── 🔷 stack_algorithm.h   → C++ header (structs + declarations)
│
└── 📘 README.md           → This documentation
```

---

## 💻 Installation Steps

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- *(Optional for C++)* GCC 7+ or MSVC 2017+ compiler

### Step 1: Download the Project

```bash
# Clone or download the project folder
# Place all files in: ExpressionCalculator/
```

### Step 2: Web Interface (No Installation Required)

Simply open `index.html` in your browser — **no server needed!**

```
Double-click: ExpressionCalculator/index.html
```

### Step 3: Compile C++ (Optional)

**Windows (MinGW/g++):**
```bash
cd ExpressionCalculator
g++ -std=c++17 -O2 -o main main.cpp stack_algorithm.cpp -lm
```

**Linux / macOS:**
```bash
cd ExpressionCalculator
g++ -std=c++17 -O2 -o main main.cpp stack_algorithm.cpp -lm
```

**Windows (MSVC):**
```bash
cl /std:c++17 /EHsc /Fe:main.exe main.cpp stack_algorithm.cpp
```

---

## ▶️ How to Run

### Web App (Recommended for Viva Demo)

1. Open `ExpressionCalculator/index.html` in Chrome/Firefox
2. Type an infix expression in the input box
3. Press **Convert & Evaluate** or hit `Enter`
4. Watch the step-by-step conversion and animated stack!

### C++ Console

**Interactive mode:**
```bash
./main
```
```
  ====================================
  Expression Calculator Using Stack
  ====================================
  Supported operators: + - * / % ^
  Type 'quit' to exit.

  Enter infix expression: ((12+4)*5)-(8/2)
```

**Command-line argument mode:**
```bash
./main "((12+4)*5)-(8/2)"
./main "3+4*2/(1-5)^2"
./main "2^10-1024"
```

---

## 📊 Sample Inputs & Outputs

### Example 1
```
Input  : ((12+4)*5)-(8/2)
Postfix: 12 4 + 5 * 8 2 / -
Result : 76
```

### Example 2
```
Input  : 3+4*2/(1-5)^2
Postfix: 3 4 2 * 1 5 - 2 ^ / +
Result : 3.5
```

### Example 3
```
Input  : 2^10-1024
Postfix: 2 10 ^ 1024 -
Result : 0
```

### Example 4
```
Input  : (100-50)*2/5+8
Postfix: 100 50 - 2 * 5 / 8 +
Result : 28
```

### Example 5 (Modulo)
```
Input  : 15%7+3*4-2
Postfix: 15 7 % 3 4 * + 2 -
Result : 11
```

### Error Cases
```
Input  : 3++4         → Error: Consecutive operators found
Input  : (3+4         → Error: Unbalanced parentheses
Input  : 5/0          → Error: Division by zero
Input  : 3@4          → Error: Invalid character '@'
Input  : ()           → Error: Empty parentheses '()'
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Calculate expression |
| `Ctrl + R` | Load random example |
| `Esc` | Reset / Close modal |
| `Ctrl + D` | Toggle dark/light mode |
| `Ctrl + C` | Copy result (when shown) |
| `Ctrl + S` | Download result as TXT |

---

## 🤝 Connecting C++ with the Web Interface

The C++ backend and web frontend implement the **same algorithm** independently:

```
Browser (script.js)          C++ (stack_algorithm.cpp)
─────────────────────        ──────────────────────────
JS Array as Stack      ←→   std::stack<std::string>
JS Array as Stack      ←→   std::stack<double>
String.split()         ←→   tokenize()
infixToPostfix()       ←→   infixToPostfix()
evaluatePostfix()      ←→   evaluatePostfix()
applyOperation()       ←→   applyOperation()
```

**To extend this project with a real C++ backend:**
1. Compile `main.cpp` + `stack_algorithm.cpp` into a WebAssembly (WASM) module using Emscripten
2. Or set up a local HTTP server (Node.js/Flask) that calls the compiled C++ binary
3. The JS frontend can then call the C++ backend via `fetch()` API

```bash
# Emscripten (WASM) compilation:
emcc -std=c++17 main.cpp stack_algorithm.cpp -o calculator.js \
     -s EXPORTED_FUNCTIONS='["_calculateExpression"]' \
     -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
```

---

## 📄 License

This project is created for **educational purposes** as a college DSA project.
Feel free to use, modify, and build upon it with proper attribution.

---

<div align="center">

**Built with ❤️ for DSA | C++ Stack | Shunting-Yard Algorithm**

</div>
