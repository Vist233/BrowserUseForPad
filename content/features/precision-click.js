/**
 * TabletBrowse Pro - 精准点击模式
 * 通过准星工具帮助用户精确点击小元素
 */

class PrecisionClick {
  constructor() {
    this.settings = {};
    this.isActive = false;
    this.crosshair = null;
    this.targetInfo = null;
    this.targetElement = null;

    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener(EVENTS.LONG_PRESS_START, this.handleLongPress.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('settingsUpdated', (event) => {
      this.settings = event.detail.settings;
    });
  }

  handleLongPress(event) {
    if (!this.settings.precisionClickEnabled || this.isActive) return;

    const { target, clientX, clientY } = event.detail;

    // 在任何地方都可以激活准星
    this.activate(clientX, clientY);
    event.preventDefault();
  }

  handleTouchMove(event) {
    if (!this.isActive) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.updateCrosshair(touch.clientX, touch.clientY);
  }

  handleTouchEnd(event) {
    if (!this.isActive) return;

    this.executeClick();
    this.deactivate();
  }

  activate(x, y) {
    this.isActive = true;
    this.createCrosshairUI();
    this.updateCrosshair(x, y);
    document.body.classList.add('tb-precision-click-active');
  }

  deactivate() {
    this.isActive = false;
    if (this.crosshair) {
      this.crosshair.remove();
      this.crosshair = null;
    }
    if (this.targetInfo) {
      this.targetInfo.remove();
      this.targetInfo = null;
    }
    document.body.classList.remove('tb-precision-click-active');
  }

  createCrosshairUI() {
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'tb-crosshair-pointer';

    this.targetInfo = document.createElement('div');
    this.targetInfo.className = 'tb-target-info-box';

    document.body.appendChild(this.crosshair);
    document.body.appendChild(this.targetInfo);
  }

  updateCrosshair(x, y) {
    if (!this.crosshair) return;

    this.crosshair.style.left = x + 'px';
    this.crosshair.style.top = y + 'px';

    // 隐藏UI以准确获取元素
    this.crosshair.style.display = 'none';
    this.targetInfo.style.display = 'none';

    this.targetElement = document.elementFromPoint(x, y);

    // 恢复UI显示
    this.crosshair.style.display = '';
    this.targetInfo.style.display = '';

    if (this.targetElement) {
      const text = this.getElementText(this.targetElement);
      this.targetInfo.textContent = text || this.targetElement.tagName;
      this.targetInfo.style.left = (x + 20) + 'px';
      this.targetInfo.style.top = (y + 20) + 'px';
    }
  }

  getElementText(element) {
    if (!element) return '';
    return element.innerText?.trim() || element.getAttribute('aria-label') || element.title || '';
  }

  executeClick() {
    if (this.targetElement) {
      simulateMouseEvent(this.targetElement, 'click', {
        clientX: parseInt(this.crosshair.style.left, 10),
        clientY: parseInt(this.crosshair.style.top, 10)
      });
    }
  }
}

// 添加相关CSS
addStyles(`
.tb-crosshair-pointer {
  position: fixed;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 0, 0, 0.7);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: ${Z_INDEX.SUPER_MENU + 3};
}

.tb-crosshair-pointer::before,
.tb-crosshair-pointer::after {
  content: '';
  position: absolute;
  background: rgba(255, 0, 0, 0.7);
}

.tb-crosshair-pointer::before {
  width: 1px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.tb-crosshair-pointer::after {
  height: 1px;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.tb-target-info-box {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: ${Z_INDEX.SUPER_MENU + 2};
  pointer-events: none;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tb-precision-click-active {
  cursor: none !important;
}
`);

// 全局实例
window.tabletBrowsePrecisionClick = null;
