/**
 * Formatea un número como moneda local (Peso Chileno por defecto).
 * Ej: 1000 -> "1.000"
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const PARTICLES = new Set([
    'de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'das', 'do', 'dos',
    'van', 'von', 'der', 'den',
]);

/**
 * Normaliza nombres propios y direcciones a "Title Case".
 * Ej: "barbara hernandez" -> "Barbara Hernandez"
 *     "Av. las nieves" -> "Av. las Nieves"
 */
export const toTitleCase = (input: string): string => {
    const value = (input || '').trim().replace(/\s+/g, ' ');
    if (!value) return value;

    return value
        .split(' ')
        .map((word, wordIndex) =>
            word
                .split(/([-'])/)
                .map((part, partIndex) => {
                    if (!part || part === '-' || part === "'") return part;
                    const lower = part.toLocaleLowerCase('es');
                    if (wordIndex > 0 && partIndex === 0 && PARTICLES.has(lower)) return lower;
                    if (part === lower || part === part.toLocaleUpperCase('es')) {
                        return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
                    }
                    return part.charAt(0).toLocaleUpperCase('es') + part.slice(1);
                })
                .join(''),
        )
        .join(' ');
};

// En el futuro, puedes agregar aquí otras funciones relacionadas con formato:
// export const formatDate = (date: Date) => { ... }
// export const formatPercentage = (value: number) => { ... }