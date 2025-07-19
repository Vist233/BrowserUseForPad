/**
 * TabletBrowse Pro - 超级菜单
 * 提供统一的功能入口
 */

class SuperMenu {
  constructor() {
    this.settings = {};
    this.isOpen = false;
    this.menuElement = null;
    this.context = {};

    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindEvents();
  }

  bindEvents() {
    // 监听打开超级菜单的事件 (e.g., from GestureDetector)
    document.addEventListener('openSuperMenu', this.handleOpenMenu.bind(this));
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('settingsUpdated', (event) => {
      this.settings = event.detail.settings;
    });
  }

  handleOpenMenu(event) {
    if (this.isOpen) {
      this.close();
      return;
    }
    const { clientX, clientY, target } = event.detail;
    this.context = {
      x: clientX,
      y: clientY,
      target: target,
    };
    this.open();
  }

  open() {
    this.isOpen = true;
    this.createMenuElement();
    this.populateMenu();
    this.positionMenu();
    document.body.classList.add('tb-super-menu-open');
  }

  close() {
    this.isOpen = false;
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    document.body.classList.remove('tb-super-menu-open');
  }

  createMenuElement() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'tb-super-menu';
  }

  populateMenu() {
    const menuItems = this.getMenuItems();
    menuItems.forEach(item => {
      const menuItemElement = this.createMenuItem(item);
      this.menuElement.appendChild(menuItemElement);
    });
    document.body.appendChild(this.menuElement);
  }

  getMenuItems() {
    const items = [];
    // Browser actions
    items.push({ label: 'Reload', action: () => chrome.runtime.sendMessage({action: 'reloadTab'}) });
    items.push({ label: 'Go Back', action: () => chrome.runtime.sendMessage({action: 'goBack'}) });
    items.push({ label: 'Go Forward', action: () => chrome.runtime.sendMessage({action: 'goForward'}) });

    // Context-specific actions
    if (this.context.target.tagName === 'A') {
      items.push({ label: 'Copy Link Address', action: () => navigator.clipboard.writeText(this.context.target.href) });
      items.push({ label: 'Open in New Tab', action: () => window.open(this.context.target.href) });
    }

    // Plugin features
    items.push({ label: 'Toggle Focus Mode', action: () => chrome.runtime.sendMessage({action: 'toggleFocusMode'}) });

    return items;
  }

  createMenuItem(item) {
    const element = document.createElement('div');
    element.className = 'tb-super-menu-item';
    element.textContent = item.label;
    element.onclick = () => {
      item.action();
      this.close();
    };
    return element;
  }

  positionMenu() {
    const { x, y } = this.context;
    this.menuElement.style.left = x + 'px';
    this.menuElement.style.top = y + 'px';

    // Adjust if out of bounds
    const rect = this.menuElement.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menuElement.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this.menuElement.style.top = (y - rect.height) + 'px';
    }
  }

  handleClickOutside(event) {
    if (this.isOpen && this.menuElement && !this.menuElement.contains(event.target)) {
      this.close();
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }
}

window.tabletBrowseSuperMenu = null;
