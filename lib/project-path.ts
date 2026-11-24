/** /profile/<username>/projects/<slug> */
export function projectPath(username: string, projectSlug: string) {
  return `/profile/${username}/projects/${projectSlug}`;
}
