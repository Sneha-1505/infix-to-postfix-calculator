/**
 * ============================================================
 *  script.js — Expression Calculator Using Stack
 *  Front-end engine (mirrors C++ stack_algorithm logic)
 * ============================================================
 *
 *  This file implements the FULL infix→postfix→evaluation
 *  algorithm in JavaScript, mirroring the C++ backend.
 *
 *  Data Structures (mirrors C++ STL):
 *    - JS Array as Stack  → push() / pop() / at(-1)
 *    - Array of tokens    → mirrors std::vector<std::string>
 *    - Objects            → mirrors C++ structs
 *
 *  Sections:
 *    1. Algorithm Engine  (pure functions, no DOM)
 *    2. DOM Controller    (UI render, event handling)
 *    3. Stack Visualizer  (animated stack display)
 *    4. History Manager   (localStorage-backed)
 *    5. App Initializer   (wires everything together)
 * ============================================================
 */

'use strict';

/* ============================================================
   SECTION 1: ALGORITHM ENGINE
   Pure functions — no DOM dependencies.
   Mirrors C++ stack_algorithm.cpp exactly.
============================================================ */

/**
 * getPrecedence()
 * Returns operator precedence level.
 * Mirrors C++ getPrecedence().
 * @param {string} op
 * @returns {number}
 */
function getPrecedence(op) {
    switch (op) {
        case '^': return 3;       // Highest: exponentiation
        case '*':
        case '/':
        case '%': return 2;       // Multiplication, division, modulo
        case '+':
        case '-': return 1;       // Addition, subtraction
        default:  return 0;
    }
}

/**
 * isRightAssociative()
 * Only '^' is right-associative.
 * Mirrors C++ isRightAssociative().
 * @param {string} op
 * @returns {boolean}
 */
function isRightAssociative(op) {
    return op === '^';
}

/**
 * isOperator()
 * Returns true if character is a supported binary operator.
 * @param {string} c
 * @returns {boolean}
 */
function isOperator(c) {
    return ['+', '-', '*', '/', '%', '^'].includes(c);
}

/**
 * isNumericToken()
 * Returns true if the string represents a number.
 * @param {string} t
 * @returns {boolean}
 */
function isNumericToken(t) {
    return /^-?\d+(\.\d+)?$/.test(t) || /^\d*\.\d+$/.test(t);
}

/**
 * validateExpression()
 * Comprehensive validation of the infix expression.
 * Returns "" on success, error message string on failure.
 * Mirrors C++ validateExpression().
 * @param {string} expr
 * @returns {string}
 */
function validateExpression(expr) {
    // Empty check
    if (!expr || expr.trim().length === 0) {
        return 'Error: Expression is empty. Please enter a valid mathematical expression.';
    }

    const e = expr.trim();

    // Allowed characters only
    if (/[^\d\s\+\-\*\/\%\^\(\)\.]/.test(e)) {
        const invalid = e.match(/[^\d\s\+\-\*\/\%\^\(\)\.]/);
        return `Error: Invalid character '${invalid[0]}' found in expression.`;
    }

    // Balanced parentheses
    let depth = 0;
    for (let i = 0; i < e.length; i++) {
        if (e[i] === '(') depth++;
        else if (e[i] === ')') depth--;
        if (depth < 0) return "Error: Unbalanced parentheses — ')' without matching '('.";
    }
    if (depth !== 0) return `Error: Unbalanced parentheses — ${depth} unclosed '(' found.`;

    // Remove spaces for further checks
    const clean = e.replace(/\s+/g, '');
    if (!clean) return 'Error: Expression is empty after removing spaces.';

    const first = clean[0];
    const last  = clean[clean.length - 1];

    // Start/end checks
    if (isOperator(first) && first !== '-') {
        return `Error: Expression cannot start with operator '${first}'.`;
    }
    if (isOperator(last)) {
        return `Error: Expression cannot end with operator '${last}'.`;
    }
    if (first === ')') return "Error: Expression cannot start with ')'.";
    if (last  === '(') return "Error: Expression cannot end with '('.";

    // Empty parentheses
    if (/\(\)/.test(clean)) return "Error: Empty parentheses '()' are not allowed.";

    // Consecutive operators (allow unary minus after '(')
    for (let i = 0; i < clean.length - 1; i++) {
        const cur  = clean[i];
        const next = clean[i + 1];
        if (isOperator(cur) && isOperator(next)) {
            // Allow only: ( - ... scenario handled by tokenizer
            // But consecutive like ++ or ** etc. are invalid
            if (!(cur === '(' && next === '-')) {
                return `Error: Consecutive operators found near position ${i}.`;
            }
        }
    }

    return ''; // Valid
}

/**
 * tokenize()
 * Splits expression into array of string tokens.
 * Handles multi-digit numbers, decimals, and unary minus.
 * Mirrors C++ tokenize().
 * @param {string} expr
 * @returns {string[]}
 */
function tokenize(expr) {
    const tokens = [];
    let   numBuf = '';
    const clean  = expr.replace(/\s+/g, '');

    for (let i = 0; i < clean.length; i++) {
        const c = clean[i];

        if (/[\d\.]/.test(c)) {
            numBuf += c;
        } else {
            if (numBuf) { tokens.push(numBuf); numBuf = ''; }

            // Handle unary minus: at start or after '('
            if (c === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(')) {
                tokens.push('0'); // treat as (0 - x)
            }
            tokens.push(c);
        }
    }
    if (numBuf) tokens.push(numBuf);

    return tokens;
}

/**
 * stackToString()
 * Converts a stack array to a display string (bottom→top).
 * @param {string[]} stack
 * @returns {string}
 */
function stackToString(stack) {
    if (stack.length === 0) return '(empty)';
    return stack.join(' | ');
}

/**
 * evalStackToString()
 * Converts a numeric stack array to display string.
 * @param {number[]} stack
 * @returns {string}
 */
function evalStackToString(stack) {
    if (stack.length === 0) return '(empty)';
    return stack.map(v => formatNum(v)).join(' | ');
}

/**
 * formatNum()
 * Formats a number removing unnecessary decimals.
 * @param {number} v
 * @returns {string}
 */
function formatNum(v) {
    if (Number.isInteger(v)) return String(v);
    // Round to 8 decimal places to avoid floating point noise
    return parseFloat(v.toFixed(8)).toString();
}

/**
 * infixToPostfix()
 * Shunting-Yard algorithm implementation.
 * Mirrors C++ infixToPostfix().
 *
 * @param {string} infix
 * @returns {{ postfix: string, steps: ConversionStep[] }}
 */
function infixToPostfix(infix) {
    const steps          = [];  // ConversionStep records
    const tokens         = tokenize(infix);
    const operatorStack  = [];  // mirrors std::stack<std::string>
    let   postfix        = '';  // output string

    for (const token of tokens) {
        const step = { token, action: '', stackState: '', postfixSoFar: '' };

        // ---- Operand (number) ----
        if (isNumericToken(token)) {
            postfix += (postfix ? ' ' : '') + token;
            step.action = `Operand '${token}' → add directly to postfix output`;
        }

        // ---- Left parenthesis ----
        else if (token === '(') {
            operatorStack.push(token);
            step.action = "Left parenthesis '(' → push to operator stack";
        }

        // ---- Right parenthesis ----
        else if (token === ')') {
            let popped = '';
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                const top = operatorStack.pop();
                postfix += (postfix ? ' ' : '') + top;
                popped  += top + ' ';
            }
            if (operatorStack.length > 0) operatorStack.pop(); // discard '('
            step.action = `Right parenthesis ')' → pop [${popped.trim()}] to postfix, discard '('`;
        }

        // ---- Operator ----
        else if (isOperator(token)) {
            let popped = '';
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                isOperator(operatorStack[operatorStack.length - 1])
            ) {
                const topOp  = operatorStack[operatorStack.length - 1];
                const topPre = getPrecedence(topOp);
                const curPre = getPrecedence(token);
                const shouldPop = (topPre > curPre) ||
                                  (topPre === curPre && !isRightAssociative(token));
                if (!shouldPop) break;

                const op = operatorStack.pop();
                postfix += (postfix ? ' ' : '') + op;
                popped  += op + ' ';
            }
            operatorStack.push(token);
            step.action = `Operator '${token}' → popped [${popped.trim()}], pushed '${token}' to stack`;
        }

        step.stackState   = stackToString([...operatorStack]);
        step.postfixSoFar = postfix;
        steps.push(step);
    }

    // Drain remaining operators from stack to output
    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        postfix += (postfix ? ' ' : '') + op;
        steps.push({
            token:        op,
            action:       `End of input → pop '${op}' from stack to postfix`,
            stackState:   stackToString([...operatorStack]),
            postfixSoFar: postfix
        });
    }

    return { postfix, steps };
}

/**
 * applyOperation()
 * Applies a binary arithmetic operation.
 * Mirrors C++ applyOperation().
 * @param {number} a  left operand
 * @param {number} b  right operand
 * @param {string} op operator
 * @returns {number}
 */
function applyOperation(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b === 0) throw new Error('Error: Division by zero is undefined.');
            return a / b;
        case '%':
            if (b === 0) throw new Error('Error: Modulo by zero is undefined.');
            return a % b;
        case '^':
            return Math.pow(a, b);
        default:
            throw new Error(`Error: Unknown operator '${op}'.`);
    }
}

/**
 * evaluatePostfix()
 * Stack-based postfix evaluation.
 * Mirrors C++ evaluatePostfix().
 * @param {string} postfix
 * @returns {{ result: number, steps: EvaluationStep[] }}
 */
function evaluatePostfix(postfix) {
    const steps        = [];  // EvaluationStep records
    const operandStack = [];  // mirrors std::stack<double>
    const tokens       = postfix.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
        const step = { token, action: '', stackState: '', result: null, hasResult: false };

        // ---- Operand ----
        if (isNumericToken(token)) {
            const val = parseFloat(token);
            operandStack.push(val);
            step.action = `Push operand ${formatNum(val)} onto stack`;
        }

        // ---- Operator ----
        else if (isOperator(token)) {
            if (operandStack.length < 2) {
                throw new Error(`Error: Insufficient operands for operator '${token}'.`);
            }
            const b   = operandStack.pop(); // right operand
            const a   = operandStack.pop(); // left operand
            const res = applyOperation(a, b, token);
            operandStack.push(res);

            step.action    = `Pop ${formatNum(b)} and ${formatNum(a)}, compute ${formatNum(a)} ${token} ${formatNum(b)} = ${formatNum(res)}, push result`;
            step.result    = res;
            step.hasResult = true;
        }

        step.stackState = evalStackToString([...operandStack]);
        steps.push(step);
    }

    if (operandStack.length === 0) throw new Error('Error: Empty expression after postfix evaluation.');
    if (operandStack.length > 1)   throw new Error('Error: Too many operands — expression may be malformed.');

    return { result: operandStack[0], steps };
}

/**
 * calculateExpression()
 * Main entry point. Validates → Converts → Evaluates.
 * Mirrors C++ calculateExpression().
 * @param {string} expression
 * @returns {CalculatorResult}
 */
function calculateExpression(expression) {
    const result = {
        success:            false,
        errorMessage:       '',
        originalExpression: expression,
        postfixExpression:  '',
        finalResult:        null,
        conversionSteps:    [],
        evaluationSteps:    []
    };

    // Step 1: Validate
    const validationError = validateExpression(expression);
    if (validationError) {
        result.errorMessage = validationError;
        return result;
    }

    try {
        // Step 2: Convert
        const { postfix, steps: convSteps } = infixToPostfix(expression);
        result.postfixExpression = postfix;
        result.conversionSteps   = convSteps;

        // Step 3: Evaluate
        const { result: finalVal, steps: evalSteps } = evaluatePostfix(postfix);
        result.finalResult    = finalVal;
        result.evaluationSteps = evalSteps;

        result.success = true;
    } catch (err) {
        result.errorMessage = err.message;
    }

    return result;
}

/* ============================================================
   SECTION 2: STACK VISUALIZER
   Animated visual stack display.
============================================================ */

/**
 * StackVisualizer
 * Controls an animated stack display in the DOM.
 */
class StackVisualizer {
    /**
     * @param {HTMLElement} container  The .stack-viz element
     */
    constructor(container) {
        this.container = container;
        this.items     = []; // current items (bottom → top)
    }

    /**
     * render()
     * Renders the current state from a stack string.
     * @param {string} stackStr  e.g. "( | * | +"
     */
    render(stackStr) {
        if (!stackStr || stackStr === '(empty)') {
            this.items = [];
            this._draw([]);
            return;
        }
        const newItems = stackStr.split(' | ');
        this._draw(newItems);
        this.items = newItems;
    }

    /**
     * _draw()
     * Internal: clears and redraws the stack elements.
     * @param {string[]} items
     */
    _draw(items) {
        // Clear existing content
        this.container.innerHTML = '';

        if (items.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'stack-empty-msg';
            msg.textContent = 'Stack is empty';
            this.container.appendChild(msg);
            return;
        }

        // Draw from bottom to top (items[0] = bottom, items[last] = top)
        items.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'stack-element';

            // Determine element type for styling
            if (isOperator(item)) {
                el.classList.add('operator-el');
            } else if (isNumericToken(item) || item === '0') {
                el.classList.add('number-el');
            } else if (item === '(' || item === ')') {
                el.classList.add('paren-el');
            }

            el.textContent = item;

            // Push animation only for the new top element
            if (i === items.length - 1) {
                el.classList.add('push-anim');
            }

            this.container.appendChild(el);
        });
    }
}

/* ============================================================
   SECTION 3: HISTORY MANAGER
   Persists expression history in localStorage.
============================================================ */

const HISTORY_KEY = 'stackcalc_history';
const MAX_HISTORY = 20;

/**
 * loadHistory()
 * Loads history array from localStorage.
 * @returns {HistoryItem[]}
 */
function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * saveHistory()
 * Saves history array to localStorage.
 * @param {HistoryItem[]} history
 */
function saveHistory(history) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        // localStorage might be unavailable in some environments
        console.warn('Could not save history:', e);
    }
}

/**
 * addToHistory()
 * Prepends a new entry to the history, capped at MAX_HISTORY.
 * @param {string} expression
 * @param {string} postfix
 * @param {number} result
 */
function addToHistory(expression, postfix, result) {
    const history = loadHistory();
    const entry   = {
        id:         Date.now(),
        expression: expression,
        postfix:    postfix,
        result:     formatNum(result),
        time:       new Date().toLocaleTimeString()
    };
    history.unshift(entry); // prepend
    if (history.length > MAX_HISTORY) history.pop(); // keep cap
    saveHistory(history);
    return history;
}

/* ============================================================
   SECTION 4: DOM CONTROLLER
   All UI logic — rendering results, events, theming.
============================================================ */

/** DOM element cache */
const DOM = {
    bgParticles:     () => document.getElementById('bg-particles'),
    themeToggle:     () => document.getElementById('theme-toggle'),
    themeIcon:       () => document.getElementById('theme-icon'),
    shortcutsBtn:    () => document.getElementById('shortcuts-btn'),
    shortcutsModal:  () => document.getElementById('shortcuts-modal'),
    closeModalBtn:   () => document.getElementById('close-modal-btn'),
    exprInput:       () => document.getElementById('expression-input'),
    clearInputBtn:   () => document.getElementById('clear-input-btn'),
    randomBtn:       () => document.getElementById('random-btn'),
    calculateBtn:    () => document.getElementById('calculate-btn'),
    resetBtn:        () => document.getElementById('reset-btn'),
    errorPanel:      () => document.getElementById('error-panel'),
    errorText:       () => document.getElementById('error-text'),
    resultsSection:  () => document.getElementById('results-section'),
    originalExpr:    () => document.getElementById('original-expr'),
    postfixExpr:     () => document.getElementById('postfix-expr'),
    finalResult:     () => document.getElementById('final-result'),
    copyResultBtn:   () => document.getElementById('copy-result-btn'),
    downloadBtn:     () => document.getElementById('download-btn'),
    conversionTbody: () => document.getElementById('conversion-tbody'),
    evaluationTbody: () => document.getElementById('evaluation-tbody'),
    opStackViz:      () => document.getElementById('op-stack-viz'),
    evalStackViz:    () => document.getElementById('eval-stack-viz'),
    historyList:     () => document.getElementById('history-list'),
    historyEmpty:    () => document.getElementById('history-empty'),
    clearHistoryBtn: () => document.getElementById('clear-history-btn'),
    toast:           () => document.getElementById('toast'),
};

/** Global state */
let currentResult     = null;
let opVisualizer      = null;
let evalVisualizer    = null;
let currentTheme      = 'dark';
let convAnimTimeout   = null;
let evalAnimTimeout   = null;

/* ---- Theme ------------------------------------------------ */

function initTheme() {
    const saved = localStorage.getItem('stackcalc_theme') || 'dark';
    setTheme(saved);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stackcalc_theme', theme);
    const icon = DOM.themeIcon();
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    showToast(currentTheme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
}

/* ---- Background Particles --------------------------------- */

function initParticles() {
    const container = DOM.bgParticles();
    if (!container) return;

    const count = window.innerWidth < 600 ? 15 : 30;
    const colors = [
        'rgba(139,92,246,0.6)',
        'rgba(6,182,212,0.5)',
        'rgba(16,185,129,0.4)',
        'rgba(245,158,11,0.3)',
    ];

    for (let i = 0; i < count; i++) {
        const el   = document.createElement('div');
        const size = Math.random() * 4 + 2;
        const x    = Math.random() * 100;
        const dur  = Math.random() * 12 + 6;
        const del  = Math.random() * 8;
        const col  = colors[Math.floor(Math.random() * colors.length)];

        el.className = 'particle';
        Object.assign(el.style, {
            width:  size + 'px',
            height: size + 'px',
            left:   x + '%',
            background: col,
            '--dur':   dur + 's',
            '--delay': del + 's',
            boxShadow: `0 0 ${size * 2}px ${col}`,
        });
        container.appendChild(el);
    }
}

/* ---- Toast Notification ----------------------------------- */

let toastTimer = null;

/**
 * showToast()
 * Shows a brief status notification.
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 * @param {number} duration  ms
 */
function showToast(msg, type = 'info', duration = 2800) {
    const toast = DOM.toast();
    if (!toast) return;

    toast.textContent = msg;
    toast.className   = `toast ${type} show`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/* ---- Error Display ---------------------------------------- */

function showError(msg) {
    const panel = DOM.errorPanel();
    const text  = DOM.errorText();
    if (text) text.textContent = msg;
    if (panel) {
        panel.removeAttribute('hidden');
        panel.style.animation = 'none';
        // Trigger reflow for re-animation
        void panel.offsetWidth;
        panel.style.animation = '';
    }
}

function hideError() {
    const panel = DOM.errorPanel();
    if (panel) panel.setAttribute('hidden', '');
}

/* ---- Syntax Highlighting ---------------------------------- */

/**
 * highlightExpression()
 * Wraps digits and operators in colored spans.
 * @param {string} expr
 * @returns {string} HTML string
 */
function highlightExpression(expr) {
    // Single pass, so later replacements never touch the <span> markup already inserted
    return expr.replace(/(\d+\.?\d*)|([+\-*\/%^])|([()])/g, (m, num, op, paren) => {
        if (num)   return `<span class="expr-num">${num}</span>`;
        if (op)    return `<span class="expr-op">${op}</span>`;
        return `<span class="expr-paren">${paren}</span>`;
    });
}

/* ---- Render Conversion Table ------------------------------ */

/**
 * renderConversionTable()
 * Populates the Infix→Postfix step table with animated rows.
 * @param {ConversionStep[]} steps
 */
function renderConversionTable(steps) {
    const tbody = DOM.conversionTbody();
    if (!tbody) return;
    tbody.innerHTML = '';

    steps.forEach((step, i) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${i * 60}ms`;

        // Determine token styling
        let tokenClass = '';
        if (isNumericToken(step.token)) tokenClass = 'expr-num';
        else if (isOperator(step.token)) tokenClass = 'expr-op';
        else if (step.token === '(' || step.token === ')') tokenClass = 'expr-paren';

        tr.innerHTML = `
            <td><span class="step-num">${i + 1}</span></td>
            <td class="token-cell"><span class="${tokenClass}">${escHtml(step.token)}</span></td>
            <td class="action-cell">${escHtml(step.action)}</td>
            <td class="stack-cell">${escHtml(step.stackState)}</td>
            <td class="postfix-cell">${escHtml(step.postfixSoFar)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update operator stack visualizer to final state
    if (opVisualizer && steps.length > 0) {
        opVisualizer.render(steps[steps.length - 1].stackState);
    }

    // Animate stack through all steps
    animateStackThrough(opVisualizer, steps.map(s => s.stackState), convAnimTimeout);
}

/* ---- Render Evaluation Table ------------------------------ */

/**
 * renderEvaluationTable()
 * Populates the Postfix evaluation step table.
 * @param {EvaluationStep[]} steps
 */
function renderEvaluationTable(steps) {
    const tbody = DOM.evaluationTbody();
    if (!tbody) return;
    tbody.innerHTML = '';

    steps.forEach((step, i) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${i * 80}ms`;

        tr.innerHTML = `
            <td><span class="step-num">${i + 1}</span></td>
            <td class="token-cell">${escHtml(step.token)}</td>
            <td class="action-cell">${escHtml(step.action)}</td>
            <td class="stack-cell">${escHtml(step.stackState)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Animate eval stack through steps
    animateStackThrough(evalVisualizer, steps.map(s => s.stackState), evalAnimTimeout);
}

/**
 * animateStackThrough()
 * Animates the stack visualizer through a series of states with delays.
 * @param {StackVisualizer} viz
 * @param {string[]} states
 * @param {*} timerRef  (unused directly — local)
 */
function animateStackThrough(viz, states, timerRef) {
    if (!viz || states.length === 0) return;

    let idx = 0;
    function next() {
        if (idx >= states.length) return;
        viz.render(states[idx]);
        idx++;
        setTimeout(next, 400);
    }
    next();
}

/* ---- Render Full Results ---------------------------------- */

/**
 * renderResults()
 * Takes a CalculatorResult and renders the full results UI.
 * @param {CalculatorResult} result
 */
function renderResults(result) {
    currentResult = result;

    // Show results section
    const section = DOM.resultsSection();
    if (section) {
        section.removeAttribute('hidden');
        section.style.animation = 'none';
        void section.offsetWidth;
        section.style.animation = 'fadeInUp 0.6s ease both';
    }

    // Overview cards
    const origEl   = DOM.originalExpr();
    const postEl   = DOM.postfixExpr();
    const resEl    = DOM.finalResult();

    if (origEl) origEl.innerHTML = highlightExpression(escHtml(result.originalExpression));
    if (postEl) postEl.textContent = result.postfixExpression;

    if (resEl) {
        const numStr = formatNum(result.finalResult);
        resEl.textContent = numStr;
        // Pop-in animation
        resEl.style.animation = 'none';
        void resEl.offsetWidth;
        resEl.style.animation = 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both';
    }

    // Render tables
    renderConversionTable(result.conversionSteps);
    renderEvaluationTable(result.evaluationSteps);

    // Scroll to results
    setTimeout(() => {
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

/* ---- Calculate -------------------------------------------- */

/**
 * handleCalculate()
 * Main handler: reads input, runs algorithm, renders result.
 */
async function handleCalculate() {
    const input    = DOM.exprInput();
    const calcBtn  = DOM.calculateBtn();
    if (!input || !calcBtn) return;

    const expr = input.value.trim();
    hideError();

    // Show loading state
    calcBtn.classList.add('loading');
    calcBtn.disabled = true;

    // Small artificial delay for UX (shows loading animation)
    await new Promise(r => setTimeout(r, 350));

    const result = calculateExpression(expr);

    // Remove loading state
    calcBtn.classList.remove('loading');
    calcBtn.disabled = false;

    if (!result.success) {
        showError(result.errorMessage);
        // Hide results if previously shown
        const section = DOM.resultsSection();
        if (section) section.setAttribute('hidden', '');
        showToast('⚠️ ' + result.errorMessage, 'error', 4000);
        return;
    }

    // Success
    renderResults(result);

    // Add to history
    addToHistory(result.originalExpression, result.postfixExpression, result.finalResult);
    renderHistory();

    showToast(`✅ Result: ${formatNum(result.finalResult)}`, 'success');
}

/* ---- Reset ----------------------------------------------- */

function handleReset() {
    const input   = DOM.exprInput();
    const section = DOM.resultsSection();

    if (input) { input.value = ''; input.focus(); }
    if (section) section.setAttribute('hidden', '');
    hideError();
    currentResult = null;

    // Clear visualizers
    if (opVisualizer)   opVisualizer.render('(empty)');
    if (evalVisualizer) evalVisualizer.render('(empty)');
}

/* ---- Copy Result ------------------------------------------ */

async function handleCopyResult() {
    if (!currentResult) return;
    const text = `Expression: ${currentResult.originalExpression}\nPostfix: ${currentResult.postfixExpression}\nResult: ${formatNum(currentResult.finalResult)}`;
    try {
        await navigator.clipboard.writeText(text);
        showToast('📋 Result copied to clipboard!', 'success');
    } catch {
        showToast('❌ Could not copy. Try manually.', 'error');
    }
}

/* ---- Download Result -------------------------------------- */

function handleDownload() {
    if (!currentResult) return;

    const lines = [
        '====================================================',
        '  EXPRESSION CALCULATOR USING STACK — Result',
        '====================================================',
        '',
        `Original Expression : ${currentResult.originalExpression}`,
        `Postfix Expression  : ${currentResult.postfixExpression}`,
        `Final Result        : ${formatNum(currentResult.finalResult)}`,
        '',
        '---- INFIX TO POSTFIX CONVERSION STEPS ----',
        '',
    ];

    currentResult.conversionSteps.forEach((s, i) => {
        lines.push(`Step ${i + 1}: Token=${s.token}`);
        lines.push(`  Action      : ${s.action}`);
        lines.push(`  Stack State : ${s.stackState}`);
        lines.push(`  Postfix Now : ${s.postfixSoFar}`);
        lines.push('');
    });

    lines.push('---- POSTFIX EVALUATION STEPS ----');
    lines.push('');

    currentResult.evaluationSteps.forEach((s, i) => {
        lines.push(`Step ${i + 1}: Token=${s.token}`);
        lines.push(`  Action      : ${s.action}`);
        lines.push(`  Stack State : ${s.stackState}`);
        lines.push('');
    });

    lines.push('====================================================');
    lines.push(`Generated at: ${new Date().toLocaleString()}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `stackcalc_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Result downloaded as TXT!', 'success');
}

/* ---- Random Example --------------------------------------- */

const EXAMPLES = [
    '((12+4)*5)-(8/2)',
    '3+4*2/(1-5)^2',
    '2^10-1024',
    '(100-50)*2/5+8',
    '15%7+3*4-2',
    '(2+3)*(4-1)^2',
    '100/4+25*2-10',
    '((3+5)*2)^2-100',
    '5^2+12^2',
    '(10+20)*(30-15)/9',
    '999-((3*4)^2)/9',
    '(2^3)*(5+1)-7',
];

function handleRandom() {
    const input = DOM.exprInput();
    if (!input) return;
    const ex = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    input.value = ex;
    input.focus();
    // Highlight / flash the input
    input.style.borderColor = '#8b5cf6';
    setTimeout(() => { input.style.borderColor = ''; }, 800);
    showToast(`🎲 Loaded: ${ex}`, 'info');
}

/* ---- History UI ------------------------------------------- */

function renderHistory() {
    const list  = DOM.historyList();
    const empty = DOM.historyEmpty();
    if (!list) return;

    const history = loadHistory();

    // Remove old items (keep empty message in DOM)
    list.querySelectorAll('.history-item').forEach(el => el.remove());

    if (history.length === 0) {
        if (empty) empty.style.display = '';
        return;
    }
    if (empty) empty.style.display = 'none';

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className   = 'history-item';
        item.setAttribute('role', 'listitem');
        item.setAttribute('title', 'Click to load this expression');

        item.innerHTML = `
            <span class="history-expr">${escHtml(entry.expression)}</span>
            <div class="history-meta">
                <span class="history-result">= ${escHtml(entry.result)}</span>
                <span class="history-time">${escHtml(entry.time)}</span>
                <button class="history-load-btn" title="Load" aria-label="Load expression ${escHtml(entry.expression)}">
                    <i class="fas fa-play" aria-hidden="true"></i>
                </button>
            </div>
        `;

        // Click to load
        item.addEventListener('click', () => {
            const input = DOM.exprInput();
            if (input) {
                input.value = entry.expression;
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        list.insertBefore(item, list.firstChild);
    });
}

function handleClearHistory() {
    saveHistory([]);
    renderHistory();
    showToast('🗑️ History cleared!', 'info');
}

/* ---- Modal ------------------------------------------------ */

function openModal() {
    const modal = DOM.shortcutsModal();
    if (modal) {
        modal.removeAttribute('hidden');
        DOM.closeModalBtn()?.focus();
    }
}

function closeModal() {
    const modal = DOM.shortcutsModal();
    if (modal) modal.setAttribute('hidden', '');
}

/* ---- Utility ---------------------------------------------- */

/**
 * escHtml()
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ---- Keyboard Shortcuts ----------------------------------- */

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

        // Enter: calculate (when focused in input or globally)
        if (e.key === 'Enter' && (inInput || !inInput)) {
            if (inInput) { e.preventDefault(); handleCalculate(); }
        }

        // Esc: close modal or reset
        if (e.key === 'Escape') {
            const modal = DOM.shortcutsModal();
            if (modal && !modal.hasAttribute('hidden')) {
                closeModal();
            } else {
                handleReset();
            }
        }

        // Ctrl+R: random example
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            handleRandom();
        }

        // Ctrl+D: toggle theme
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }

        // Ctrl+C: copy result (only when result is shown)
        if (e.ctrlKey && e.key === 'c' && currentResult) {
            // Only intercept if not in input to avoid interrupting text copy
            if (!inInput) {
                e.preventDefault();
                handleCopyResult();
            }
        }

        // Ctrl+S: download
        if (e.ctrlKey && e.key === 's' && currentResult) {
            e.preventDefault();
            handleDownload();
        }
    });
}

/* ============================================================
   SECTION 5: APP INITIALIZER
   Wires up all event listeners and initializes subsystems.
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Init theme
    initTheme();

    // Init particles
    initParticles();

    // Init stack visualizers
    const opVizEl   = DOM.opStackViz();
    const evalVizEl = DOM.evalStackViz();
    if (opVizEl)   opVisualizer   = new StackVisualizer(opVizEl);
    if (evalVizEl) evalVisualizer = new StackVisualizer(evalVizEl);

    // Render existing history
    renderHistory();

    // Init keyboard shortcuts
    initKeyboardShortcuts();

    // ---- Event Listeners ----

    // Theme toggle
    DOM.themeToggle()?.addEventListener('click', toggleTheme);

    // Shortcuts modal
    DOM.shortcutsBtn()?.addEventListener('click', openModal);
    DOM.closeModalBtn()?.addEventListener('click', closeModal);
    DOM.shortcutsModal()?.addEventListener('click', (e) => {
        if (e.target === DOM.shortcutsModal()) closeModal();
    });

    // Expression input — live syntax feedback
    DOM.exprInput()?.addEventListener('input', () => {
        // Hide previous errors on new input
        hideError();
    });

    // Clear input
    DOM.clearInputBtn()?.addEventListener('click', () => {
        const input = DOM.exprInput();
        if (input) { input.value = ''; input.focus(); }
        hideError();
    });

    // Calculate
    DOM.calculateBtn()?.addEventListener('click', handleCalculate);

    // Reset
    DOM.resetBtn()?.addEventListener('click', handleReset);

    // Random example
    DOM.randomBtn()?.addEventListener('click', handleRandom);

    // Copy result
    DOM.copyResultBtn()?.addEventListener('click', handleCopyResult);

    // Download
    DOM.downloadBtn()?.addEventListener('click', handleDownload);

    // Clear history
    DOM.clearHistoryBtn()?.addEventListener('click', handleClearHistory);

    // ---- Auto-load example on first visit ----
    const input = DOM.exprInput();
    if (input && !input.value) {
        input.value = '((12+4)*5)-(8/2)';
    }

    // ---- Focus input on load ----
    input?.focus();

    console.log('%c StackCalc DSA Project ', 'background:#8b5cf6;color:#fff;font-size:16px;font-weight:bold;border-radius:4px;padding:4px 8px;');
    console.log('%c Expression Calculator Using Stack | C++ Algorithm in JS ', 'color:#06b6d4;font-size:12px;');
    console.log('%c Supported: + - * / % ^ with nested brackets ', 'color:#10b981;font-size:12px;');
});
