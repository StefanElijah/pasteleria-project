import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ShippingInfo {
    primerNombreDestinatario: string;
    primerApellidoDestinatario: string;
    emailDestinatario: string;
    telefonoDestinatario: string;
    calle: string;
    numero: string;
    regionId: string;
    ciudadId: string;
    comunaId: string;
    regionNombre: string;
    ciudadNombre: string;
    comunaNombre: string;
    tipoVivienda: string;
    codigoPostal: string;
    telefonoDomicilio: string;
}

interface CheckoutState {
    shippingInfo: ShippingInfo;
    paymentMethod: string;
    shippingMethod: string;
    shippingCost: number | null;
    puntosUsados: number;
    saveAddress: boolean;
    selectedAddressId: string | null;
    setShippingInfo: (info: Partial<ShippingInfo>) => void;
    setPaymentMethod: (method: string) => void;
    setShippingMethod: (method: string) => void;
    setShippingCost: (cost: number) => void;
    setPuntosUsados: (puntos: number) => void;
    setSaveAddress: (value: boolean) => void;
    setSelectedAddressId: (id: string | null) => void;
    reset: () => void;
}

const defaultShippingInfo: ShippingInfo = {
    primerNombreDestinatario: '',
    primerApellidoDestinatario: '',
    emailDestinatario: '',
    telefonoDestinatario: '',
    calle: '',
    numero: '',
    regionId: '',
    ciudadId: '',
    comunaId: '',
    regionNombre: '',
    ciudadNombre: '',
    comunaNombre: '',
    tipoVivienda: '',
    codigoPostal: '',
    telefonoDomicilio: '',
};

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            shippingInfo: defaultShippingInfo,
            paymentMethod: 'EFECTIVO',
            shippingMethod: 'Chilexpress',
            shippingCost: null,
            puntosUsados: 0,
            saveAddress: false,
            selectedAddressId: null,
            setShippingInfo: (info) =>
                set((state) => ({ shippingInfo: { ...state.shippingInfo, ...info } })),
            setPaymentMethod: (method) => set({ paymentMethod: method }),
            setShippingMethod: (method) => set({ shippingMethod: method }),
            setShippingCost: (cost) => set({ shippingCost: cost }),
            setPuntosUsados: (puntos) => set({ puntosUsados: puntos }),
            setSaveAddress: (value) => set({ saveAddress: value }),
            setSelectedAddressId: (id) => set({ selectedAddressId: id }),
            reset: () =>
                set({
                    shippingInfo: defaultShippingInfo,
                    paymentMethod: 'EFECTIVO',
                    shippingMethod: 'Chilexpress',
                    shippingCost: null,
                    puntosUsados: 0,
                    saveAddress: false,
                    selectedAddressId: null,
                }),
        }),
        { name: 'checkout-storage', storage: createJSONStorage(() => localStorage) }
    )
);
