import { IPoint2D } from ".";

export interface ISectionData {
    front: number | null;
    side: number | null;
    top: number | null;
}

export interface ISectionPoints {
    front: IPoint2D[];
    side: IPoint2D[];
    top: IPoint2D[];
}

export interface IRenderSettings {
    wireframes: boolean;
    flatShading: boolean;
    ground: boolean;
    lightOrbit: boolean;
    renderWheels: boolean;
}