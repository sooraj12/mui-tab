import React from "react";

function ownerDocument(node) {
  return (node && node.ownerDocument) || document;
}

function ownerWindow(node) {
  const doc = ownerDocument(node);
  return doc.defaultView || window;
}

// Corresponds to 10 frames at 60 Hz.
// A few bytes payload overhead when lodash/debounce is ~3 kB and debounce ~300 B.
function debounce(func, wait = 166) {
  let timeout;
  function debounced(...args) {
    const later = () => {
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }

  debounced.clear = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

let cachedType;
function detectScrollType() {
  if (cachedType) {
    return cachedType;
  }

  const dummy = document.createElement("div");
  const container = document.createElement("div");
  container.style.width = "10px";
  container.style.height = "1px";
  dummy.appendChild(container);
  dummy.dir = "ltr";
  dummy.style.fontSize = "14px";
  dummy.style.width = "4px";
  dummy.style.height = "1px";
  dummy.style.position = "absolute";
  dummy.style.top = "-1000px";
  dummy.style.overflow = "scroll";

  document.body.appendChild(dummy);

  cachedType = "reverse";

  if (dummy.scrollLeft > 0) {
    cachedType = "default";
  } else {
    dummy.scrollLeft = 1;
    if (dummy.scrollLeft === 0) {
      cachedType = "negative";
    }
  }

  document.body.removeChild(dummy);
  return cachedType;
}

function getNormalizedScrollLeft(element, direction = "ltr") {
  const scrollLeft = element.scrollLeft;

  // Perform the calculations only when direction is rtl to avoid messing up the ltr behavior
  if (direction !== "rtl") {
    return scrollLeft;
  }

  const type = detectScrollType();

  switch (type) {
    case "negative":
      return element.scrollWidth - element.clientWidth + scrollLeft;
    case "reverse":
      return element.scrollWidth - element.clientWidth - scrollLeft;
    default:
      return scrollLeft;
  }
}

const useEnhancedEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function useEventCallback(fn) {
  const ref = React.useRef(fn);
  useEnhancedEffect(() => {
    ref.current = fn;
  });
  return React.useCallback(
    (...args) =>
      // @ts-expect-error hide `this`
      // tslint:disable-next-line:ban-comma-operator
      ref.current(...args),
    []
  );
}

function easeInOutSin(time) {
  return (1 + Math.sin(Math.PI * time - Math.PI / 2)) / 2;
}

function animate(property, element, to, options = {}, cb = () => {}) {
  const {
    ease = easeInOutSin,
    duration = 300, // standard
  } = options;

  let start = null;
  const from = element[property];
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
  };

  const step = (timestamp) => {
    if (cancelled) {
      cb(new Error("Animation cancelled"));
      return;
    }

    if (start === null) {
      start = timestamp;
    }
    const time = Math.min(1, (timestamp - start) / duration);

    element[property] = ease(time) * (to - from) + from;

    if (time >= 1) {
      requestAnimationFrame(() => {
        cb(null);
      });
      return;
    }

    requestAnimationFrame(step);
  };

  if (from === to) {
    cb(new Error("Element already at target position"));
    return cancel;
  }

  requestAnimationFrame(step);
  return cancel;
}

export {
  ownerWindow,
  debounce,
  getNormalizedScrollLeft,
  detectScrollType,
  useEventCallback,
  animate,
};
