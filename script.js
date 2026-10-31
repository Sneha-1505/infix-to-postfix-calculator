/**
 * ============================================================
 *  script.js — Expression Calculator Using Stack
 *  DSA Mini Project · Sneha Mangwani · LPU
 * ============================================================
 */

/* ============================================================
   SECTION 1: ALGORITHM ENGINE (Pure functions)
============================================================ */

function getPrecedence(op) {
    if (op === '^') return 3;
    if (op === '*' || op === '/' || op === '%') return 2;
    if (op === '+' || op === '-') return 1;
    return 0;
}

function isRightAssociative(op) {
    return op === '^';
}

function isOperator(c) {
    return c === '+' || c === '-' || c === '*' || c === '/' || c === '%' || c === '^';
}

function isNumericToken(t) {
    if (t === null || t === undefined) return false;
    return /^-?\d+(\.\d+)?$/.test(t) || /^\d*\.\d+$/.test(t);
}

function formatNum(v) {
    if (v === null || v === undefined) return '0';
    if (Number.isInteger(v)) return String(v);
    return parseFloat(v.toFixed(8)).toString();
}

/* ---- Validate Expression ---------------------------------- */
function validateExpression(expr) {
    if (!expr || expr.trim().length === 0) {
        return '❌ Invalid Expression: Input is empty';
    }

    var e = expr.trim();

    // Check for invalid characters
    var invalidMatch = e.match(/[^\d\s\+\-\*\/\%\^\(\)\.]/);
    if (invalidMatch) {
        return "❌ Invalid Expression: Character '" + invalidMatch[0] + "' is not allowed";
    }

    // Balanced parentheses
    var depth = 0;
    for (var i = 0; i < e.length; i++) {
        if (e[i] === '(') depth++;
        else if (e[i] === ')') depth--;
        if (depth < 0) return "⚠ Unbalanced Parentheses: Parenthesis ')' without matching '('";
    }
    if (depth !== 0) return "⚠ Unbalanced Parentheses: " + depth + " unclosed '(' parenthesis";

    var clean = e.replace(/\s+/g, '');
    if (!clean) return '❌ Invalid Expression: Empty input';

    var first = clean[0];
    var last  = clean[clean.length - 1];

    if (isOperator(first) && first !== '-') {
        return "❌ Invalid Expression: Cannot start with operator '" + first + "'";
    }
    if (isOperator(last)) {
        return "❌ Invalid Expression: Cannot end with operator '" + last + "'";
    }
    if (first === ')') return "❌ Invalid Expression: Cannot start with ')'";
    if (last  === '(') return "❌ Invalid Expression: Cannot end with '('";

    if (/\(\)/.test(clean)) return "❌ Invalid Expression: Empty parentheses '()' are not allowed";

    // Consecutive operators
    for (var j = 0; j < clean.length - 1; j++) {
        var cur  = clean[j];
        var next = clean[j + 1];
        if (isOperator(cur) && isOperator(next)) {
            return "❌ Invalid Expression: Consecutive operators '" + cur + next + "' are not allowed";
        }
    }

    return '';
}

/* ---- Tokenize --------------------------------------------- */
function tokenize(expr) {
    var tokens = [];
    var numBuf = '';
    var clean  = expr.replace(/\s+/g, '');

    for (var i = 0; i < clean.length; i++) {
        var c = clean[i];

        if (/[\d\.]/.test(c)) {
            numBuf += c;
        } else {
            if (numBuf) { tokens.push(numBuf); numBuf = ''; }
            // Unary minus: at start or after '('
            if (c === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(')) {
                tokens.push('0');
            }
            tokens.push(c);
        }
    }
    if (numBuf) tokens.push(numBuf);

    return tokens;
}

/* ---- Stack helpers ---------------------------------------- */
function stackToString(stack) {
    if (!stack || stack.length === 0) return '(empty)';
    return stack.join(' | ');
}

function evalStackToString(stack) {
    if (!stack || stack.length === 0) return '(empty)';
    var parts = [];
    for (var i = 0; i < stack.length; i++) {
        parts.push(formatNum(stack[i]));
    }
    return parts.join(' | ');
}

/* ---- Infix to Postfix ------------------------------------- */
function infixToPostfix(infix) {
    var steps         = [];
    var tokens        = tokenize(infix);
    var operatorStack = [];
    var postfix       = '';

    for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        var step  = { token: token, action: '', stackState: '', postfixSoFar: '' };

        if (isNumericToken(token)) {
            postfix += (postfix ? ' ' : '') + token;
            step.action = "Operand '" + token + "' added to postfix output";
        }
        else if (token === '(') {
            operatorStack.push(token);
            step.action = "Left parenthesis '(' pushed to operator stack";
        }
        else if (token === ')') {
            var popped = '';
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                var top = operatorStack.pop();
                postfix += (postfix ? ' ' : '') + top;
                popped  += top + ' ';
            }
            if (operatorStack.length > 0) operatorStack.pop(); // discard '('
            step.action = "Right parenthesis ')' encountered. Popped [" + popped.trim() + "] to postfix and discarded '('";
        }
        else if (isOperator(token)) {
            var poppedOps = '';
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                isOperator(operatorStack[operatorStack.length - 1])
            ) {
                var topOp  = operatorStack[operatorStack.length - 1];
                var topPre = getPrecedence(topOp);
                var curPre = getPrecedence(token);
                var shouldPop = (topPre > curPre) ||
                                (topPre === curPre && !isRightAssociative(token));
                if (!shouldPop) break;

                var op = operatorStack.pop();
                postfix  += (postfix ? ' ' : '') + op;
                poppedOps += op + ' ';
            }
            operatorStack.push(token);
            if (poppedOps) {
                step.action = "Operator '" + token + "' has lower/equal precedence than stack top. Popped [" + poppedOps.trim() + "] then pushed '" + token + "'";
            } else {
                step.action = "Operator '" + token + "' pushed to operator stack";
            }
        }

        step.stackState   = stackToString(operatorStack.slice());
        step.postfixSoFar = postfix;
        steps.push(step);
    }

    // Drain remaining operators
    while (operatorStack.length > 0) {
        var rem = operatorStack.pop();
        postfix += (postfix ? ' ' : '') + rem;
        steps.push({
            token:        rem,
            action:       "End of expression. Popped remaining operator '" + rem + "' from stack to postfix",
            stackState:   stackToString(operatorStack.slice()),
            postfixSoFar: postfix
        });
    }

    return { postfix: postfix, steps: steps };
}

/* ---- Apply Operation -------------------------------------- */
function applyOperation(a, b, op) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') {
        if (b === 0) throw new Error('⚠ Division by Zero: Division by zero is undefined');
        return a / b;
    }
    if (op === '%') {
        if (b === 0) throw new Error('⚠ Modulo by Zero: Modulo by zero is undefined');
        return a % b;
    }
    if (op === '^') return Math.pow(a, b);
    throw new Error("❌ Invalid Expression: Unknown operator '" + op + "'");
}

/* ---- Evaluate Postfix ------------------------------------- */
function evaluatePostfix(postfix) {
    var steps        = [];
    var operandStack = [];
    var tokens       = postfix.split(/\s+/);
    var filteredTokens = [];
    for (var f = 0; f < tokens.length; f++) {
        if (tokens[f] !== '') filteredTokens.push(tokens[f]);
    }

    for (var t = 0; t < filteredTokens.length; t++) {
        var token = filteredTokens[t];
        var step  = { token: token, action: '', stackState: '', result: null, hasResult: false };

        if (isNumericToken(token)) {
            var val = parseFloat(token);
            operandStack.push(val);
            step.action = 'Operand ' + formatNum(val) + ' pushed onto stack';
        }
        else if (isOperator(token)) {
            if (operandStack.length < 2) {
                throw new Error("❌ Invalid Expression: Insufficient operands for operator '" + token + "'");
            }
            var b   = operandStack.pop();
            var a   = operandStack.pop();
            var res = applyOperation(a, b, token);
            operandStack.push(res);
            step.action    = 'Popped top two operands (' + formatNum(b) + ', ' + formatNum(a) + '), evaluated ' + formatNum(a) + ' ' + token + ' ' + formatNum(b) + ' = ' + formatNum(res) + ', and pushed result';
            step.result    = res;
            step.hasResult = true;
        }

        step.stackState = evalStackToString(operandStack.slice());
        steps.push(step);
    }

    if (operandStack.length === 0) throw new Error('❌ Invalid Expression: Empty expression after postfix evaluation');
    if (operandStack.length > 1)   throw new Error('❌ Invalid Expression: Unresolved operands left on stack');

    return { result: operandStack[0], steps: steps };
}

/* ---- Master Calculate ------------------------------------- */
function calculateExpression(expression) {
    var result = {
        success:            false,
        errorMessage:       '',
        originalExpression: expression,
        postfixExpression:  '',
        finalResult:        null,
        conversionSteps:    [],
        evaluationSteps:    []
    };

    var validationError = validateExpression(expression);
    if (validationError) {
        result.errorMessage = validationError;
        return result;
    }

    try {
        var conv = infixToPostfix(expression);
        result.postfixExpression = conv.postfix;
        result.conversionSteps   = conv.steps;

        var evl = evaluatePostfix(conv.postfix);
        result.finalResult     = evl.result;
        result.evaluationSteps = evl.steps;

        result.success = true;
    } catch (err) {
        result.errorMessage = err.message;
    }

    return result;
}

/* ============================================================
   SECTION 2: STACK VISUALIZER
============================================================ */

function StackVisualizer(container) {
    this.container = container;
    this.items     = [];
}

StackVisualizer.prototype.render = function(stackStr) {
    if (!stackStr || stackStr === '(empty)') {
        this._draw([]);
        return;
    }
    var newItems = stackStr.split(' | ');
    this._draw(newItems);
    this.items = newItems;
};

StackVisualizer.prototype._draw = function(items) {
    this.container.innerHTML = '';

    if (!items || items.length === 0) {
        var msg = document.createElement('div');
        msg.className   = 'stack-empty-msg';
        msg.textContent = 'Empty';
        this.container.appendChild(msg);
        return;
    }

    // Appending bottom to top matches column-reverse layout
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var el   = document.createElement('div');
        el.className = 'stack-element';

        if (isOperator(item)) {
            el.className += ' operator-el';
        } else if (isNumericToken(item) || item === '0') {
            el.className += ' number-el';
        } else if (item === '(' || item === ')') {
            el.className += ' paren-el';
        }

        el.textContent = item;
        this.container.appendChild(el);
    }
};

/* ============================================================
   SECTION 3: HISTORY MANAGER
============================================================ */

var HISTORY_KEY = 'stackcalc_history';
var MAX_HISTORY = 20;

function loadHistory() {
    try {
        var raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveHistory(history) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Could not save history:', e);
    }
}

function addToHistory(expression, postfix, result) {
    var history = loadHistory();
    var entry = {
        id:         Date.now(),
        expression: expression,
        postfix:    postfix,
        result:     formatNum(result),
        time:       new Date().toLocaleTimeString()
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.pop();
    saveHistory(history);
    return history;
}

/* ============================================================
   SECTION 4: DOM CONTROLLER
============================================================ */

function el(id) { return document.getElementById(id); }

/* Global state & Animation Timers */
var currentResult   = null;
var opVisualizer    = null;
var evalVisualizer  = null;
var currentTheme    = 'dark';
var toastTimer      = null;
var animationTimers = [];

/* ---- Theme ------------------------------------------------ */
function initTheme() {
    var saved = 'dark';
    try { saved = localStorage.getItem('stackcalc_theme') || 'dark'; } catch(e) {}
    setTheme(saved);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('stackcalc_theme', theme); } catch(e) {}
    var icon = el('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    showToast(currentTheme === 'dark' ? '🌙 Dark theme enabled' : '☀️ Light theme enabled', 'info');
}

/* ---- Toast ------------------------------------------------ */
function showToast(msg, type, duration) {
    if (!type)     type     = 'info';
    if (!duration) duration = 2800;

    var toast = el('toast');
    if (!toast) return;

    toast.textContent = msg;
    toast.className   = 'toast ' + type + ' show';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
        toast.className = 'toast ' + type;
    }, duration);
}

/* ---- Error Panel ------------------------------------------ */
function showError(msg) {
    var panel = el('error-panel');
    var text  = el('error-text');
    var icon  = el('error-icon');
    
    if (text) text.textContent = msg;
    if (icon) {
        if (msg.indexOf('❌') === 0) {
            icon.innerHTML = '<i class="fas fa-circle-xmark"></i>';
            icon.style.color = 'var(--error)';
        } else {
            icon.innerHTML = '<i class="fas fa-triangle-exclamation"></i>';
            icon.style.color = 'var(--warn)';
        }
    }

    if (panel) {
        panel.removeAttribute('hidden');
        panel.style.animation = 'none';
        panel.offsetWidth; // force reflow
        panel.style.animation = '';
    }
}

function hideError() {
    var panel = el('error-panel');
    if (panel) panel.setAttribute('hidden', '');
}

/* ---- Syntax Highlighting ---------------------------------- */
function highlightExpression(expr) {
    // Single pass, so later replacements never touch the <span> markup already inserted
    return expr.replace(/(\d+\.?\d*)|([+\-*\/%^])|([()])/g, function (m, num, op, paren) {
        if (num) return '<span class="expr-num">' + num + '</span>';
        if (op)  return '<span class="expr-op">' + op + '</span>';
        return '<span class="expr-paren">' + paren + '</span>';
    });
}

/* ---- Highlight Processed Token --------------------------- */
function getHighlightedTokenHTML(token) {
    var cls = 'token-highlight';
    if (isOperator(token)) cls += ' is-operator';
    else if (token === '(' || token === ')') cls += ' is-paren';
    else if (isNumericToken(token)) cls += ' is-number';
    return '<span class="' + cls + '">' + escHtml(token) + '</span>';
}

/* ---- Escape HTML ------------------------------------------ */
function escHtml(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ---- Clear active animation timeouts --------------------- */
function clearAllAnimations() {
    for (var i = 0; i < animationTimers.length; i++) {
        clearTimeout(animationTimers[i]);
    }
    animationTimers = [];
}

/* ============================================================
   PROGRESS INDICATOR MANAGEMENT
============================================================ */
function updateProgressBar(stage) {
    var bar = el('progress-bar');
    if (!bar) return;
    bar.removeAttribute('hidden');

    var stepInput   = el('prog-input');
    var stepConvert = el('prog-convert');
    var stepEval    = el('prog-eval');
    var stepResult  = el('prog-result');

    var steps = [stepInput, stepConvert, stepEval, stepResult];
    for (var i = 0; i < steps.length; i++) {
        if (steps[i]) steps[i].className = 'progress-step';
    }

    if (stage === 'input') {
        if (stepInput) stepInput.className += ' done';
    } else if (stage === 'convert') {
        if (stepInput) stepInput.className += ' done';
        if (stepConvert) stepConvert.className += ' done';
    } else if (stage === 'eval') {
        if (stepInput) stepInput.className += ' done';
        if (stepConvert) stepConvert.className += ' done';
        if (stepEval) stepEval.className += ' done';
    } else if (stage === 'result') {
        if (stepInput) stepInput.className += ' done';
        if (stepConvert) stepConvert.className += ' done';
        if (stepEval) stepEval.className += ' done';
        if (stepResult) stepResult.className += ' done';
    }
}

/* ============================================================
   DEMO ANIMATION & RENDER PIPELINES
   (Slowed down animation rate to 1000ms per step)
============================================================ */

function runInfixToPostfixDemo(steps, onComplete) {
    var tbody = el('conversion-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    updateProgressBar('convert');
    if (opVisualizer) opVisualizer.render('(empty)');

    var delay = 1000; // 1 second per step for clean presentation

    function animateStep(idx) {
        if (idx >= steps.length) {
            // Remove active-row class from last row
            var rows = tbody.querySelectorAll('tr');
            if (rows.length > 0) {
                rows[rows.length - 1].classList.remove('active-row');
            }
            if (onComplete) onComplete();
            return;
        }

        var step = steps[idx];
        var tr   = document.createElement('tr');
        tr.className = 'active-row';

        // Remove active class from previous rows
        var oldActive = tbody.querySelector('.active-row');
        if (oldActive) oldActive.classList.remove('active-row');

        var tokenClass = '';
        if (isNumericToken(step.token))      tokenClass = 'expr-num';
        else if (isOperator(step.token))     tokenClass = 'expr-op';
        else if (step.token === '(' || step.token === ')') tokenClass = 'expr-paren';

        tr.innerHTML =
            '<td><span class="step-num">' + (idx + 1) + '</span></td>' +
            '<td class="token-cell">' + getHighlightedTokenHTML(step.token) + '</td>' +
            '<td class="action-cell">'  + escHtml(step.action)      + '</td>' +
            '<td class="stack-cell">'   + escHtml(step.stackState)  + '</td>' +
            '<td class="postfix-cell">' + escHtml(step.postfixSoFar)+ '</td>';

        tbody.appendChild(tr);
        
        // Render step stack in visualizer
        if (opVisualizer) opVisualizer.render(step.stackState);

        // Scroll row into view gently
        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        var timer = setTimeout(function() {
            animateStep(idx + 1);
        }, delay);
        animationTimers.push(timer);
    }

    animateStep(0);
}

function runPostfixEvaluationDemo(steps, onComplete) {
    var tbody = el('evaluation-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    updateProgressBar('eval');
    if (evalVisualizer) evalVisualizer.render('(empty)');

    var delay = 1000;

    function animateStep(idx) {
        if (idx >= steps.length) {
            var rows = tbody.querySelectorAll('tr');
            if (rows.length > 0) {
                rows[rows.length - 1].classList.remove('active-row');
            }
            if (onComplete) onComplete();
            return;
        }

        var step = steps[idx];
        var tr   = document.createElement('tr');
        tr.className = 'active-row';

        var oldActive = tbody.querySelector('.active-row');
        if (oldActive) oldActive.classList.remove('active-row');

        tr.innerHTML =
            '<td><span class="step-num">' + (idx + 1) + '</span></td>' +
            '<td class="token-cell">' + getHighlightedTokenHTML(step.token) + '</td>' +
            '<td class="action-cell">'  + escHtml(step.action)     + '</td>' +
            '<td class="stack-cell">'   + escHtml(step.stackState) + '</td>';

        tbody.appendChild(tr);

        if (evalVisualizer) evalVisualizer.render(step.stackState);

        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        var timer = setTimeout(function() {
            animateStep(idx + 1);
        }, delay);
        animationTimers.push(timer);
    }

    animateStep(0);
}

/* ---- Render Full Results --------------------------------------- */
function renderResults(result) {
    currentResult = result;

    var section = el('results-section');
    if (section) section.removeAttribute('hidden');

    var origEl = el('original-expr');
    var postEl = el('postfix-expr');
    var resEl  = el('final-result');

    if (origEl) origEl.innerHTML  = highlightExpression(escHtml(result.originalExpression));
    if (postEl) postEl.textContent = result.postfixExpression;

    if (resEl) {
        resEl.textContent = formatNum(result.finalResult);
        resEl.style.animation = 'none';
        resEl.offsetWidth;
        resEl.style.animation = 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both';
    }

    // Run conversion animation, followed by evaluation animation
    runInfixToPostfixDemo(result.conversionSteps, function() {
        runPostfixEvaluationDemo(result.evaluationSteps, function() {
            updateProgressBar('result');
            showToast('Calculation complete!', 'success');
            
            // Scroll result card into view at the end
            var resCard = el('result-card');
            if (resCard) {
                setTimeout(function() {
                    resCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 200);
            }
        });
    });
}

/* ---- Handle Calculate ------------------------------------- */
function handleCalculate() {
    var input   = el('expression-input');
    var calcBtn = el('calculate-btn');
    if (!input || !calcBtn) return;

    var expr = input.value.trim();
    hideError();
    clearAllAnimations();

    // Reset progress indicator to input state
    updateProgressBar('input');

    // Show loading state
    calcBtn.classList.add('loading');
    calcBtn.disabled = true;

    setTimeout(function() {
        var result = calculateExpression(expr);

        calcBtn.classList.remove('loading');
        calcBtn.disabled = false;

        if (!result.success) {
            showError(result.errorMessage);
            var section = el('results-section');
            if (section) section.setAttribute('hidden', '');
            
            var progress = el('progress-bar');
            if (progress) progress.setAttribute('hidden', '');

            showToast(result.errorMessage, 'error', 4000);
            return;
        }

        renderResults(result);
        addToHistory(result.originalExpression, result.postfixExpression, result.finalResult);
        renderHistory();
    }, 200);
}

/* ---- Handle Reset ----------------------------------------- */
function handleReset() {
    var input    = el('expression-input');
    var section  = el('results-section');
    var progress = el('progress-bar');

    clearAllAnimations();

    if (input)   { input.value = ''; input.focus(); }
    if (section) section.setAttribute('hidden', '');
    if (progress) progress.setAttribute('hidden', '');
    
    hideError();
    currentResult = null;

    if (opVisualizer)   opVisualizer.render('(empty)');
    if (evalVisualizer) evalVisualizer.render('(empty)');
}

/* ---- Handle Copy ------------------------------------------ */
function handleCopyResult() {
    if (!currentResult) return;
    var text = 'Expression: ' + currentResult.originalExpression +
               '\nPostfix: '  + currentResult.postfixExpression  +
               '\nResult: '   + formatNum(currentResult.finalResult);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Result copied to clipboard!', 'success');
        }).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Result copied to clipboard!', 'success');
    } catch (e) {
        showToast('Could not copy automatically.', 'error');
    }
    document.body.removeChild(ta);
}

/* ---- Handle Download -------------------------------------- */
function handleDownload() {
    if (!currentResult) return;

    var lines = [
        '====================================================',
        '  EXPRESSION CALCULATOR USING STACK',
        '  DSA Mini Project Report',
        '====================================================',
        'Developed By: Sneha Mangwani',
        'B.Tech CSE, Lovely Professional University',
        '----------------------------------------------------',
        'Original Expression : ' + currentResult.originalExpression,
        'Postfix Expression  : ' + currentResult.postfixExpression,
        'Final Result        : ' + formatNum(currentResult.finalResult),
        '',
        '---- INFIX TO POSTFIX CONVERSION STEPS ----',
        ''
    ];

    for (var i = 0; i < currentResult.conversionSteps.length; i++) {
        var s = currentResult.conversionSteps[i];
        lines.push('Step ' + (i + 1) + ': Token=' + s.token);
        lines.push('  Action      : ' + s.action);
        lines.push('  Stack State : ' + s.stackState);
        lines.push('  Postfix Now : ' + s.postfixSoFar);
        lines.push('');
    }

    lines.push('---- POSTFIX EVALUATION STEPS ----');
    lines.push('');

    for (var j = 0; j < currentResult.evaluationSteps.length; j++) {
        var e2 = currentResult.evaluationSteps[j];
        lines.push('Step ' + (j + 1) + ': Token=' + e2.token);
        lines.push('  Action      : ' + e2.action);
        lines.push('  Stack State : ' + e2.stackState);
        lines.push('');
    }

    lines.push('====================================================');
    lines.push('Generated at: ' + new Date().toLocaleString());

    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'expression_calculator_report_' + Date.now() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded successfully!', 'success');
}

/* ---- Random Example --------------------------------------- */
var EXAMPLES = [
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
    '(2^3)*(5+1)-7'
];

function handleRandom() {
    var input = el('expression-input');
    if (!input) return;
    var example = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    input.value = example;
    input.focus();
    input.style.borderColor = 'var(--primary)';
    setTimeout(function() { input.style.borderColor = ''; }, 600);
    showToast('Loaded example: ' + example, 'info');
}

/* ---- History UI ------------------------------------------- */
function renderHistory() {
    var list  = el('history-list');
    var empty = el('history-empty');
    if (!list) return;

    var old = list.querySelectorAll('.history-item');
    for (var r = 0; r < old.length; r++) list.removeChild(old[r]);

    var history = loadHistory();

    if (history.length === 0) {
        if (empty) empty.style.display = '';
        return;
    }
    if (empty) empty.style.display = 'none';

    for (var i = 0; i < history.length; i++) {
        (function(entry) {
            var item = document.createElement('div');
            item.className = 'history-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('title', 'Click to load this expression');

            item.innerHTML =
                '<span class="history-expr">' + escHtml(entry.expression) + '</span>' +
                '<div class="history-meta">' +
                    '<span class="history-result">= ' + escHtml(entry.result) + '</span>' +
                    '<span class="history-time">'     + escHtml(entry.time)   + '</span>' +
                    '<button class="history-load-btn" title="Load">' +
                        '<i class="fas fa-play"></i>' +
                    '</button>' +
                '</div>';

            item.addEventListener('click', function() {
                var inp = el('expression-input');
                if (inp) {
                    inp.value = entry.expression;
                    inp.focus();
                    inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            list.insertBefore(item, list.firstChild);
        })(history[i]);
    }
}

function handleClearHistory() {
    saveHistory([]);
    renderHistory();
    showToast('History cleared!', 'info');
}

/* ---- Keyboard Shortcuts (Enter and Esc only) -------------- */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        var activeTag = document.activeElement ? document.activeElement.tagName : '';
        var inInput   = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

        if (e.key === 'Enter' && inInput) {
            e.preventDefault();
            handleCalculate();
        }

        if (e.key === 'Escape') {
            handleReset();
        }
    });
}

/* ============================================================
   SECTION 5: APP INITIALIZER
============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    initTheme();

    var opVizEl   = el('op-stack-viz');
    var evalVizEl = el('eval-stack-viz');
    if (opVizEl)   opVisualizer   = new StackVisualizer(opVizEl);
    if (evalVizEl) evalVisualizer = new StackVisualizer(evalVizEl);

    renderHistory();
    initKeyboardShortcuts();

    var themeBtn   = el('theme-toggle');
    var clrInBtn   = el('clear-input-btn');
    var calcBtn    = el('calculate-btn');
    var resetBtn   = el('reset-btn');
    var randBtn    = el('random-btn');
    var copyBtn    = el('copy-result-btn');
    var dlBtn      = el('download-btn');
    var clrHisBtn  = el('clear-history-btn');
    var inputField = el('expression-input');

    if (themeBtn)   themeBtn.addEventListener('click', toggleTheme);

    if (inputField) {
        inputField.addEventListener('input', function() { hideError(); });
    }

    if (clrInBtn) {
        clrInBtn.addEventListener('click', function() {
            var inp = el('expression-input');
            if (inp) { inp.value = ''; inp.focus(); }
            hideError();
        });
    }

    if (calcBtn)   calcBtn.addEventListener('click', handleCalculate);
    if (resetBtn)  resetBtn.addEventListener('click', handleReset);
    if (randBtn)   randBtn.addEventListener('click', handleRandom);
    if (copyBtn)   copyBtn.addEventListener('click', handleCopyResult);
    if (dlBtn)     dlBtn.addEventListener('click', handleDownload);
    if (clrHisBtn) clrHisBtn.addEventListener('click', handleClearHistory);

    if (inputField && !inputField.value) {
        inputField.value = '((12+4)*5)-(8/2)';
    }

    if (inputField) inputField.focus();

    console.log('Expression Calculator Using Stack loaded.');
});
