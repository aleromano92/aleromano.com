import { describe, it, expect } from 'vitest';
import { isNavigationItemActive } from './navigation';

describe('isNavigationItemActive', () => {
  // Basic path matching
  it('should match exact paths', () => {
    expect(isNavigationItemActive('/blog', '/blog')).toBe(true);
    expect(isNavigationItemActive('/about', '/blog')).toBe(false);
  });

  // Home page special case
  it('should handle home page correctly', () => {
    // Basic cases
    expect(isNavigationItemActive('/', '/blog')).toBe(false);
    expect(isNavigationItemActive('/contact', '/contact')).toBe(true);
    expect(isNavigationItemActive('/contact', '/about')).toBe(false);

    // With domains
    expect(isNavigationItemActive('http://localhost:4321', '/')).toBe(true);
    expect(isNavigationItemActive('http://188.245.236.17:4321', '/')).toBe(true);
    
    // With query params and hash
    expect(isNavigationItemActive('/?foo=bar', '/')).toBe(true);
    expect(isNavigationItemActive('/#top', '/')).toBe(true);
  });

  // Language prefixes
  it('should handle language prefixes', () => {
    expect(isNavigationItemActive('/it/blog', '/blog')).toBe(true);
    expect(isNavigationItemActive('/en/blog', '/blog')).toBe(true);
    expect(isNavigationItemActive('/it/about', '/blog')).toBe(false);
  });

  // Blog posts special case
  it('should handle blog posts URLs', () => {
    // Regular blog posts
    expect(isNavigationItemActive('/posts/some-post', '/blog')).toBe(true);
    expect(isNavigationItemActive('/posts/emotional-component-software-release', '/blog')).toBe(true);
    
    // With language prefix
    expect(isNavigationItemActive('/it/posts/some-post', '/blog')).toBe(true);
    expect(isNavigationItemActive('/en/posts/some-post', '/blog')).toBe(true);
    
    // With domain
    expect(isNavigationItemActive('http://localhost:4321/posts/some-post', '/blog')).toBe(true);
    expect(isNavigationItemActive('http://188.245.236.17:4321/posts/some-post', '/blog')).toBe(true);
    
    // Complex combinations
    expect(isNavigationItemActive('/it/posts/some-post?page=1#comments', '/blog')).toBe(true);
  });

  // Trailing slashes
  it('should handle trailing slashes', () => {
    expect(isNavigationItemActive('/blog/', '/blog')).toBe(true);
  });

  // Query parameters
  it('should ignore query parameters', () => {
    expect(isNavigationItemActive('/blog?page=1', '/blog')).toBe(true);
    expect(isNavigationItemActive('/blog?category=tech', '/blog')).toBe(true);
  });

  // Hash fragments
  it('should ignore hash fragments', () => {
    expect(isNavigationItemActive('/blog#top', '/blog')).toBe(true);
    expect(isNavigationItemActive('/blog#section-1', '/blog')).toBe(true);
  });

  // Complex combinations
  it('should handle complex URL combinations', () => {
    expect(isNavigationItemActive('/it/blog/?page=1#section', '/blog')).toBe(true);
    expect(isNavigationItemActive('http://188.245.236.17:4321/it/blog/#section', '/blog')).toBe(true);
  });

  // Error cases
  it('should handle invalid URLs gracefully', () => {
    expect(isNavigationItemActive('invalid-url', '/blog')).toBe(false);
    expect(isNavigationItemActive('http://', '/blog')).toBe(false);
  });
}); 