function getCleanPath(urlString: string): string {
  try {
    const pathname = urlString.startsWith('http')
      ? new URL(urlString).pathname
      : new URL(urlString, 'http://aleromano.com').pathname;

    const unlocalizedPath = pathname.replace(/^\/?(en|it)\//g, '/');

    if (unlocalizedPath === '/') {
      return '/';
    }

    const withoutTrailingSlash = unlocalizedPath.charAt(unlocalizedPath.length - 1) === '/' ? unlocalizedPath.slice(0, -1) : unlocalizedPath;

    return withoutTrailingSlash;
  } catch {
    return '';
  }
}

export function isNavigationItemActive(currentUrl: string, targetPath: string): boolean {
  const currentPath = getCleanPath(currentUrl);
  const targetCleanPath = getCleanPath(targetPath);

  if (targetCleanPath === '/') {
    return currentPath === '/';
  }

  if (targetCleanPath === '/blog') {
    return currentPath === '/blog' || currentPath.includes('posts/');
  }

  return currentPath === targetCleanPath;
} 