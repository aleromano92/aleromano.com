/**
 * MSW Server Setup for Node.js (Server-Side)
 * 
 * This sets up the MSW server for:
 * - Vitest tests
 * - Astro SSR during development
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
