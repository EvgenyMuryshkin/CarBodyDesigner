import { BufferGeometry } from "three";

export interface IBodyPart {
    geometry(scale: number): BufferGeometry;
}

export class BaseBodyShape {
    get halfLegth() {
        return (this.lengthPoints - 1) / 2;
    }
    get halfWidth() {
        return (this.widthPoints - 1) / 2;
    }
    get halfHeight() {
        return (this.heightPoints - 1) / 2;
    }

    constructor(
        protected lengthPoints: number, 
        protected widthPoints: number, 
        protected heightPoints: number) {
    }
}