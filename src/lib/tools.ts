export class Tools {
    static withinRange(value: number, min: number, max: number) {
        const mMin = Math.min(min, max);
        const mMax = Math.max(min, max);

        if (value < mMin) return mMin;
        if (value > mMax) return mMax;    

        return value;
    }

    static between(value: number, min: number, max: number) {
        const mMin = Math.min(min, max);
        const mMax = Math.max(min, max);

        return value > mMin && value < mMax;
    }

    static betweenInclusive(value: number, min: number, max: number) {
        const mMin = Math.min(min, max);
        const mMax = Math.max(min, max);

        return value >= mMin && value <= mMax;
    }

    static classNames(source: {[key: string]: boolean}) {
        if (!source) return "";

        const keys = Object.keys(source);
        const values = keys.filter(k => source[k]).join(" ");

        return values;
    }

    static clone<T>(source: T): T {
        const json = JSON.stringify(source);
        return JSON.parse(json);
    }

    static pythHB(hyp: number, base: number) {
        return Math.sqrt(hyp * hyp - base * base);
    }

    static pythBP(base: number, perp: number) {
        return Math.sqrt(base * base + perp * perp);
    }
}