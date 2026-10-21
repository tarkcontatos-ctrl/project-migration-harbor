export function loginDestination(roles: readonly string[]) {
  if (roles.includes("financeiro")) return "/financeiro";
  return roles.includes("funcionario") ? "/funcionarios" : "booking";
}