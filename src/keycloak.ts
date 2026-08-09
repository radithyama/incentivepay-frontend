import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "incentivepay",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "incentivepay-client",
});

export function currentRoles(): string[] {
  const access = keycloak.tokenParsed?.realm_access as { roles?: string[] } | undefined;
  return access?.roles ?? [];
}

export function hasRole(role: string): boolean {
  return currentRoles().includes(role);
}

export function currentUsername(): string {
  return (keycloak.tokenParsed?.preferred_username as string | undefined) ?? "unknown";
}
