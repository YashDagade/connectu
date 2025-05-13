/**
 * Environment utilities
 */

/**
 * Determine if code is running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Determine if code is running on the client
 */
export const isClient = !isServer;

/**
 * Ensure a function is only called on the server
 * @throws Error if called on the client
 */
export function ensureServer(functionName: string): void {
  if (!isServer) {
    throw new Error(`${functionName} can only be called on the server`);
  }
}

/**
 * Ensure a function is only called on the client
 * @throws Error if called on the server
 */
export function ensureClient(functionName: string): void {
  if (!isClient) {
    throw new Error(`${functionName} can only be called on the client`);
  }
} 