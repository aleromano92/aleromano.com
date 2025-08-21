/**
 * Gets the clean path from a URL or path string, removing:
 * - Leading/trailing slashes
 * - Language prefix (if any)
 * - Query parameters (via URL.pathname)
 * - Hash fragments (via URL.pathname)
 */
function getCleanPath(urlString: string): string {
  try {
    // Handle full URLs and path-only URLs
    const pathname = urlString.startsWith('http')
      ? new URL(urlString).pathname
      : new URL(urlString, 'http://aleromano.com').pathname;

    const unlocalizedPath = pathname.replace(/^\/?(en|it)\//g, '/');

    // Special case for home page
    if (unlocalizedPath === '/') {
      return '/';
    }

    const withoutTrailingSlash = unlocalizedPath.charAt(unlocalizedPath.length - 1) === '/' ? unlocalizedPath.slice(0, -1) : unlocalizedPath;

    return withoutTrailingSlash;
  } catch {
    return '';
  }
}

/**
 * Determines if a navigation item should be active based on the current URL
 */
export function isNavigationItemActive(currentUrl: string, targetPath: string): boolean {
  const currentPath = getCleanPath(currentUrl);
  const targetCleanPath = getCleanPath(targetPath);

  // Home page
  if (targetCleanPath === '/') {
    return currentPath === '/';
  }

  // Blog section (including posts)
  if (targetCleanPath === '/blog') {
    return currentPath === '/blog' || currentPath.includes('posts/');
  }

  return currentPath === targetCleanPath;
} 