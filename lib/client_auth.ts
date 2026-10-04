/**
 * Client-Side Authentication & Session Helper
 *
 * Coordinates client-side session storage, local cache invalidation,
 * and reliable sign-in/sign-out state synchronization across components.
 *
 * Author: IboTV (ibochivincent-lang)
 */

export const AUTH_CHANGED_EVENT = "careerace_auth_changed";

export function getClientSessionAddress(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("careerace_session_address");
}

export function setClientSession(address: string, username?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("careerace_session_address", address);
  if (username && username.trim()) {
    localStorage.setItem("careerace_candidate_name", username.trim());
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { address, username } }));
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("careerace_session_address");
  localStorage.removeItem("careerace_candidate_name");
  localStorage.removeItem("careerace_suins_domain");
  localStorage.removeItem("careerace_sovereign_profile");
  localStorage.removeItem("careerace_parsed_profile");
  localStorage.removeItem("careerace_target_title");
  try {
    sessionStorage.clear();
  } catch {}
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { address: null } }));
}

export async function signOutClient(redirectTo: string = "/signin"): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.warn("[auth] Server logout notice:", err);
  } finally {
    clearClientSession();
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }
}
