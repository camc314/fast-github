export function getGitHubToken(): string | null {
  return localStorage.getItem("github-token");
}

export function setGitHubToken(token: string): void {
  localStorage.setItem("github-token", token);
}

export function clearGitHubToken(): void {
  localStorage.removeItem("github-token");
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function hasValidToken(): boolean {
  const token = getGitHubToken();
  return token !== null && token.trim().length > 0;
}
