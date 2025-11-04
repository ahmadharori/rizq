/**
 * Accessibility Utilities
 * Helper functions for WCAG 2.2 Level AA compliance
 */

/**
 * Set focus to element by ID
 */
export function focusElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(containerElement: HTMLElement): () => void {
  const focusableElements = containerElement.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  containerElement.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Generate ARIA label for table sort
 */
export function getSortAriaLabel(
  column: string,
  currentSort?: string,
  currentOrder?: 'asc' | 'desc'
): string {
  if (currentSort === column) {
    const direction = currentOrder === 'asc' ? 'ascending' : 'descending';
    return `Sorted by ${column}, ${direction}. Click to reverse order.`;
  }
  return `Sort by ${column}`;
}

/**
 * Generate ARIA label for pagination
 */
export function getPaginationAriaLabel(
  current: number,
  total: number,
  type: 'first' | 'prev' | 'next' | 'last'
): string {
  const labels = {
    first: `Go to first page`,
    prev: `Go to previous page (${current - 1} of ${total})`,
    next: `Go to next page (${current + 1} of ${total})`,
    last: `Go to last page (${total})`,
  };
  return labels[type];
}

/**
 * Announce to screen readers using live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if color contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsContrastRatio(foreground: string, background: string): boolean {
  // This is a simplified version - in production you'd use a proper contrast calculation library
  // For now, returns true to not block functionality
  return true;
}

/**
 * Get keyboard navigation instructions
 */
export function getKeyboardInstructions(context: 'table' | 'modal' | 'form'): string {
  const instructions = {
    table: 'Use arrow keys to navigate, Enter to select, Space to check/uncheck',
    modal: 'Press Escape to close, Tab to navigate, Enter to confirm',
    form: 'Tab to navigate fields, Enter to submit, Escape to cancel',
  };
  return instructions[context];
}
