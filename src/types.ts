/**
 * 캔버스 위 독립 오브젝트: 텍스트박스
 * (추후 데이터 모듈화 시 이 모델을 저장/로드 레이어와 분리)
 */
export interface TextBoxObject {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface CanvasViewState {
  panX: number;
  panY: number;
  scale: number;
}
