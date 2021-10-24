import { IPoint2D } from "../../lib";

export enum drawingMode {
    Contour,
    Wheel
}

export enum wheelDrawingType {
    None,
    Top,
    Side
}

export interface IWheelModel {
    center: IPoint2D;
    wheelRadius: number;
    arcRadius: number;
    offset: number;
    width: number;
}

export enum sectionEditorMode {
    None,
    Pick,
    Edit
}