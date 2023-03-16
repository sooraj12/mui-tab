import { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  debounce,
  getNormalizedScrollLeft,
  ownerWindow,
  useEventCallback,
} from "./utils";

function Tabs({ children }) {
  const scrollable = true;
  const scrollButtons = true;
  const clientSize = "clientWidth";
  const scrollStart = "scrollLeft";
  const visibleScrollbar = true;
  const [displayScroll, setDisplayScroll] = useState({
    start: false,
    end: false,
  });
  const tabsRef = useRef(null);
  const tabListRef = useRef(null);
  const [scrollerStyle, setScrollerStyle] = useState({
    overflow: "hidden",
    scrollbarWidth: 6,
  });
  const valueToIndex = new Map();

  const updateScrollButtonState = useEventCallback(() => {
    console.log("resize...");
    if (scrollable && scrollButtons !== false) {
      const { scrollWidth, clientWidth } = tabsRef.current;
      let showStartScroll;
      let showEndScroll;

      const scrollLeft = getNormalizedScrollLeft(tabsRef.current);
      // use 1 for the potential rounding error with browser zooms.
      showStartScroll = scrollLeft > 1;
      showEndScroll = scrollLeft < scrollWidth - clientWidth - 1;

      if (
        showStartScroll !== displayScroll.start ||
        showEndScroll !== displayScroll.end
      ) {
        setDisplayScroll({ start: showStartScroll, end: showEndScroll });
      }
    }
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      if (tabsRef.current) {
        updateScrollButtonState();
      }
    });

    const win = ownerWindow(tabsRef.current);
    win.addEventListener("resize", handleResize);

    let resizeObserver;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      Array.from(tabListRef.current.children).forEach((child) => {
        resizeObserver.observe(child);
      });
    }

    return () => {
      handleResize.clear();
      win.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateScrollButtonState]);

  const handleTabsScroll = useMemo(
    () =>
      debounce(() => {
        updateScrollButtonState();
      }),
    [updateScrollButtonState]
  );

  const getScrollSize = () => {
    const containerSize = tabsRef.current[clientSize];
    let totalSize = 0;
    const children = Array.from(tabListRef.current.children);

    for (let i = 0; i < children.length; i += 1) {
      const tab = children[i];
      if (totalSize + tab[clientSize] > containerSize) {
        // If the first item is longer than the container size, then only scroll
        // by the container size.
        if (i === 0) {
          totalSize = containerSize;
        }
        break;
      }
      totalSize += tab[clientSize];
    }

    return totalSize;
  };

  const scroll = (scrollValue) => {
    animate(scrollStart, tabsRef.current, scrollValue, {
      duration: 500,
    });
  };

  const moveTabsScroll = (delta) => {
    let scrollValue = tabsRef.current[scrollStart];

    scrollValue += delta * 1;
    // Fix for Edge
    scrollValue *= 1;

    scroll(scrollValue);
  };

  const handleStartScrollClick = () => {
    moveTabsScroll(-1 * getScrollSize());
  };

  const handleEndScrollClick = () => {
    moveTabsScroll(getScrollSize());
  };

  const getConditionalElements = () => {
    const conditionalElements = {};

    const scrollButtonsActive = displayScroll.start || displayScroll.end;
    const showScrollButtons =
      scrollable &&
      ((scrollButtons === "auto" && scrollButtonsActive) ||
        scrollButtons === true);

    conditionalElements.scrollButtonStart = showScrollButtons ? (
      <button
        type="button"
        disabled={!displayScroll.start}
        onClick={handleStartScrollClick}
      >
        left
      </button>
    ) : null;

    conditionalElements.scrollButtonEnd = showScrollButtons ? (
      <button
        type="button"
        onClick={handleEndScrollClick}
        disabled={!displayScroll.end}
      >
        right
      </button>
    ) : null;

    return conditionalElements;
  };

  const conditionalElements = getConditionalElements();

  return (
    <div className="TabsRoot">
      {/* start btn */}
      {conditionalElements.scrollButtonStart}
      <div
        ref={tabsRef}
        className="Scroller"
        style={{
          overflow: scrollerStyle.overflow,
          marginBottom: visibleScrollbar
            ? undefined
            : -scrollerStyle.scrollbarWidth,
        }}
        onScroll={handleTabsScroll}
      >
        <div
          ref={tabListRef}
          className="FlexContainer"
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          {children}
        </div>
      </div>
      {/* end btn */}
      {conditionalElements.scrollButtonEnd}
    </div>
  );
}

export { Tabs };
