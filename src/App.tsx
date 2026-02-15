import { useCallback, useEffect, useRef, useState } from "react";
import type { TextBoxObject, CanvasViewState } from "./types";
import { OriginCross } from "./components/OriginCross";
import { TextBox } from "./components/TextBox";
import "./App.css";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

const INITIAL_VIEW: CanvasViewState = { panX: 0, panY: 0, scale: 1 };

function generateId(): string {
  return `tb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CanvasViewState>(INITIAL_VIEW);
  /** 클릭/이벤트 시점에 항상 최신 view 사용 (자동 패닝 후 stale closure 방지) */
  const viewRef = useRef(view);
  viewRef.current = view;

  const [textBoxes, setTextBoxes] = useState<TextBoxObject[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  /** 캔버스 원점이 놓인 뷰포트 중심(화면 좌표). .canvas는 left:50% top:50%이므로 뷰포트 요소 기준으로 구해야 패닝 후에도 클릭 위치가 정확함. */
  const getViewportCenter = useCallback(() => {
    const el = viewportRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return { centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
    }
    return {
      centerX: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
      centerY: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    };
  }, []);

  /** 이벤트 시점의 최신 view로 변환 (자동 패닝 반영). ref 사용으로 stale closure 방지. */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const { panX, panY, scale } = viewRef.current;
      const { centerX, centerY } = getViewportCenter();
      const x = (screenX - centerX - panX) / scale;
      const y = (screenY - centerY - panY) / scale;
      return { x, y };
    },
    [getViewportCenter]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const { centerX, centerY } = getViewportCenter();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      setView((prev) => {
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale + delta)
        );
        const cx = (mouseX - centerX - prev.panX) / prev.scale;
        const cy = (mouseY - centerY - prev.panY) / prev.scale;
        const newPanX = mouseX - centerX - cx * newScale;
        const newPanY = mouseY - centerY - cy * newScale;
        const next = {
          ...prev,
          scale: newScale,
          panX: newPanX,
          panY: newPanY,
        };
        viewRef.current = next;
        return next;
      });
    },
    [getViewportCenter]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const isMiddleButton = e.button === 1;
      if (spacePressed || isMiddleButton) {
        setIsPanning(true);
        (document.activeElement as HTMLElement | null)?.blur();
        const v = viewRef.current;
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: v.panX,
          panY: v.panY,
        };
        if (isMiddleButton && e.currentTarget instanceof HTMLElement) {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        return;
      }
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-text-box]")) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      requestAnimationFrame(() => {
        const { x, y } = screenToCanvas(clientX, clientY);
        const newId = generateId();
        setTextBoxes((prev) => [
          ...prev,
          { id: newId, x, y, text: "" },
        ]);
        setLastAddedId(newId);
      });
    },
    [spacePressed, screenToCanvas]
  );
  /** 입력 중 텍스트박스가 화면 밖으로 나가면 캐럿이 보이도록 자동 패닝. 이 패닝이 viewRef에 반영되므로 클릭 좌표도 정확해짐. */
  const handlePanToShowCaret = useCallback(
    (textboxScreenRect: { left: number; top: number; right: number; bottom: number }) => {
      const vp = viewportRef.current?.getBoundingClientRect();
      if (!vp) return;
      const vpRight = vp.left + vp.width;
      const vpBottom = vp.top + vp.height;
      const boxW = textboxScreenRect.right - textboxScreenRect.left;
      const boxH = textboxScreenRect.bottom - textboxScreenRect.top;
      let dPanX = 0;
      let dPanY = 0;
      if (textboxScreenRect.right > vpRight)
        dPanX = -(textboxScreenRect.right - vpRight);
      if (textboxScreenRect.bottom > vpBottom)
        dPanY = -(textboxScreenRect.bottom - vpBottom);
      if (textboxScreenRect.left < vp.left) {
        if (boxW <= vp.width) dPanX = vp.left - textboxScreenRect.left;
      }
      if (textboxScreenRect.top < vp.top) {
        if (boxH <= vp.height) dPanY = vp.top - textboxScreenRect.top;
      }
      if (dPanX !== 0 || dPanY !== 0) {
        setView((prev) => {
          const next = {
            ...prev,
            panX: prev.panX + dPanX,
            panY: prev.panY + dPanY,
          };
          viewRef.current = next;
          return next;
        });
      }
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      setView((prev) => {
        const next = {
          ...prev,
          panX: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          panY: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
        };
        viewRef.current = next;
        return next;
      });
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetViewToOrigin = useCallback(() => {
    const next = { ...INITIAL_VIEW };
    viewRef.current = next;
    setView(next);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") setSpacePressed(true);
    if (e.code === "Escape") {
      const active = document.activeElement as HTMLElement | null;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || active?.isContentEditable) {
        active.blur();
        e.preventDefault();
      }
    }
    const isOriginShortcut = (e.code === "Digit0" || e.code === "Numpad0") && (e.ctrlKey || e.metaKey);
    if (isOriginShortcut) {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable);
      if (!isInput) {
        e.preventDefault();
        resetViewToOrigin();
      }
    }
  }, [resetViewToOrigin]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      setSpacePressed(false);
      setIsPanning(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const updateTextBox = useCallback((id: string, updates: Partial<TextBoxObject>) => {
    setTextBoxes((prev) =>
      prev.map((tb) => (tb.id === id ? { ...tb, ...updates } : tb))
    );
  }, []);

  const removeTextBox = useCallback((id: string) => {
    setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    if (lastAddedId === id) setLastAddedId(null);
  }, [lastAddedId]);

  return (
    <div
      ref={viewportRef}
      className="viewport"
      title="Ctrl+0: 원점·배율 초기화 | Esc: 텍스트박스 포커스 해제"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: spacePressed ? "grab" : isPanning ? "grabbing" : "crosshair" }}
    >
      <div
        className="canvas"
        style={{
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.scale})`,
        }}
      >
        <OriginCross />
        {textBoxes.map((tb) => (
          <TextBox
            key={tb.id}
            object={tb}
            scale={view.scale}
            autoFocus={tb.id === lastAddedId}
            onFocused={() => {
              setTimeout(() => setLastAddedId(null), 400);
            }}
            isNewlyCreated={tb.id === lastAddedId}
            onUpdate={(updates) => updateTextBox(tb.id, updates)}
            onDelete={() => removeTextBox(tb.id)}
            onPanToShowCaret={handlePanToShowCaret}
          />
        ))}
      </div>
    </div>
  );
}
