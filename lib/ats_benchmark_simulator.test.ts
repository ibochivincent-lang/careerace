import { describe, it } from "node:test";
import assert from "node:assert";
import { runAtsBenchmarkSimulator } from "./ats_benchmark_simulator.ts";

describe("Automated Live ATS Benchmark Simulator", () => {
  const candidateProfile = {
    applicant_name: "Vincent Lang",
    email: "vincent.lang@example.com",
    phone: "+1-555-0199",
    location: "San Francisco, CA",
    target_roles: ["Staff Distributed Systems Engineer"],
    skills: ["TypeScript", "Rust", "Distributed Systems", "Kubernetes", "PostgreSQL", "Docker", "Sui"],
    work_experience: [
      {
        role: "Senior Systems Engineer",
        company: "Apex Telemetry Corp",
        duration: "2022 - Present",
        highlights: [
          "Architected high-throughput telemetry ingestion pipeline using Rust and Kafka, reducing latency by 45%.",
          "Scaled Kubernetes cluster workloads across multi-region cloud infrastructure.",
        ],
      },
      {
        role: "Software Engineer",
        company: "DataStream Labs",
        duration: "2019 - 2022",
        highlights: [
          "Developed backend microservices in TypeScript and Node.js with PostgreSQL persistence.",
        ],
      },
    ],
    academic_history: [
      {
        degree: "B.S. in Computer Science",
        institution: "University of California, Berkeley",
        graduation_year: "2019",
      },
    ],
  };

  const targetJd = `
    Staff Systems Engineer needed at CloudScale Systems.
    Responsibilities:
    - Build and scale distributed telemetry systems and cloud infrastructure.
    - Leverage Kubernetes, Rust, and TypeScript for high-availability production workloads.
    - Manage PostgreSQL databases and containerized deployments using Docker and CI/CD pipelines.
    - Deep experience in Kubernetes and Rust required.
  `;

  it("should parse candidate against target JD and generate Taleo and Greenhouse metrics", () => {
    const report = runAtsBenchmarkSimulator({
      profile: candidateProfile,
      jobTitle: "Staff Systems Engineer",
      jobCompany: "CloudScale Systems",
      jobDescription: targetJd,
    });

    assert.ok(report.overallReadiness >= 70, `Readiness should be high, got ${report.overallReadiness}`);
    assert.strictEqual(report.targetRole, "Staff Systems Engineer");
    assert.strictEqual(report.targetCompany, "CloudScale Systems");

    // Taleo checks
    assert.strictEqual(report.taleo.engineName, "Oracle Taleo Enterprise Edition");
    assert.ok(report.taleo.score >= 70, `Taleo score should be >= 70, got ${report.taleo.score}`);
    assert.strictEqual(report.taleo.contactExtraction.emailDetected, true);
    assert.strictEqual(report.taleo.contactExtraction.phoneDetected, true);
    assert.ok(report.taleo.rawParsedStream.includes("TALEO_"));

    // Greenhouse checks
    assert.strictEqual(report.greenhouse.engineName, "Greenhouse Recruiting / Modern Semantic ATS");
    assert.ok(report.greenhouse.score >= 70, `Greenhouse score should be >= 70, got ${report.greenhouse.score}`);
    assert.ok(
      report.greenhouse.candidateRankTier === "Top 5% Priority Pool" ||
      report.greenhouse.candidateRankTier === "Top 15% Interview Pool"
    );
    assert.ok(report.greenhouse.structuredJsonGraph.candidate.name === "Vincent Lang");

    // Heatmap checks
    assert.ok(report.heatmap.length > 0, "Heatmap items should be extracted");
    const rustItem = report.heatmap.find((h) => h.keyword === "rust");
    assert.ok(rustItem, "Rust should be in keyword heatmap");
    assert.strictEqual(rustItem.taleo_match, true);
    assert.strictEqual(rustItem.greenhouse_match, true);
  });

  it("should identify missing critical hard skills when CV lacks key requirement", () => {
    const targetJdWithPython = `
      AI Platform Engineer required with extensive PyTorch, TensorFlow, and Python experience.
      Must have machine learning pipeline deployment skills.
    `;

    const report = runAtsBenchmarkSimulator({
      profile: candidateProfile,
      jobTitle: "AI Platform Engineer",
      jobCompany: "NeuralScale",
      jobDescription: targetJdWithPython,
    });

    assert.ok(report.criticalMissingKeywords.length > 0, "Should detect missing critical skills");
    assert.ok(
      report.criticalMissingKeywords.includes("python") ||
      report.criticalMissingKeywords.includes("pytorch") ||
      report.criticalMissingKeywords.includes("machine learning")
    );
    assert.ok(report.actionableFixes.length > 0, "Should generate actionable fixes");
  });
});
