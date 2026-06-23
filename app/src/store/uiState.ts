import { create } from 'zustand';

export type ModalType = 'alert' | 'confirm';

export interface ModalData {
  message: string;
  type: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface UIState {
  modal: ModalData | null;
  showAlert: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closeModal: () => void;
}

export const useUIState = create<UIState>((set) => ({
  modal: null,
  showAlert: (message) => set({ modal: { message, type: 'alert' } }),
  showConfirm: (message, onConfirm, onCancel) => set({ modal: { message, type: 'confirm', onConfirm, onCancel } }),
  closeModal: () => set({ modal: null }),
}));
