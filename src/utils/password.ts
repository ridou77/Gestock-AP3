export const PASSWORD_HINT =
  "8 caractères minimum, avec 1 majuscule, 1 minuscule et 1 chiffre.";

export function getPasswordError(password: string): string | null {
  const value = password.trim();
  if (value.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!/[A-Z]/.test(value)) {
    return "Le mot de passe doit contenir au moins une majuscule.";
  }
  if (!/[a-z]/.test(value)) {
    return "Le mot de passe doit contenir au moins une minuscule.";
  }
  if (!/[0-9]/.test(value)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return null;
}
