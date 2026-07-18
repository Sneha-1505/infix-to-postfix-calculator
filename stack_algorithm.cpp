/*
 * ============================================================
 *  stack_algorithm.cpp
 *  Expression Calculator Using Stack - Core Implementation
 * ============================================================
 *
 *  Project  : Expression Calculator Using Stack
 *  Course   : Data Structures & Algorithms (DSA)
 *  Language : C++ (STL Stack, Strings, Expression Parsing)
 *
 *  Implements:
 *    1. Infix → Postfix Conversion  (Shunting-Yard Algorithm)
 *    2. Postfix Evaluation           (Stack-based Evaluation)
 *    3. Expression Validation
 *    4. Tokenizer
 *
 *  Key Data Structures:
 *    - std::stack<std::string>  → operator/parenthesis stack
 *    - std::stack<double>       → operand stack for evaluation
 *    - std::vector<std::string> → token list
 *    - std::string              → expression storage
 *
 * ============================================================
 */

#include "stack_algorithm.h"

#include <stack>
#include <sstream>
#include <stdexcept>
#include <cctype>
#include <cmath>
#include <algorithm>
#include <iostream>

// ============================================================
//  getPrecedence()
//  Returns integer precedence of an operator character.
//  Used during Shunting-Yard to decide when to pop.
// ============================================================
int getPrecedence(char op) {
    switch (op) {
        case '^':           // Exponentiation: highest precedence
            return 3;
        case '*':           // Multiplication
        case '/':           // Division
        case '%':           // Modulo
            return 2;
        case '+':           // Addition
        case '-':           // Subtraction: lowest precedence
            return 1;
        default:
            return 0;       // Not an operator
    }
}

// ============================================================
//  isRightAssociative()
//  Only '^' (power) is right-associative.
//  2^3^2 = 2^(3^2) = 512, not (2^3)^2 = 64
// ============================================================
bool isRightAssociative(char op) {
    return op == '^';
}

// ============================================================
//  isOperator()
//  Returns true if character is a supported binary operator.
// ============================================================
bool isOperator(char c) {
    return c == '+' || c == '-' || c == '*' ||
           c == '/' || c == '%' || c == '^';
}

// ============================================================
//  isOperand()
//  Returns true if character is digit or decimal point.
// ============================================================
bool isOperand(char c) {
    return std::isdigit(c) || c == '.';
}

// ============================================================
//  validateExpression()
//  Performs comprehensive validation of the infix expression.
//  Returns "" on success, or an error message string on failure.
// ============================================================
std::string validateExpression(const std::string& expr) {
    // ---- Check 1: Empty expression -------------------------
    if (expr.empty()) {
        return "Error: Expression is empty. Please enter a valid mathematical expression.";
    }

    // ---- Remove leading/trailing whitespace ----------------
    std::string e = expr;
    e.erase(0, e.find_first_not_of(" \t\n\r"));
    e.erase(e.find_last_not_of(" \t\n\r") + 1);

    if (e.empty()) {
        return "Error: Expression contains only whitespace.";
    }

    // ---- Check 2: Balanced parentheses ---------------------
    int parenCount = 0;
    for (char c : e) {
        if (c == '(') parenCount++;
        else if (c == ')') parenCount--;
        if (parenCount < 0) {
            return "Error: Unbalanced parentheses — found ')' without matching '('.";
        }
    }
    if (parenCount != 0) {
        return "Error: Unbalanced parentheses — " + std::to_string(parenCount) + " unclosed '(' found.";
    }

    // ---- Check 3: Invalid characters -----------------------
    for (size_t i = 0; i < e.size(); i++) {
        char c = e[i];
        if (!isdigit(c) && !isOperator(c) &&
            c != '(' && c != ')' && c != '.' && c != ' ') {
            return std::string("Error: Invalid character '") + c + "' found in expression.";
        }
    }

    // ---- Check 4: Expression starts/ends correctly ---------
    // Strip spaces for these checks
    std::string clean;
    for (char c : e) if (c != ' ') clean += c;

    if (clean.empty()) return "Error: Expression is empty after removing spaces.";

    char first = clean.front();
    char last  = clean.back();

    // Allow unary minus at start (e.g., -5+3) by allowing '-' at front
    if (isOperator(first) && first != '-') {
        return std::string("Error: Expression cannot start with operator '") + first + "'.";
    }
    if (isOperator(last)) {
        return std::string("Error: Expression cannot end with operator '") + last + "'.";
    }
    if (first == ')') {
        return "Error: Expression cannot start with ')'.";
    }
    if (last == '(') {
        return "Error: Expression cannot end with '('.";
    }

    // ---- Check 5: Consecutive operators --------------------
    bool prevWasOp = false;
    bool prevWasOpenParen = false;
    for (size_t i = 0; i < clean.size(); i++) {
        char c = clean[i];
        bool currIsOp = isOperator(c);

        if (currIsOp) {
            // Allow '-' after '(' as unary minus: (-5+3)
            if (prevWasOpenParen && c == '-') {
                prevWasOp = false;
                prevWasOpenParen = false;
                continue;
            }
            if (prevWasOp) {
                return "Error: Consecutive operators found near position " +
                       std::to_string(i) + ".";
            }
            prevWasOp = true;
        } else {
            prevWasOp = false;
        }
        prevWasOpenParen = (c == '(');
    }

    // ---- Check 6: Empty parentheses ------------------------
    for (size_t i = 0; i + 1 < clean.size(); i++) {
        if (clean[i] == '(' && clean[i+1] == ')') {
            return "Error: Empty parentheses '()' are not allowed.";
        }
    }

    return ""; // All checks passed
}

// ============================================================
//  tokenize()
//  Splits the expression string into a vector of string tokens.
//  Multi-digit numbers and decimals become one token.
//  E.g., "12.5+4" → {"12.5", "+", "4"}
// ============================================================
std::vector<std::string> tokenize(const std::string& expr) {
    std::vector<std::string> tokens;
    std::string numBuffer; // accumulates digit characters

    for (size_t i = 0; i < expr.size(); i++) {
        char c = expr[i];

        if (c == ' ') {
            // Flush any accumulated number
            if (!numBuffer.empty()) {
                tokens.push_back(numBuffer);
                numBuffer.clear();
            }
            continue;
        }

        if (isdigit(c) || c == '.') {
            // Accumulate digit/decimal into numBuffer
            numBuffer += c;
        } else {
            // Flush accumulated number before pushing operator/paren
            if (!numBuffer.empty()) {
                tokens.push_back(numBuffer);
                numBuffer.clear();
            }
            // Handle unary minus: if '-' appears at start or after '('
            // convert it to a token "-1 *" implicitly by prepending "0"
            if (c == '-' && (tokens.empty() || tokens.back() == "(")) {
                tokens.push_back("0"); // Treat unary minus as (0 - x)
            }
            // Push the operator or parenthesis as a single-char token
            tokens.push_back(std::string(1, c));
        }
    }
    // Flush any remaining number
    if (!numBuffer.empty()) {
        tokens.push_back(numBuffer);
    }

    return tokens;
}

// ============================================================
//  stackToString()
//  Helper: converts a stack<string> to a human-readable string
//  showing top → bottom, separated by " | ".
//  E.g., stack [+, *] → "* | +"  (top is last pushed)
// ============================================================
static std::string stackToString(std::stack<std::string> s) {
    if (s.empty()) return "(empty)";
    std::vector<std::string> items;
    while (!s.empty()) {
        items.push_back(s.top());
        s.pop();
    }
    // items[0] is top; display as bottom→top left→right
    std::reverse(items.begin(), items.end());
    std::string result;
    for (size_t i = 0; i < items.size(); i++) {
        if (i) result += " | ";
        result += items[i];
    }
    return result;
}

// ============================================================
//  evalStackToString()
//  Helper: converts a stack<double> to a human-readable string.
// ============================================================
static std::string evalStackToString(std::stack<double> s) {
    if (s.empty()) return "(empty)";
    std::vector<std::string> items;
    while (!s.empty()) {
        double val = s.top(); s.pop();
        // Format: remove trailing zeros for clean display
        std::ostringstream oss;
        if (val == (long long)val) {
            oss << (long long)val;
        } else {
            oss << val;
        }
        items.push_back(oss.str());
    }
    std::reverse(items.begin(), items.end());
    std::string result;
    for (size_t i = 0; i < items.size(); i++) {
        if (i) result += " | ";
        result += items[i];
    }
    return result;
}

// ============================================================
//  infixToPostfix()
//  Shunting-Yard Algorithm — converts infix to postfix.
//
//  Algorithm Steps:
//    For each token in the input:
//      1. If token is a NUMBER  → add to output queue
//      2. If token is OPERATOR  → while the operator at the top
//         of the stack has greater/equal precedence (respecting
//         associativity), pop it to output. Then push current op.
//      3. If token is '('       → push to stack
//      4. If token is ')'       → pop from stack to output until
//         '(' is found; discard the '('
//    After all tokens:
//      5. Pop all remaining operators from stack to output
//
//  STL Stack: std::stack<std::string> operatorStack
// ============================================================
std::string infixToPostfix(const std::string& infix,
                           std::vector<ConversionStep>& steps) {
    steps.clear();

    // Tokenize the expression first
    std::vector<std::string> tokens = tokenize(infix);

    // Operator/parenthesis stack (STL stack)
    std::stack<std::string> operatorStack;

    // Output postfix expression (built token by token)
    std::string postfix;

    for (const std::string& token : tokens) {
        ConversionStep step;
        step.token = token;

        // ---- Case 1: Token is a NUMBER (operand) -----------
        if (isdigit(token[0]) || (token.size() > 1 && token[0] == '.')) {
            // Directly append to postfix output
            if (!postfix.empty()) postfix += " ";
            postfix += token;
            step.action = "Operand '" + token + "' → add directly to postfix output";
        }
        // ---- Case 2: Token is '(' --------------------------
        else if (token == "(") {
            operatorStack.push(token);
            step.action = "Left parenthesis '(' → push to stack";
        }
        // ---- Case 3: Token is ')' --------------------------
        else if (token == ")") {
            // Pop until matching '(' is found
            std::string popped;
            while (!operatorStack.empty() && operatorStack.top() != "(") {
                if (!postfix.empty()) postfix += " ";
                postfix += operatorStack.top();
                popped += operatorStack.top() + " ";
                operatorStack.pop();
            }
            if (!operatorStack.empty()) {
                operatorStack.pop(); // Discard the '('
            }
            step.action = "Right parenthesis ')' → pop [" + popped + "] to postfix, discard '('";
        }
        // ---- Case 4: Token is an OPERATOR ------------------
        else if (token.size() == 1 && isOperator(token[0])) {
            char op = token[0];
            std::string popped;

            // Pop operators with higher/equal precedence (considering associativity)
            while (!operatorStack.empty() &&
                   operatorStack.top() != "(" &&
                   operatorStack.top().size() == 1 &&
                   isOperator(operatorStack.top()[0])) {

                char topOp = operatorStack.top()[0];
                int topPrec = getPrecedence(topOp);
                int curPrec = getPrecedence(op);

                // Pop if: top has higher precedence, OR equal precedence and left-associative
                bool shouldPop = (topPrec > curPrec) ||
                                 (topPrec == curPrec && !isRightAssociative(op));
                if (!shouldPop) break;

                if (!postfix.empty()) postfix += " ";
                postfix += operatorStack.top();
                popped += operatorStack.top() + " ";
                operatorStack.pop();
            }

            operatorStack.push(token);
            step.action = "Operator '" + token + "' → popped [" + popped + "], push '" + token + "' to stack";
        }

        // Record stack state and postfix progress
        step.stackState  = stackToString(operatorStack);
        step.postfixSoFar = postfix;
        steps.push_back(step);
    }

    // ---- Step 5: Pop all remaining operators ---------------
    std::string popped;
    while (!operatorStack.empty()) {
        ConversionStep step;
        step.token = operatorStack.top();
        if (!postfix.empty()) postfix += " ";
        postfix += operatorStack.top();
        popped  += operatorStack.top() + " ";
        operatorStack.pop();

        step.action       = "End of input → pop '" + step.token + "' from stack to postfix";
        step.stackState   = stackToString(operatorStack);
        step.postfixSoFar = postfix;
        steps.push_back(step);
    }

    return postfix;
}

// ============================================================
//  applyOperation()
//  Applies a binary arithmetic operation.
//  Throws std::runtime_error on division/modulo by zero.
// ============================================================
double applyOperation(double a, double b, const std::string& op) {
    if (op == "+") return a + b;
    if (op == "-") return a - b;
    if (op == "*") return a * b;
    if (op == "/") {
        if (b == 0.0) throw std::runtime_error("Error: Division by zero is undefined.");
        return a / b;
    }
    if (op == "%") {
        if (b == 0.0) throw std::runtime_error("Error: Modulo by zero is undefined.");
        return std::fmod(a, b);
    }
    if (op == "^") {
        return std::pow(a, b);
    }
    throw std::runtime_error("Error: Unknown operator '" + op + "'.");
}

// ============================================================
//  evaluatePostfix()
//  Evaluates a space-separated postfix expression.
//
//  Algorithm:
//    For each token in postfix:
//      1. If NUMBER  → push onto operand stack
//      2. If OPERATOR → pop two operands (b then a),
//                       apply operation, push result
//    Final answer is the single value left on the stack.
//
//  STL Stack: std::stack<double> operandStack
// ============================================================
double evaluatePostfix(const std::string& postfix,
                       std::vector<EvaluationStep>& steps) {
    steps.clear();

    // Operand stack (STL stack of doubles)
    std::stack<double> operandStack;

    // Tokenize the postfix string (space-separated)
    std::istringstream iss(postfix);
    std::string token;

    while (iss >> token) {
        EvaluationStep step;
        step.token     = token;
        step.hasResult = false;
        step.result    = 0.0;

        // ---- Case 1: Token is a NUMBER ---------------------
        if (isdigit(token[0]) || (token.size() > 1 && isdigit(token[1])) ||
            token[0] == '.') {
            double val = std::stod(token);
            operandStack.push(val);

            std::ostringstream oss;
            if (val == (long long)val) oss << (long long)val;
            else oss << val;
            step.action = "Push operand " + oss.str() + " onto stack";
        }
        // ---- Case 2: Token is an OPERATOR ------------------
        else if (token.size() == 1 && isOperator(token[0])) {
            if (operandStack.size() < 2) {
                throw std::runtime_error("Error: Insufficient operands for operator '" + token + "'.");
            }

            double b = operandStack.top(); operandStack.pop(); // right operand
            double a = operandStack.top(); operandStack.pop(); // left operand

            double res = applyOperation(a, b, token);
            operandStack.push(res);

            // Format operands for display
            auto fmt = [](double v) -> std::string {
                std::ostringstream o;
                if (v == (long long)v) o << (long long)v;
                else o << v;
                return o.str();
            };

            step.action    = "Pop " + fmt(b) + " and " + fmt(a) +
                             ", compute " + fmt(a) + " " + token + " " + fmt(b) +
                             " = " + fmt(res) + ", push result";
            step.result    = res;
            step.hasResult = true;
        }

        step.stackState = evalStackToString(operandStack);
        steps.push_back(step);
    }

    if (operandStack.empty()) {
        throw std::runtime_error("Error: Empty expression after postfix evaluation.");
    }
    if (operandStack.size() > 1) {
        throw std::runtime_error("Error: Too many operands — expression may be malformed.");
    }

    return operandStack.top();
}

// ============================================================
//  calculateExpression()
//  Main entry point: validates → converts → evaluates.
//  Returns a CalculatorResult with all step data.
// ============================================================
CalculatorResult calculateExpression(const std::string& expression) {
    CalculatorResult result;
    result.success             = false;
    result.finalResult         = 0.0;
    result.originalExpression  = expression;

    // ---- Step 1: Validate ----------------------------------
    std::string validationError = validateExpression(expression);
    if (!validationError.empty()) {
        result.errorMessage = validationError;
        return result;
    }

    try {
        // ---- Step 2: Infix → Postfix -----------------------
        result.postfixExpression = infixToPostfix(expression, result.conversionSteps);

        // ---- Step 3: Evaluate Postfix ----------------------
        result.finalResult = evaluatePostfix(result.postfixExpression, result.evaluationSteps);

        result.success = true;

    } catch (const std::exception& ex) {
        result.errorMessage = ex.what();
    }

    return result;
}
