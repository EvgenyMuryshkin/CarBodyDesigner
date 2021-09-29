export class Tools {
    static between(value: number, min: number, max: number) {
        const mMin = Math.min(min, max);
        const mMax = Math.max(min, max);

        if (value < mMin) return min;
        if (value > mMax) return max;    

        return value;
    }

    static classNames(source: {[key: string]: boolean}) {
        if (!source) return "";

        const keys = Object.keys(source);
        const values = keys.filter(k => source[k]).join(" ");

        return values;
    }
}