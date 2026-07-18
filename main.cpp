/*
 * ============================================================
 *  main.cpp
 *  Expression Calculator Using Stack - Main Driver
 * ============================================================
 *
 *  This file provides the console interface for the C++ backend.
 *  It also serves as the compilation test entry point.
 *
 *  Usage:
 *    ./main "((12+4)*5)-(8/2)"
 *    ./main                     (interactive mode)
 *
 *  Compile:
 *    g++ -std=c++17 -o main main.cpp stack_algorithm.cpp -lm
 *
 * ============================================================
 */

#include "stack_algorithm.h"
#include <iostream>
#include <iomanip>
#include <string>

// ============================================================
//  printDivider()
//  Prints a styled separator line to the console.
// ============================================================
void printDivider(char ch = '=', int width = 60) {
    std::cout << std::string(width, ch) << "\n";
}

// ============================================================
//  printConversionSteps()
//  Displays the Infix → Postfix conversion steps in a table.
// ============================================================
void printConversionSteps(const std::vector<ConversionStep>& steps) {
    printDivider();
    std::cout << "  INFIX → POSTFIX CONVERSION STEPS\n";
    printDivider();
    std::cout << std::left
              << std::setw(8)  << "Step"
              << std::setw(10) << "Token"
              << std::setw(25) << "Stack State"
              << "Postfix So Far\n";
    printDivider('-');

    for (size_t i = 0; i < steps.size(); i++) {
        const auto& s = steps[i];
        std::cout << std::left
                  << std::setw(8)  << (i + 1)
                  << std::setw(10) << s.token
                  << std::setw(25) << s.stackState
                  << s.postfixSoFar << "\n";
        std::cout << "  Action: " << s.action << "\n";
        printDivider('-', 40);
    }
}

// ============================================================
//  printEvaluationSteps()
//  Displays the Postfix evaluation steps.
// ============================================================
void printEvaluationSteps(const std::vector<EvaluationStep>& steps) {
    printDivider();
    std::cout << "  POSTFIX EVALUATION STEPS\n";
    printDivider();
    std::cout << std::left
              << std::setw(8)  << "Step"
              << std::setw(12) << "Token"
              << std::setw(20) << "Stack State"
              << "Action\n";
    printDivider('-');

    for (size_t i = 0; i < steps.size(); i++) {
        const auto& s = steps[i];
        std::cout << std::left
                  << std::setw(8)  << (i + 1)
                  << std::setw(12) << s.token
                  << std::setw(20) << s.stackState
                  << s.action << "\n";
        printDivider('-', 40);
    }
}

// ============================================================
//  runCalculator()
//  Orchestrates the complete calculation and prints output.
// ============================================================
void runCalculator(const std::string& expr) {
    printDivider('*');
    std::cout << "  EXPRESSION CALCULATOR USING STACK\n";
    std::cout << "  DSA Project | C++ STL Stack Implementation\n";
    printDivider('*');
    std::cout << "\n  Original Expression : " << expr << "\n\n";

    CalculatorResult res = calculateExpression(expr);

    if (!res.success) {
        printDivider('!');
        std::cout << "  " << res.errorMessage << "\n";
        printDivider('!');
        return;
    }

    // Print Postfix
    std::cout << "  Postfix Expression  : " << res.postfixExpression << "\n\n";

    // Print conversion steps
    printConversionSteps(res.conversionSteps);

    std::cout << "\n";

    // Print evaluation steps
    printEvaluationSteps(res.evaluationSteps);

    // Print final result
    printDivider('=');
    std::cout << "  FINAL RESULT: " << expr << " = ";
    if (res.finalResult == (long long)res.finalResult) {
        std::cout << (long long)res.finalResult;
    } else {
        std::cout << std::fixed << std::setprecision(6) << res.finalResult;
    }
    std::cout << "\n";
    printDivider('=');
}

// ============================================================
//  main()
//  Entry point. Accepts expression as command-line argument
//  or prompts user interactively.
// ============================================================
int main(int argc, char* argv[]) {
    if (argc > 1) {
        // Command-line mode: ./main "3+5*2"
        std::string expr(argv[1]);
        runCalculator(expr);
    } else {
        // Interactive mode
        std::cout << "\n  ====================================\n";
        std::cout << "  Expression Calculator Using Stack\n";
        std::cout << "  ====================================\n";
        std::cout << "  Supported operators: + - * / % ^\n";
        std::cout << "  Type 'quit' to exit.\n\n";

        while (true) {
            std::cout << "  Enter infix expression: ";
            std::string expr;
            std::getline(std::cin, expr);

            if (expr == "quit" || expr == "exit") {
                std::cout << "  Goodbye!\n";
                break;
            }

            if (!expr.empty()) {
                runCalculator(expr);
            }
            std::cout << "\n";
        }
    }
    return 0;
}
