export interface WondertoadSample {
  id: string;
  name: string;
  streamUrl: string;
  bpm?: number | null;
  key?: string | null;
  sampleType?: string | null;
  instrument?: string | null;
  genre?: string | null;
  duration?: number | null;
}

export interface WondertoadContext {
  name?: string | null;
  bpm?: number | null;
  key?: string | null;
}

export interface WondertoadHandoff {
  token: string;
  expiresAt?: string | null;
  context?: WondertoadContext | null;
  activeIndex?: number;
  candidates: WondertoadSample[];
}
