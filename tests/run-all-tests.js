#!/usr/bin/env node

/**
 * Comprehensive Test Runner for MediPort Hub
 * Runs all test categories and generates detailed reports
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🏥 MediPort Hub - Comprehensive Testing Suite");
console.log("=============================================\n");

const testResults = {
  unit: { passed: 0, failed: 0, total: 0, time: 0 },
  integration: { passed: 0, failed: 0, total: 0, time: 0 },
  performance: { passed: 0, failed: 0, total: 0, time: 0 },
  regression: { passed: 0, failed: 0, total: 0, time: 0 },
  acceptance: { passed: 0, failed: 0, total: 0, time: 0 },
  overall: { passed: 0, failed: 0, total: 0, time: 0 },
};

const testCategories = [
  { name: "Unit Tests", script: "test:unit", key: "unit" },
  { name: "Integration Tests", script: "test:integration", key: "integration" },
  { name: "Performance Tests", script: "test:performance", key: "performance" },
  { name: "Regression Tests", script: "test:regression", key: "regression" },
  { name: "Acceptance Tests", script: "test:acceptance", key: "acceptance" },
];

async function runTestCategory(category) {
  console.log(`🧪 Running ${category.name}...`);

  try {
    const startTime = Date.now();

    // Run the test command
    const result = execSync(
      `npm run ${category.script} -- --verbose --no-coverage`,
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Parse test results from output
    const passedMatch = result.match(/(\d+) passing/);
    const failedMatch = result.match(/(\d+) failing/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = passed + failed;

    testResults[category.key] = { passed, failed, total, time: duration };
    testResults.overall.passed += passed;
    testResults.overall.failed += failed;
    testResults.overall.total += total;
    testResults.overall.time += duration;

    console.log(
      `✅ ${category.name} completed: ${passed} passed, ${failed} failed (${duration}ms)\n`
    );

    return { success: failed === 0, output: result };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - Date.now();

    // Parse error output for test results
    const output = error.stdout || error.stderr || "";
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = passed + failed;

    testResults[category.key] = { passed, failed, total, time: duration };
    testResults.overall.passed += passed;
    testResults.overall.failed += failed;
    testResults.overall.total += total;
    testResults.overall.time += duration;

    console.log(
      `❌ ${category.name} completed with errors: ${passed} passed, ${failed} failed (${duration}ms)\n`
    );

    return { success: false, output, error: error.message };
  }
}

async function runAllTests() {
  console.log("🚀 Starting comprehensive test execution...\n");

  const startTime = Date.now();

  for (const category of testCategories) {
    await runTestCategory(category);
  }

  const totalTime = Date.now() - startTime;

  // Generate comprehensive report
  generateTestReport(totalTime);

  // Generate coverage report
  console.log("📊 Generating coverage report...");
  try {
    execSync("npm run test:coverage", { stdio: "inherit" });
  } catch (error) {
    console.log("⚠️  Coverage report generation failed");
  }
}

function generateTestReport(totalTime) {
  console.log("\n📋 COMPREHENSIVE TEST RESULTS");
  console.log("==============================\n");

  // Category breakdown
  testCategories.forEach((category) => {
    const result = testResults[category.key];
    const successRate =
      result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0;
    const status = result.failed === 0 ? "✅ PASSED" : "❌ FAILED";

    console.log(`${category.name}:`);
    console.log(`  Status: ${status}`);
    console.log(`  Passed: ${result.passed}/${result.total} (${successRate}%)`);
    console.log(`  Duration: ${result.time}ms`);
    console.log("");
  });

  // Overall summary
  const overallSuccessRate =
    testResults.overall.total > 0
      ? (
          (testResults.overall.passed / testResults.overall.total) *
          100
        ).toFixed(1)
      : 0;

  console.log("📊 OVERALL SUMMARY");
  console.log("==================");
  console.log(`Total Tests: ${testResults.overall.total}`);
  console.log(`Passed: ${testResults.overall.passed}`);
  console.log(`Failed: ${testResults.overall.failed}`);
  console.log(`Success Rate: ${overallSuccessRate}%`);
  console.log(`Total Duration: ${totalTime}ms`);
  console.log(
    `Average per Test: ${
      testResults.overall.total > 0
        ? (totalTime / testResults.overall.total).toFixed(2)
        : 0
    }ms`
  );

  // Quality gates
  console.log("\n🎯 QUALITY GATES");
  console.log("================");

  const qualityGates = [
    {
      name: "Test Coverage",
      condition: testResults.overall.total >= 50,
      target: "50+ tests",
    },
    {
      name: "Success Rate",
      condition: overallSuccessRate >= 80,
      target: "80%+",
    },
    {
      name: "Performance",
      condition: testResults.overall.time < 30000,
      target: "<30s total",
    },
  ];

  qualityGates.forEach((gate) => {
    const status = gate.condition ? "✅ PASSED" : "❌ FAILED";
    console.log(`${gate.name}: ${status} (Target: ${gate.target})`);
  });

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("===================");

  if (testResults.overall.failed > 0) {
    console.log("• Investigate and fix failing tests");
  }

  if (overallSuccessRate < 90) {
    console.log("• Improve test reliability and fix flaky tests");
  }

  if (testResults.overall.total < 100) {
    console.log("• Increase test coverage for better quality assurance");
  }

  if (testResults.overall.time > 60000) {
    console.log("• Optimize test performance and reduce execution time");
  }

  // Final status
  const allPassed = testResults.overall.failed === 0;
  console.log(
    `\n🎉 FINAL STATUS: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`
  );

  if (!allPassed) {
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});

