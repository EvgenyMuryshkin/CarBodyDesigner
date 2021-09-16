import { Generate, IPoint2D, IPoint3D } from "./lib";

export class BodyGeometry {
    top: IPoint3D[];
    bottom: IPoint3D[];
    left: IPoint3D[];
    right: IPoint3D[];
    front: IPoint3D[];
    back: IPoint3D[];

    constructor(
        private length: number,
        private height: number,
        private width: number) {
        this.top = [];
        this.bottom = [];
        this.left = [];
        this.right = [];
        this.front = [];
        this.back = [];
    }

    setSide(points: IPoint2D[]) {
        const offset = (this.width - 1) / 2;
        for (const i of Generate.range(0, this.length)) {
            this.left[i] = {
                x: i,
                y: offset,
                z: points[i].y,
            };

            this.right[i] = {
                x: i,
                y: -offset,
                z: points[i].y,
            }
        }
    }
}