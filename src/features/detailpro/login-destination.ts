export function loginDestination(roles: readonly string[]) {
  return roles.includes("financeiro") || roles.includes("funcionario")
    ? "/financeiro"
    : "booking";
}