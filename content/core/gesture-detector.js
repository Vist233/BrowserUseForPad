/**
 * TabletBrowse Pro - 手势检测器
 * 负责识别多指手势，如三指滑动
 */

class GestureDetector {
  constructor() {
    this.settings = {};
    this.touches = [];
    this.gestureStarted = false;

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
    this.touches = Array.from(event.touches);

    if (this.settings.gestureNavEnabled && this.touches.length === 3) {
      this.gestureStarted = 'swipe';
    } else if (this.touches.length === 2) {
      this.gestureStarted = 'long-press';
      this.longPressTimer = setTimeout(() => {
        const touch1 = this.touches[0];
        const touch2 = this.touches[1];
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        document.dispatchEvent(new CustomEvent('openSuperMenu', {
          detail: {
            clientX: midX,
            clientY: midY,
            target: document.elementFromPoint(midX, midY)
          }
        }));
        this.resetGesture();
      }, 500); // 500ms for long press
    }
  }

  handleTouchMove(event) {
    if (this.gestureStarted === 'long-press') {
      // If fingers move too much, cancel the long press
      const newTouches = Array.from(event.touches);
      if (newTouches.length !== 2) {
        this.resetGesture();
        return;
      }
      const dist = Math.hypot(
        newTouches[0].clientX - this.touches[0].clientX,
        newTouches[0].clientY - this.touches[0].clientY
      );
      if (dist > 20) { // 20px tolerance
        this.resetGesture();
      }
    }
  }

  handleTouchEnd(event) {
    if (this.gestureStarted === 'long-press') {
      this.resetGesture();
      return;
    }
    if (!this.gestureStarted || this.touches.length !== 3) {
      this.resetGesture();
      return;
    }

    // 确保是最后一只手指抬起
    if (event.touches.length > 0) {
      return;
    }

    const endTouches = Array.from(event.changedTouches);
    if (endTouches.length === 0) {
        this.resetGesture();
        return;
    }

    let dx = 0;
    for (let i = 0; i < this.touches.length; i++) {
        const startTouch = this.touches[i];
        const endTouch = endTouches.find(t => t.identifier === startTouch.identifier);
        if (endTouch) {
            dx += endTouch.clientX - startTouch.clientX;
        }
    }

    const avgDx = dx / this.touches.length;

    if (Math.abs(avgDx) > 100) { // 滑动阈值
      if (avgDx > 0) {
        this.dispatchGesture('swipe-right');
      } else {
        this.dispatchGesture('swipe-left');
      }
    }

    this.resetGesture();
  }

  dispatchGesture(gesture) {
    const actionMap = {
      'swipe-left': { action: 'switchTab', direction: 'right' },
      'swipe-right': { action: 'switchTab', direction: 'left' },
    };

    if (actionMap[gesture]) {
      chrome.runtime.sendMessage(actionMap[gesture]);
    }
  }

  resetGesture() {
    clearTimeout(this.longPressTimer);
    this.touches = [];
    this.gestureStarted = false;
  }
}

// 全局实例
window.tabletBrowseGestureDetector = null;
