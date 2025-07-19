/**
 * TabletBrowse Pro - 元素高亮器
 * 在触摸移动时高亮可交互元素
 */

class ElementHighlighter {
  constructor() {
    this.settings = {};
    this.isHighlighting = false;
    this.highlightedElement = null;
    this.highlightOverlay = null;

    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('settingsUpdated', (event) => {
      this.settings = event.detail.settings;
    });
  }

  handleTouchStart(event) {
    if (!this.settings.highlightEnabled) return;
    this.isHighlighting = true;
  }

  handleTouchMove(event) {
    if (!this.isHighlighting) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (this.isInteractive(element) && element !== this.highlightedElement) {
      this.highlight(element);
    } else if (!this.isInteractive(element) && this.highlightedElement) {
      this.clearHighlight();
    }
  }

  handleTouchEnd(event) {
    this.isHighlighting = false;
    this.clearHighlight();
  }

  highlight(element) {
    this.clearHighlight();
    this.highlightedElement = element;

    if (!this.highlightOverlay) {
      this.highlightOverlay = document.createElement('div');
      this.highlightOverlay.className = 'tb-highlight-overlay';
      document.body.appendChild(this.highlightOverlay);
    }

    const rect = element.getBoundingClientRect();
    this.highlightOverlay.style.width = rect.width + 'px';
    this.highlightOverlay.style.height = rect.height + 'px';
    this.highlightOverlay.style.top = (rect.top + window.scrollY) + 'px';
    this.highlightOverlay.style.left = (rect.left + window.scrollX) + 'px';
    this.highlightOverlay.style.display = 'block';
  }

  clearHighlight() {
    if (this.highlightedElement) {
      this.highlightedElement = null;
    }
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  isInteractive(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    return (
      element.matches('a, button, input, select, textarea, [onclick], [role="button"]') ||
      style.cursor === 'pointer'
    );
  }
}

addStyles(`
.tb-highlight-overlay {
  position: absolute;
  background-color: rgba(255, 215, 0, 0.5); /* Gold color */
  border-radius: 4px;
  z-index: ${Z_INDEX.HIGHLIGHT};
  pointer-events: none;
  transition: all 0.1s ease;
  display: none;
}
`);

window.tabletBrowseElementHighlighter = null;
