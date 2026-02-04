"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseHorizontalScrollOptions {
  // 스크롤 감도 (1 = 기본, 2 = 2배 빠름)
  sensitivity?: number;
  // 모멘텀 스크롤 활성화
  momentum?: boolean;
  // 스냅 포인트 (아이템 너비)
  snapWidth?: number;
}

interface UseHorizontalScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollLeft: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scrollTo: (position: number) => void;
  scrollBy: (delta: number) => void;
  scrollToStart: () => void;
  scrollToEnd: () => void;
}

export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn {
  const { sensitivity = 1, momentum = true, snapWidth } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 드래그 상태
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStartX = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrame = useRef<number>();

  // 스크롤 가능 여부 업데이트
  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft: sl, scrollWidth, clientWidth } = container;
    setScrollLeft(sl);
    setCanScrollLeft(sl > 0);
    setCanScrollRight(sl < scrollWidth - clientWidth - 1);
  }, []);

  // 스크롤 이벤트
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollState();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollState();

    // ResizeObserver로 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  // 마우스/터치 드래그 핸들러
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (clientX: number) => {
      isDragging.current = true;
      startX.current = clientX;
      scrollStartX.current = container.scrollLeft;
      lastX.current = clientX;
      lastTime.current = Date.now();
      velocity.current = 0;

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const handleMove = (clientX: number) => {
      if (!isDragging.current) return;

      const now = Date.now();
      const dt = now - lastTime.current;

      if (dt > 0) {
        velocity.current = ((lastX.current - clientX) / dt) * sensitivity;
      }

      lastX.current = clientX;
      lastTime.current = now;

      const diff = (startX.current - clientX) * sensitivity;
      container.scrollLeft = scrollStartX.current + diff;
    };

    const handleEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      container.style.cursor = "";
      container.style.userSelect = "";

      // 모멘텀 스크롤
      if (momentum && Math.abs(velocity.current) > 0.1) {
        const decelerate = () => {
          velocity.current *= 0.95;

          if (Math.abs(velocity.current) > 0.1) {
            container.scrollLeft += velocity.current * 16;
            animationFrame.current = requestAnimationFrame(decelerate);
          } else if (snapWidth) {
            // 스냅 포인트로 이동
            const targetScroll = Math.round(container.scrollLeft / snapWidth) * snapWidth;
            container.scrollTo({ left: targetScroll, behavior: "smooth" });
          }
        };
        animationFrame.current = requestAnimationFrame(decelerate);
      } else if (snapWidth) {
        // 스냅 포인트로 이동
        const targetScroll = Math.round(container.scrollLeft / snapWidth) * snapWidth;
        container.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    };

    // 마우스 이벤트
    const handleMouseDown = (e: MouseEvent) => {
      // 클릭 가능한 요소인지 확인
      if ((e.target as HTMLElement).closest("button, a, input")) return;
      handleStart(e.clientX);
    };
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();
    const handleMouseLeave = () => handleEnd();

    // 터치 이벤트
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("button, a, input")) return;
      handleStart(e.touches[0].clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX);
    };
    const handleTouchEnd = () => handleEnd();

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [sensitivity, momentum, snapWidth]);

  const scrollTo = useCallback((position: number) => {
    containerRef.current?.scrollTo({ left: position, behavior: "smooth" });
  }, []);

  const scrollBy = useCallback((delta: number) => {
    containerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollToStart = useCallback(() => {
    containerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  const scrollToEnd = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        left: container.scrollWidth - container.clientWidth,
        behavior: "smooth"
      });
    }
  }, []);

  return {
    containerRef,
    scrollLeft,
    canScrollLeft,
    canScrollRight,
    scrollTo,
    scrollBy,
    scrollToStart,
    scrollToEnd,
  };
}
