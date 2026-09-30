import "server-only";

/**
 * Next-facing view of the memory contract. The implementation lives in
 * ./memory-core so the MCP server can share it verbatim; this module only adds
 * the `server-only` guard so a client component importing it fails the build.
 */
export * from "./memory-core.ts";
