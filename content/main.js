/**
 * TabletBrowse Pro - Main Content Script
 * Initializes all content script modules.
 */

// Helper function to initialize a class instance if it hasn't been already.
function initializeSingleton(window, instanceName, className) {
  if (!window[instanceName]) {
    window[instanceName] = new className();
  }
}

// Initialize all the feature modules.
document.addEventListener('DOMContentLoaded', () => {
  // Core components
  initializeSingleton(window, 'tabletBrowseTouchHandler', TouchHandler);

  // Feature components
  initializeSingleton(window, 'tabletBrowseHoverSimulator', HoverSimulator);
  initializeSingleton(window, 'tabletBrowseContextMenuHandler', ContextMenuHandler);
  initializeSingleton(window, 'tabletBrowsePrecisionClick', PrecisionClick);
  initializeSingleton(window, 'tabletBrowseGestureDetector', GestureDetector);
  initializeSingleton(window, 'tabletBrowseFocusMode', FocusMode);
  initializeSingleton(window, 'tabletBrowseSuperMenu', SuperMenu);
  initializeSingleton(window, 'tabletBrowseElementHighlighter', ElementHighlighter);
  // ... other feature initializations will go here
});
