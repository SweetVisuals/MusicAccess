/**
 * Debug utilities for development logging
 */

interface DebugOptions {
  componentName?: string;
  enabled?: boolean;
}

export function debugLog(message: string, options: DebugOptions = {}) {
  if (process.env.NODE_ENV === 'development' && options.enabled !== false) {
    const prefix = options.componentName ? `[${options.componentName}]` : '[Debug]';
    console.log(`${prefix} ${message}`);
  }
}
