/**
 * DEPRECATED: ProjectSelectorComponent
 *
 * This component has been deprecated and should be removed from the codebase.
 * Keep a tiny shim to avoid accidental imports breaking builds until it is removed.
 */
export class ProjectSelectorComponent {
  constructor() {
    if (typeof console !== 'undefined') console.warn('ProjectSelectorComponent: deprecated shim used. Remove the component.');
  }
}
