import { BufferGeometry } from "three";
import { IPoint2D, IPoint3D } from "./lib";
import { SidePlane } from "./SidePlane";

export class BodyShape {
    private left: SidePlane;
    private right: SidePlane;
    private front: SidePlane;
    private back: SidePlane;
    private top: SidePlane;

    get halfLegth() {
        return (this.lengthPoints - 1) / 2;
    }
    get halfWidth() {
        return (this.widthPoints - 1) / 2;
    }
    get halfHeight() {
        return (this.heightPoints - 1) / 2;
    }

    constructor(private lengthPoints: number, private widthPoints: number, private heightPoints: number) {
        const geometryScale = 5;

        const length = lengthPoints - 1;
        const width = widthPoints - 1;
        const height = heightPoints - 1;

        const halfLegth = 0;// (lengthPoints - 1) / 2;
        const halfWidth = 0;//(widthPoints - 1) / 2;
        const halfHeight = 0;//(heightPoints - 1) / 2;

        //console.log(halfLegth, halfWidth, halfHeight);

        const scale = (points: number[]): IPoint3D => {
            const scaled = points.map(p => p);
            return {
                x: scaled[0],
                y: scaled[1],
                z: scaled[2]
            };
        };

        this.left = new SidePlane({
            length: lengthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, w - halfHeight, width - halfWidth])
        });

        this.right = new SidePlane({
            length: lengthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, w - halfHeight, - halfWidth])
        });

        this.front = new SidePlane({
            length: widthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([-halfLegth, w - halfHeight, l - halfWidth])
        });

        this.back = new SidePlane({
            length: widthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([length - halfLegth, w - halfHeight, l - halfWidth])
        });

        this.top = new SidePlane({
            length: lengthPoints,
            width: widthPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, height - halfHeight, w - halfWidth])
        });
    }

    public apply(
        sidePoints: IPoint2D[],
        frontPoints: IPoint2D[],
        topPoints: IPoint2D[]
    ) {
        const { lengthPoints, widthPoints, heightPoints } = this;

        const offsetScale = (value: number, offset: number, scale: number) => {
            return (value - offset) * scale + offset;
        }

        this.left.apply((l, w, p) => {
            const frontScale = frontPoints[widthPoints - 1].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                return {
                    x: p.x,
                    y: p.y * yScale * frontScale,
                    z: offsetScale(p.z, this.halfWidth, zScale)
                }
            }]
        });

        this.right.apply((l, w, p) => {
            const frontScale = frontPoints[0].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                return {
                    x: p.x,
                    y: p.y * yScale * frontScale,
                    z: offsetScale(p.z, this.halfWidth, zScale)
                }
            }]
        });

        this.top.apply((l, w, p) => {
            const frontScale = frontPoints[w].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                return {
                    x: p.x,
                    y: p.y * yScale * frontScale,
                    z: offsetScale(p.z, this.halfWidth, zScale)
                }
            }]
        });

        this.front.apply((l, w, p) => {
            const frontScale = frontPoints[l].y / heightPoints;
            const yScale = sidePoints[0].y / heightPoints;
            const zScale = topPoints[0].y / widthPoints;

            p.handlers = [(p) => {
                return {
                    x: p.x,
                    y: p.y * yScale * frontScale,
                    z: offsetScale(p.z, this.halfWidth, zScale)
                }
            }]
        });

        this.back.apply((l, w, p) => {
            const frontScale = frontPoints[l].y / heightPoints;
            const yScale = sidePoints[lengthPoints - 1].y / heightPoints;
            const zScale = topPoints[lengthPoints - 1].y / widthPoints;

            p.handlers = [(p) => {
                return {
                    x: p.x,
                    y: p.y * yScale * frontScale,
                    z: offsetScale(p.z, this.halfWidth, zScale)
                }
            }]
        });
    }

    public get geometry(): BufferGeometry[] {
        const { left, right, front, back, top } = this;
        return [
            left,
            right,
            front, 
            back, 
            top
        ].map(p => p.geometry(5));
    }
}
