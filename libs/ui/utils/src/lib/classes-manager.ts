import { isPlatformBrowser } from '@angular/common';
import { type ClassValue, clsx } from 'clsx';
import { hlm } from './hlm';

export const elementClassManagers = new WeakMap<
  HTMLElement,
  ElementClassManager
>();
export let globalObserver: MutationObserver | null = null;
export const observedElements = new Set<HTMLElement>();

export interface ElementClassManager {
  element: HTMLElement;
  sources: Map<number, { classes: Set<string>; order: number }>;
  baseClasses: Set<string>;
  isUpdating: boolean;
  nextOrder: number;
  hasInitialized: boolean;
  restoreRafId: number | null;
  transitionsSuppressed: boolean;
  previousTransition: string;
  previousTransitionPriority: string;
}

export function restoreTransitionSuppression(
  manager: ElementClassManager,
): void {
  const prev = manager.previousTransition;
  if (prev) {
    manager.element.style.setProperty(
      'transition',
      prev,
      manager.previousTransitionPriority || undefined,
    );
  } else {
    manager.element.style.removeProperty('transition');
  }
}

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export function setupGlobalObserver(platformId: Object): void {
  if (isPlatformBrowser(platformId) && !globalObserver) {
    // Create single global observer that watches the entire document
    globalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const element = mutation.target as HTMLElement;
          const manager = elementClassManagers.get(element);

          // Only process elements we're managing
          if (manager && observedElements.has(element)) {
            if (manager.isUpdating) continue; // Ignore changes we're making

            // Update base classes to include any externally added classes
            const currentClasses = toClassList(element.className);
            const allSourceClasses = new Set<string>();

            // Collect all classes from all sources
            for (const source of manager.sources.values()) {
              for (const className of source.classes) {
                allSourceClasses.add(className);
              }
            }

            // Any classes not from sources become new base classes
            manager.baseClasses.clear();

            for (const className of currentClasses) {
              if (!allSourceClasses.has(className)) {
                manager.baseClasses.add(className);
              }
            }

            updateElement(manager);
          }
        }
      }
    });

    // Start observing the entire document for class attribute changes
    globalObserver.observe(document, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true, // Watch all descendants
    });
  }
}

export function updateElement(manager: ElementClassManager): void {
  if (manager.isUpdating) return; // Prevent recursive updates

  manager.isUpdating = true;

  // Handle initialization: capture base classes after first source registration
  if (!manager.hasInitialized && manager.sources.size > 0) {
    // Get current classes on element (may include SSR classes)
    const currentClasses = toClassList(manager.element.className);

    // Get all classes that will be applied by sources
    const allSourceClasses = new Set<string>();
    for (const source of manager.sources.values()) {
      source.classes.forEach((className) => allSourceClasses.add(className));
    }

    // Only consider classes as "base" if they're not produced by any source
    // This prevents SSR-rendered classes from being preserved as base classes
    currentClasses.forEach((className) => {
      if (!allSourceClasses.has(className)) {
        manager.baseClasses.add(className);
      }
    });

    manager.hasInitialized = true;
  }

  // Get classes from all sources, sorted by registration order (later takes precedence)
  const sortedSources = Array.from(manager.sources.entries()).sort(
    ([, a], [, b]) => a.order - b.order,
  );

  const allSourceClasses: string[] = [];
  for (const [, source] of sortedSources) {
    allSourceClasses.push(...source.classes);
  }

  // Combine base classes with all source classes, ensuring base classes take precedence
  const classesToApply =
    allSourceClasses.length > 0 || manager.baseClasses.size > 0
      ? hlm([...allSourceClasses, ...manager.baseClasses])
      : '';

  // Apply the classes to the element
  if (manager.element.className !== classesToApply) {
    manager.element.className = classesToApply;
  }

  manager.isUpdating = false;
}

export function cleanupManager(element: HTMLElement): void {
  // Remove from global tracking
  observedElements.delete(element);
  elementClassManagers.delete(element);

  // If no more elements being tracked, cleanup global observer
  if (observedElements.size === 0 && globalObserver) {
    globalObserver.disconnect();
    globalObserver = null;
  }
}

// Cache for parsed class lists to avoid repeated string operations
const classListCache = new Map<string, string[]>();

export function toClassList(className: string | ClassValue[]): string[] {
  // For simple string inputs, use cache to avoid repeated parsing
  if (typeof className === 'string' && classListCache.has(className)) {
    const cached = classListCache.get(className);
    if (cached) {
      return cached;
    }
  }

  const result = clsx(className)
    .split(' ')
    .filter((c) => c.length > 0);

  // Cache string results, but limit cache size to prevent memory growth
  if (typeof className === 'string' && classListCache.size < 1000) {
    classListCache.set(className, result);
  }

  return result;
}
