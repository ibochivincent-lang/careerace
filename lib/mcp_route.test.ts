import test from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../app/api/mcp/route.ts";

test("Remote MCP Server: GET discovery endpoint returns metadata and tool manifest", async () => {
  const res = await GET();
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.protocol, "model-context-protocol / json-rpc-2.0");
  assert.ok(data.toolsCount >= 10);
  assert.ok(Array.isArray(data.tools));
  assert.ok(data.tools.some((t: any) => t.name === "recall_memory"));
  assert.ok(data.tools.some((t: any) => t.name === "evaluate_job_tool"));
  assert.ok(data.tools.some((t: any) => t.name === "tailor_cv_tool"));
});

test("Remote MCP Server: POST initialize negotiates standard protocol handshake", async () => {
  const req = new Request("https://careerace.online/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.jsonrpc, "2.0");
  assert.strictEqual(data.id, 1);
  assert.strictEqual(data.result.protocolVersion, "2024-11-05");
  assert.strictEqual(data.result.serverInfo.name, "careerace-remote");
});

test("Remote MCP Server: POST tools/list returns complete tool list with schemas", async () => {
  const req = new Request("https://careerace.online/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.id, 2);
  assert.ok(Array.isArray(data.result.tools));
  const toolNames = data.result.tools.map((t: any) => t.name);
  assert.ok(toolNames.includes("recall_memory"));
  assert.ok(toolNames.includes("remember_fact"));
  assert.ok(toolNames.includes("harvest_jobs_tool"));
  assert.ok(toolNames.includes("evaluate_job_tool"));
  assert.ok(toolNames.includes("tailor_cv_tool"));
});

test("Remote MCP Server: POST tools/call evaluate_job_tool computes match and ATS diagnostic", async () => {
  const sampleCv = `
Candidate Name: Alex Rivers
Title: Autonomous Systems & ML Engineer
Skills: PyTorch, vLLM, TensorRT, Distributed Training, LoRA, Python, CUDA
Experience:
Senior ML Engineer at Robotics Lab (2022 - 2025): Optimized LLM inference latency by 45% using TensorRT.
`;

  const req = new Request("https://careerace.online/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "evaluate_job_tool",
        arguments: {
          job_title: "Staff Machine Learning Engineer",
          job_company: "Apex Autonomous Systems",
          job_description: "We are seeking a Staff ML Engineer experienced in PyTorch, TensorRT inference optimization, and distributed training systems.",
          cv_text: sampleCv,
        },
      },
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.id, 3);
  assert.ok(Array.isArray(data.result.content));
  const textOutput = data.result.content[0].text;
  assert.ok(textOutput.includes("Fit Score:"));
  assert.ok(textOutput.includes("Recommendation:"));
  assert.ok(textOutput.includes("ATS REVERSE-ENGINEERING DIAGNOSTIC"));
});

test("Remote MCP Server: POST tools/call export_json_resume_tool compiles valid JSON Resume", async () => {
  const sampleCv = `
Candidate Name: Morgan Hayes
Title: Lead Marine Engineer
Skills: STCW II/2, Marine Propulsion, High Voltage Safety
Experience:
Chief Engineer at Maritime Express (2020 - 2024): Managed 10,000 HP diesel electric systems with zero downtime.
`;

  const req = new Request("https://careerace.online/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "export_json_resume_tool",
        arguments: {
          cv_text: sampleCv,
          custom_summary: "Experienced Chief Marine Engineer certified under STCW II/2.",
        },
      },
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.id, 4);
  const parsedResume = JSON.parse(data.result.content[0].text);
  assert.ok(parsedResume.basics);
  assert.strictEqual(parsedResume.basics.name, "Morgan Hayes");
  assert.ok(Array.isArray(parsedResume.skills));
});

test("Remote MCP Server: handles invalid JSON-RPC method cleanly", async () => {
  const req = new Request("https://careerace.online/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 99,
      method: "unknown_method",
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 404);

  const data = await res.json();
  assert.strictEqual(data.error.code, -32601);
});
