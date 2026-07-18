/*
 * ============================================================
 *  stack_algorithm.h
 *  Expression Calculator Using Stack - Header File
 * ============================================================
 *
 *  Project  : Expression Calculator Using Stack
 *  Course   : Data Structures & Algorithms (DSA)
 *  Language : C++ (STL Stack, Strings, Expression Parsing)
 *
 *  Description:
 *    This header declares all functions used for:
 *      1. Infix to Postfix conversion (Shunting-Yard algorithm)
 *      2. Postfix expression evaluation
 *      3. Helper utilities (precedence, associativity, validation)
 *
 *  Algorithms Used:
 *    - Shunting-Yard Algorithm (by Edsger Dijkstra)
 *    - Postfix Stack Evaluation
 *
 *  Data Structures Used:
 *    - std::stack<char>   (operator stack for conversion)
 *    - std::stack<double> (operand stack for evaluation)
 *    - std::string        (expression storage and parsing)
 *
 * ============================================================
 */

#ifndef STACK_ALGORITHM_H
#define STACK_ALGORITHM_H

#include <string>
#include <vector>

// ============================================================
//  STRUCT: ConversionStep
//  Represents a single step in Infix → Postfix conversion
// ============================================================
struct ConversionStep {
    std::string token;          // The current character/token being processed
    std::string action;         // Description of the action taken
    std::string stackState;     // Snapshot of the operator stack after this step
    std::string postfixSoFar;   // Postfix output built so far
};

// ============================================================
//  STRUCT: EvaluationStep
//  Represents a single step in Postfix evaluation
// ============================================================
struct EvaluationStep {
    std::string token;          // The current token being processed
    std::string action;         // Description of the operation performed
    std::string stackState;     // Snapshot of the operand stack after this step
    double result;              // Intermediate or final result
    bool hasResult;             // Whether this step produced a result
};

// ============================================================
//  STRUCT: CalculatorResult
//  Complete result bundle returned to the caller
// ============================================================
struct CalculatorResult {
    bool success;                           // Whether evaluation succeeded
    std::string errorMessage;               // Error message if failed
    std::string originalExpression;         // User's original input
    std::string postfixExpression;          // Converted postfix form
    double finalResult;                     // Numeric answer
    std::vector<ConversionStep> conversionSteps;   // Step-by-step conversion
    std::vector<EvaluationStep> evaluationSteps;   // Step-by-step evaluation
};

// ============================================================
//  FUNCTION DECLARATIONS
// ============================================================

/*
 * getPrecedence()
 * Returns the precedence level of an operator.
 * Higher value = higher precedence.
 *   ^ → 3
 *   * / % → 2
 *   + - → 1
 *   else → 0
 */
int getPrecedence(char op);

/*
 * isRightAssociative()
 * Returns true if the operator is right-associative.
 * Only ^ (exponentiation) is right-associative.
 */
bool isRightAssociative(char op);

/*
 * isOperator()
 * Returns true if the character is one of: + - * / % ^
 */
bool isOperator(char c);

/*
 * isOperand()
 * Returns true if the character is a digit or a decimal point.
 */
bool isOperand(char c);

/*
 * validateExpression()
 * Validates the infix expression before processing.
 * Checks for:
 *   - Empty input
 *   - Unbalanced parentheses
 *   - Invalid characters
 *   - Consecutive operators
 *   - Expression starting/ending with operator
 * Returns empty string if valid, else an error message.
 */
std::string validateExpression(const std::string& expr);

/*
 * tokenize()
 * Breaks the expression string into a list of tokens.
 * Multi-digit numbers and decimals are grouped as one token.
 * E.g., "12+4" → {"12", "+", "4"}
 */
std::vector<std::string> tokenize(const std::string& expr);

/*
 * infixToPostfix()
 * Converts an infix expression to postfix using the Shunting-Yard
 * algorithm with an STL stack<string>.
 * Records every step into the conversionSteps vector.
 * Returns the postfix expression as a space-separated string.
 */
std::string infixToPostfix(const std::string& infix,
                           std::vector<ConversionStep>& steps);

/*
 * evaluatePostfix()
 * Evaluates a postfix expression using an STL stack<double>.
 * Records every step into the evaluationSteps vector.
 * Returns the numeric result.
 * Throws std::runtime_error on division by zero.
 */
double evaluatePostfix(const std::string& postfix,
                       std::vector<EvaluationStep>& steps);

/*
 * applyOperation()
 * Applies a binary operation on two operands.
 * Supported operators: + - * / % ^
 * Throws std::runtime_error on division/modulo by zero.
 */
double applyOperation(double a, double b, const std::string& op);

/*
 * calculateExpression()
 * Main entry point. Accepts an infix expression string.
 * Validates → Converts → Evaluates → Returns CalculatorResult.
 */
CalculatorResult calculateExpression(const std::string& expression);

#endif // STACK_ALGORITHM_H
