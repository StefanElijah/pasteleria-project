const PARTICLES = new Set([
    'de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'das', 'do', 'dos',
    'van', 'von', 'der', 'den',
]);

/**
 * Normaliza nombres propios y direcciones a "Title Case" respetando:
 * - tildes y ñ (es-CL)
 * - apóstrofos (O'Connor) y guiones (Jean-Pierre)
 * - partículas en minúscula salvo al inicio (María de la Cruz)
 * - mayúsculas mixtas intencionales (McDonald)
 */
export function splitPersonName(
    value?: string | null,
    second?: string | null,
): { first: string | null; second: string | null } {
    const firstNorm = (toTitleCase(value) as string) || '';
    const secondNorm = (toTitleCase(second) as string) || '';

    if (secondNorm.trim() !== '') {
        return { first: firstNorm || null, second: secondNorm };
    }
    if (!firstNorm) return { first: null, second: null };

    const tokens = firstNorm.split(/\s+/);
    if (tokens.length <= 1) return { first: firstNorm, second: null };

    // No dividir apellidos/nombres que empiezan con partícula (De la Fuente, Van der Berg)
    if (PARTICLES.has(tokens[0].toLocaleLowerCase('es'))) {
        return { first: firstNorm, second: null };
    }

    return { first: tokens[0], second: tokens.slice(1).join(' ') };
}

export function toTitleCase(input?: string | null): string | null | undefined {
    if (input === null || input === undefined) return input;

    const value = String(input).trim().replace(/\s+/g, ' ');
    if (!value) return value;

    return value
        .split(' ')
        .map((word, wordIndex) =>
            word
                .split(/([-'])/)
                .map((part, partIndex) => {
                    if (!part || part === '-' || part === "'") return part;

                    const lower = part.toLocaleLowerCase('es');

                    // Partículas internas en minúscula (excepto la primera palabra)
                    if (wordIndex > 0 && partIndex === 0 && PARTICLES.has(lower)) {
                        return lower;
                    }

                    // Todo minúsculas o todo mayúsculas -> normalizar
                    if (part === lower || part === part.toLocaleUpperCase('es')) {
                        return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
                    }

                    // Mayúsculas mixtas: respetar y asegurar primera letra
                    return part.charAt(0).toLocaleUpperCase('es') + part.slice(1);
                })
                .join(''),
        )
        .join(' ');
}
