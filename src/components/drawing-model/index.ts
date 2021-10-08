import { IPoint2D } from "../../lib";

export enum drawingMode {
    Contour,
    Wheel
}

export interface IWheelModel {
    center: IPoint2D;
    wheelRadius: number;
    arcRadius: number;
}