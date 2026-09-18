/**
 * Safe polyfill and error guard for Pointer Lock API across browsers
 * (including Safari, WebKit, iOS/iPadOS, and iframes)
 */
export function initPointerLockPolyfill() {
  if (typeof window === 'undefined') return;

  const getRequestFn = (target: any) => {
    return target?.requestPointerLock || 
           target?.webkitRequestPointerLock || 
           target?.mozRequestPointerLock || 
           null;
  };

  const getExitFn = (doc: any) => {
    return doc?.exitPointerLock || 
           doc?.webkitExitPointerLock || 
           doc?.mozExitPointerLock || 
           null;
  };

  // Safe wrapper for requestPointerLock on any Element
  const safeRequestPointerLock = function(this: any, options?: any) {
    const fn = getRequestFn(this);
    if (typeof fn === 'function' && fn !== safeRequestPointerLock) {
      try {
        const res = fn.call(this, options);
        if (res && typeof res.catch === 'function') {
          res.catch((err: any) => {
            console.warn('Pointer lock request rejected:', err);
          });
        }
        return res;
      } catch (err) {
        console.warn('Pointer lock request exception:', err);
      }
    } else {
      console.warn('Pointer lock API not supported in this browser environment');
      document.dispatchEvent(new Event('pointerlockchange'));
    }
  };

  // Safe wrapper for exitPointerLock on Document
  const safeExitPointerLock = function(this: any) {
    const fn = getExitFn(this);
    if (typeof fn === 'function' && fn !== safeExitPointerLock) {
      try {
        const res = fn.call(this);
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
        return res;
      } catch (err) {
        console.warn('Exit pointer lock exception:', err);
      }
    }
  };

  if (typeof Element !== 'undefined') {
    if (!Element.prototype.requestPointerLock) {
      Element.prototype.requestPointerLock = safeRequestPointerLock;
    } else {
      const orig = Element.prototype.requestPointerLock;
      Element.prototype.requestPointerLock = function(options?: any) {
        try {
          const res = orig.call(this, options);
          if (res && typeof res.catch === 'function') {
            res.catch((err: any) => {
              console.warn('Pointer lock rejected:', err);
            });
          }
          return res;
        } catch (err) {
          console.warn('Pointer lock error:', err);
        }
      };
    }
  }

  if (typeof Document !== 'undefined') {
    if (!(Document.prototype as any).requestPointerLock) {
      (Document.prototype as any).requestPointerLock = function(options?: any) {
        const target = document.body || document.documentElement;
        if (target && typeof target.requestPointerLock === 'function') {
          return target.requestPointerLock(options);
        }
      };
    }
    if (!(Document.prototype as any).exitPointerLock) {
      (Document.prototype as any).exitPointerLock = safeExitPointerLock;
    }
  }
}
