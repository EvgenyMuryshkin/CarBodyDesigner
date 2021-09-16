export class Generate {
    static inclusive(from: number, to: number) {
        return from > to
            ? Generate.range(from, to - from - 1)
            : Generate.range(from, to - from + 1)
    }

    static range(from: number, length: number) {
        const result: number[] = [];
        if (length === 0) return [];
        if (length > 0) {
            for (let i = 0; i < length; i++) {
                result.push(i + from);
            }
        }
        else {
            for (let i = 0; i > length; i--) {
                result.push(i + from);
            }
        }
        return result;
    }
}