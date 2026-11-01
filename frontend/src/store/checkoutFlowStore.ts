import { create } from 'zustand';

interface CheckoutFlowState {
    orderCompleted: boolean;
    setOrderCompleted: (value: boolean) => void;
}

// Store en memoria (no persistido): evita redirecciones mientras se muestra
// la pantalla de confirmación del pedido.
export const useCheckoutFlowStore = create<CheckoutFlowState>((set) => ({
    orderCompleted: false,
    setOrderCompleted: (value) => set({ orderCompleted: value }),
}));
