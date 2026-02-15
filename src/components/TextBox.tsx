import { useCallback, useRef, useLayoutEffect, useEffect } from "react";
import type { TextBoxObject } from "../types";

interface TextBoxProps {
  object: TextBoxObject;
  scale: number;
  autoFocus?: boolean;
  onFocused?: () => void;
  onUpdate: (updates: Partial<TextBoxObject>) => void;
  onDelete?: () => void;
  /** 방금 생성된 박스는 blur 시 바로 삭제하지 않음 */
  isNewlyCreated?: boolean;
  /** 입력 중 박스가 화면 밖으로 나가면 캐럿이 보이도록 자동 패닝 요청 (화면 좌표 rect 전달) */
  onPanToShowCaret?: (screenRect: { left: number; top: number; right: number; bottom: number }) => void;
}

const BASE_FONT_SIZE = 16;
/** 테두리와 글자 사이 gap 제거 → 확대/축소 시 본문 구성(자간·행간·개행)이 비례 유지됨 */
const BASE_PADDING = 0;
const MIN_VISIBLE_WIDTH = 20;
const MIN_VISIBLE_HEIGHT = 20;
/** 최소 너비 ≈ 글자 10개 (기존 5개의 약 2배) */
const MIN_WIDTH_CHARS = 10;
const SAMPLE_TEXT = "M";

/**
 * 캔버스 위 독립 텍스트박스.
 * 폰트/패딩은 캔버스 좌표 기준 고정값이며, 확대·축소는 부모 .canvas의 transform으로 비례 적용됨.
 */
export function TextBox({
  object,
  scale,
  autoFocus = false,
  onFocused,
  onUpdate,
  onDelete,
  isNewlyCreated = false,
  onPanToShowCaret,
}: TextBoxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const pendingAdjustAfterCompositionRef = useRef(false);

  useLayoutEffect(() => {
    if (!autoFocus || !inputRef.current) return;
    const el = inputRef.current;
    el.focus();
    onFocused?.();
    const id = requestAnimationFrame(() => {
      el.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [autoFocus, onFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ text: e.target.value });
    },
    [onUpdate]
  );

  const handleBlur = useCallback(() => {
    if (isNewlyCreated) return;
    if (object.text.trim() === "" && onDelete) {
      onDelete();
    }
  }, [object.text, onDelete, isNewlyCreated]);

  const adjustHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, MIN_VISIBLE_HEIGHT)}px`;
  }, []);

  /** getBoundingClientRect()는 뷰포트(이미 scale 적용) 픽셀을 반환하므로, 캔버스 좌표로 쓰려면 scale로 나눔 */
  const getMinWidthCanvasPx = useCallback(() => {
    const mirror = measureRef.current;
    const el = inputRef.current;
    if (!mirror || !el) return MIN_VISIBLE_WIDTH;
    mirror.style.fontSize = `${BASE_FONT_SIZE}px`;
    mirror.style.fontFamily = getComputedStyle(el).fontFamily;
    mirror.style.fontWeight = getComputedStyle(el).fontWeight;
    mirror.textContent = SAMPLE_TEXT.repeat(MIN_WIDTH_CHARS);
    const screenW = mirror.getBoundingClientRect().width;
    return screenW / scale + 2;
  }, [scale]);

  /** @param liveText 입력 시점의 실제 문자열(조합 중이면 textarea 값 전달). 없으면 object.text 사용 */
  const adjustWidth = useCallback(
    (liveText?: string) => {
      const mirror = measureRef.current;
      const el = inputRef.current;
      if (!mirror || !el) return;
      const minW = getMinWidthCanvasPx();
      const text =
        liveText !== undefined
          ? liveText || " "
          : (object.text || " ");
      mirror.style.fontSize = `${BASE_FONT_SIZE}px`;
      mirror.style.fontFamily = getComputedStyle(el).fontFamily;
      mirror.style.fontWeight = getComputedStyle(el).fontWeight;
      mirror.textContent = text;
      const screenW = mirror.getBoundingClientRect().width;
      const wCanvas = screenW / scale + 2;
      el.style.width = `${Math.max(wCanvas, minW)}px`;
    },
    [object.text, scale, getMinWidthCanvasPx]
  );

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      adjustHeight();
      if (!isComposingRef.current) {
        adjustWidth();
      }
      if (pendingAdjustAfterCompositionRef.current) {
        pendingAdjustAfterCompositionRef.current = false;
      }
      if (object.text.length > 0) {
        const r = wrapperRef.current?.getBoundingClientRect();
        if (r && onPanToShowCaret)
          onPanToShowCaret({
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
          });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [object.text, scale, adjustHeight, adjustWidth, onPanToShowCaret]);

  /** 음절/문자 단위로 height·width 정규화: input 이벤트는 조합 중에도 매 음절마다 발생함 */
  const rafInputRef = useRef<number | null>(null);
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const liveText = (e.target as HTMLTextAreaElement).value;
      if (rafInputRef.current != null) cancelAnimationFrame(rafInputRef.current);
      rafInputRef.current = requestAnimationFrame(() => {
        rafInputRef.current = null;
        adjustHeight();
        adjustWidth(liveText);
        if (liveText.length > 0) {
          const r = wrapperRef.current?.getBoundingClientRect();
          if (r && onPanToShowCaret)
            onPanToShowCaret({
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            });
        }
      });
    },
    [adjustHeight, adjustWidth, onPanToShowCaret]
  );
  useEffect(() => {
    return () => {
      if (rafInputRef.current != null) cancelAnimationFrame(rafInputRef.current);
    };
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      const value = (e.target as HTMLTextAreaElement).value;
      isComposingRef.current = false;
      pendingAdjustAfterCompositionRef.current = true;
      onUpdate({ text: value });
    },
    [onUpdate]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
  };

  return (
    <div
      ref={wrapperRef}
      data-text-box
      className="text-box"
      style={{
        position: "absolute",
        left: object.x,
        top: object.y,
        fontSize: BASE_FONT_SIZE,
        padding: BASE_PADDING,
        transformOrigin: "0 0",
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          display: "inline-block",
          pointerEvents: "none",
          top: 0,
          left: 0,
        }}
      />
      <textarea
        ref={inputRef}
        value={object.text}
        onChange={handleChange}
        onInput={handleInput}
        onBlur={handleBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="텍스트 입력..."
        spellCheck={false}
        style={{
          display: "block",
          minHeight: MIN_VISIBLE_HEIGHT,
          fontSize: "inherit",
          padding: 0,
          border: "none",
          outline: "none",
          resize: "none",
          background: "transparent",
          fontFamily: "inherit",
          overflow: "hidden",
          boxSizing: "content-box",
        }}
      />
    </div>
  );
}
