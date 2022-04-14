export function cancelEvent(e: Event): void {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();
}
