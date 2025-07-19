/**
 * TabletBrowse Pro - 聚焦模式
 * 帮助用户专注于页面核心内容
 */

class FocusMode {
  constructor() {
    this.settings = {};
    this.isSelecting = false;
    this.isFocused = false;
    this.focusedElement = null;
    this.hiddenElements = [];
    this.highlightOverlay = null;

    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindEvents();
    // A command to trigger focus mode, e.g., from a popup or super menu
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'toggleFocusMode') {
        this.toggleSelection();
      }
    });
  }

  bindEvents() {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true); // Use capture phase
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('settingsUpdated', (event) => {
      this.settings = event.detail.settings;
    });
  }

  toggleSelection() {
    if (this.isFocused) {
      this.deactivate();
      return;
    }
    this.isSelecting = !this.isSelecting;
    if (this.isSelecting) {
      this.createHighlightOverlay();
      document.body.classList.add('tb-focus-selecting');
    } else {
      this.removeHighlightOverlay();
      document.body.classList.remove('tb-focus-selecting');
    }
  }

  handleMouseMove(event) {
    if (!this.isSelecting) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (this.isSelectable(element)) {
      this.updateHighlightOverlay(element);
    }
  }

  handleClick(event) {
    if (!this.isSelecting) return;
    event.preventDefault();
    event.stopPropagation();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (this.isSelectable(element)) {
      this.activate(element);
    }
    this.toggleSelection(); // Exit selection mode
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && (this.isFocused || this.isSelecting)) {
      this.deactivate();
      if(this.isSelecting) this.toggleSelection();
    }
  }

  activate(element) {
    this.isFocused = true;
    this.focusedElement = element;

    const body = document.body;
    for (let i = 0; i < body.children.length; i++) {
        const child = body.children[i];
        if (child !== element && !child.contains(element)) {
            if(child.style.display !== 'none'){
                this.hiddenElements.push({el: child, display: child.style.display});
                child.style.display = 'none';
            }
        }
    }

    let parent = element.parentElement;
    while(parent && parent !== body){
        for (let i = 0; i < parent.children.length; i++) {
            const sibling = parent.children[i];
            if(sibling !== element && !sibling.contains(element)){
                 if(sibling.style.display !== 'none'){
                    this.hiddenElements.push({el: sibling, display: sibling.style.display});
                    sibling.style.display = 'none';
                }
            }
        }
        element = parent;
        parent = element.parentElement;
    }

    document.body.classList.add('tb-focus-active');
    this.createExitButton();
  }

  deactivate() {
    this.isFocused = false;
    this.hiddenElements.forEach(item => {
      item.el.style.display = item.display;
    });
    this.hiddenElements = [];
    this.focusedElement = null;
    document.body.classList.remove('tb-focus-active');
    const exitButton = document.querySelector('.tb-exit-focus-button');
    if (exitButton) exitButton.remove();
  }

  createHighlightOverlay() {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.className = 'tb-focus-highlight-overlay';
    document.body.appendChild(this.highlightOverlay);
  }

  removeHighlightOverlay() {
    if (this.highlightOverlay) {
      this.highlightOverlay.remove();
      this.highlightOverlay = null;
    }
  }

  updateHighlightOverlay(element) {
    const rect = element.getBoundingClientRect();
    this.highlightOverlay.style.width = rect.width + 'px';
    this.highlightOverlay.style.height = rect.height + 'px';
    this.highlightOverlay.style.top = (rect.top + window.scrollY) + 'px';
    this.highlightOverlay.style.left = (rect.left + window.scrollX) + 'px';
  }

  isSelectable(element) {
    return element && element.nodeType === 1 && element.tagName !== 'BODY' && element.tagName !== 'HTML' && !element.classList.contains('tb-focus-highlight-overlay') && !element.classList.contains('tb-exit-focus-button');
  }

  createExitButton() {
    const button = document.createElement('button');
    button.className = 'tb-exit-focus-button';
    button.textContent = 'Exit Focus Mode';
    button.onclick = () => this.deactivate();
    document.body.appendChild(button);
  }
}

addStyles(`
.tb-focus-selecting {
  cursor: crosshair !important;
}
.tb-focus-highlight-overlay {
  position: absolute;
  background-color: rgba(0, 123, 255, 0.3);
  border: 2px solid #007bff;
  z-index: ${Z_INDEX.HIGHLIGHT};
  pointer-events: none;
  transition: all 0.1s ease-in-out;
}
.tb-exit-focus-button {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: ${Z_INDEX.SUPER_MENU + 5};
}
`);

window.tabletBrowseFocusMode = null;
