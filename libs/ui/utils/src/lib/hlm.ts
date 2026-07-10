import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  PLATFORM_ID,
  runInInjectionContext,
} from '@angular/core';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  cleanupManager,
  elementClassManagers,
  observedElements,
  restoreTransitionSuppression,
  setupGlobalObserver,
  toClassList,
  updateElement,
} from './classes-manager';

export function hlm(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let sourceCounter = 0;

export interface ClassesOptions {
  elementRef?: ElementRef<HTMLElement>;
  injector?: Injector;
}

/**
 * This function dynamically adds and removes classes for a given element without requiring
 * the a class binding (e.g. `[class]="..."`) which may interfere with other class bindings.
 *
 * 1. This will merge the existing classes on the element with the new classes.
 * 2. It will also remove any classes that were previously added by this function but are no longer present in the new classes.
 * 3. Multiple calls to this function on the same element will be merged efficiently.
 */
export function classes(
  computed: () => ClassValue[] | string,
  options: ClassesOptions = {},
) {
  runInInjectionContext(options.injector ?? inject(Injector), () => {
    const elementRef = options.elementRef ?? inject(ElementRef);
    const platformId = inject(PLATFORM_ID);
    const destroyRef = inject(DestroyRef);
    const baseClasses = inject(new HostAttributeToken('class'), {
      optional: true,
    });

    const element = elementRef.nativeElement;

    // Create unique identifier for this source
    const sourceId = sourceCounter++;

    // Get or create the class manager for this element
    let manager = elementClassManagers.get(element);

    if (!manager) {
      // Initialize base classes from variation (host attribute 'class')
      const initialBaseClasses = new Set<string>();

      if (baseClasses) {
        toClassList(baseClasses).forEach((cls) => initialBaseClasses.add(cls));
      }

      manager = {
        element,
        sources: new Map(),
        baseClasses: initialBaseClasses,
        isUpdating: false,
        nextOrder: 0,
        hasInitialized: false,
        restoreRafId: null,
        transitionsSuppressed: false,
        previousTransition: '',
        previousTransitionPriority: '',
      };
      elementClassManagers.set(element, manager);

      // Setup global observer if needed and register this element
      setupGlobalObserver(platformId);
      observedElements.add(element);

      // Suppress transitions until the first effect writes correct classes and
      // the browser has painted them. This prevents CSS transition animations
      // during hydration when classes change from SSR state to client state.
      if (isPlatformBrowser(platformId)) {
        manager.previousTransition =
          element.style.getPropertyValue('transition');
        manager.previousTransitionPriority =
          element.style.getPropertyPriority('transition');
        element.style.setProperty('transition', 'none', 'important');
        manager.transitionsSuppressed = true;
      }
    }

    // Assign order once at registration time
    const sourceOrder = manager.nextOrder++;

    function updateClasses(): void {
      // Get the new classes from the computed function
      const newClasses = toClassList(computed());

      if (!manager) return;

      // Update this source's classes, keeping the original order
      manager.sources.set(sourceId, {
        classes: new Set(newClasses),
        order: sourceOrder,
      });

      // Update the element
      updateElement(manager);

      // Re-enable transitions after the first effect writes correct classes.
      // Deferred to next animation frame so the browser paints the class change
      // with transitions disabled first, then re-enables them.
      if (manager.transitionsSuppressed) {
        manager.transitionsSuppressed = false;
        manager.restoreRafId = requestAnimationFrame(() => {
          if (!manager) return;
          manager.restoreRafId = null;
          restoreTransitionSuppression(manager);
        });
      }
    }

    // Register cleanup with DestroyRef
    destroyRef.onDestroy(() => {
      if (!manager) return;
      if (manager.restoreRafId !== null) {
        cancelAnimationFrame(manager.restoreRafId);
        manager.restoreRafId = null;
      }

      if (manager.transitionsSuppressed) {
        manager.transitionsSuppressed = false;
        restoreTransitionSuppression(manager);
      }

      // Remove this source from the manager
      manager.sources.delete(sourceId);

      // If no more sources, clean up the manager
      if (manager.sources.size === 0) {
        cleanupManager(element);
      } else {
        // Update element without this source's classes
        updateElement(manager);
      }
    });

    /**
     * We need this effect to track changes to the computed classes. Ideally, we would use
     * afterRenderEffect here, but that doesn't run in SSR contexts, so we use a standard
     * effect which works in both browser and SSR.
     */
    effect(updateClasses);
  });
}
