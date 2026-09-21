// Every backend response follows this envelope — see ARCHITECTURE.md.
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  data: null;
  message: string;
  meta?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
