export class SizeViewItem {
    constructor (public top: number, public bottom: number) {

    }
}

export class SizeView {
    items: SizeViewItem[] = [];

    constructor(height: number, width: number) {
        for (let c = 0; c < width; c++) {
            this.items.push(new SizeViewItem(height / 2, -height / 2));
        }
    }
}
