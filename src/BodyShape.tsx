import { BufferGeometry } from "three";
import { BaseBodyShape, IBodyPart } from "./BodyShapeTypes";
import { IWheelModel } from "./components/drawing-model";
import { IDesign } from "./DesignStore";
import { Generate, IPoint2D, IPoint3D, ISectionData, ISectionPoints, Tools } from "./lib";
import { generationMode, generationParity, normalsDirection, SidePlane } from "./SidePlane";

export class CountourQuery
{
    constructor(private countour: IPoint2D[], private segments: IPoint2D[][]) {

    }

    query(l: number) {
        const {countour, segments } = this;
        for (let i = l; i >= 0; i--)
            if (segments[i]) return segments[i];

        return countour;
    }
}

export class BodyShape extends BaseBodyShape {
    private left: SidePlane;
    private right: SidePlane;
    private front: SidePlane;
    private back: SidePlane;
    private top: SidePlane;
    private bottom: SidePlane;

    constructor(
        lengthPoints: number, 
        widthPoints: number, 
        heightPoints: number,
        parity: generationParity) {

        super(lengthPoints, widthPoints, heightPoints);

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
            pointsMapper: (l, w) => scale([l - halfLegth, w - halfHeight, width - halfWidth]),
            mode: generationMode.LSymmetrical,
            parity: parity,
            direction: normalsDirection.CW
        });

        this.right = new SidePlane({
            length: lengthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, w - halfHeight, - halfWidth]),
            mode: generationMode.LSymmetrical,
            parity: parity,
            direction: normalsDirection.CCW
        });

        this.front = new SidePlane({
            length: widthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([-halfLegth, w - halfHeight, l - halfWidth]),
            mode: generationMode.LSymmetrical,
            parity: parity,
            direction: normalsDirection.CW
        });

        this.back = new SidePlane({
            length: widthPoints,
            width: heightPoints,
            pointsMapper: (l, w) => scale([length - halfLegth, w - halfHeight, l - halfWidth]),
            mode: generationMode.LSymmetrical,
            parity: parity,
            direction: normalsDirection.CCW
        });

        this.top = new SidePlane({
            length: lengthPoints,
            width: widthPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, height - halfHeight, w - halfWidth]),
            mode: generationMode.LWSymmetrical,
            parity: parity,
            direction: normalsDirection.CCW
        });    

        this.bottom = new SidePlane({
            length: lengthPoints,
            width: widthPoints,
            pointsMapper: (l, w) => scale([l - halfLegth, 0/*height - halfHeight*/, w - halfWidth]),
            mode: generationMode.LWSymmetrical,
            parity: parity,
            direction: normalsDirection.CW
        });  
    }

    public applyContour(
        sidePoints: IPoint2D[],
        contourFrontPoints: IPoint2D[],
        topPoints: IPoint2D[],
        wheels: IWheelModel[],
        frontSegments: IPoint2D[][]
    ) {
        const { lengthPoints, widthPoints, heightPoints } = this;

        const offsetScale = (value: number, offset: number, scale: number) => {
            return (value - offset) * scale + offset;
        }

        const contourQuery = new CountourQuery(contourFrontPoints, frontSegments);
        const frontPoints = (l: number) => {
            return contourQuery.query(l);
        }

        this.left.apply((l, w, p) => {
            const frontScale = frontPoints(l)[widthPoints - 1].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                const wheel = wheels.find(w => Tools.betweenInclusive(p.x, w.center.x - w.arcRadius, w.center.x + w.arcRadius));

                if (wheel) {
                    const wheelHeight = Tools.pythHB(wheel.arcRadius, wheel.center.x - p.x );
                    const y = Math.max(wheel.center.y + wheelHeight, p.y * yScale * frontScale);
                    return {
                        x: p.x,
                        y: y,//p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
                else {
                    return {
                        x: p.x,
                        y: p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
            }]
        });

        this.right.apply((l, w, p) => {
            const frontScale = frontPoints(l)[0].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                const wheel = wheels.find(w => Tools.betweenInclusive(p.x, w.center.x - w.arcRadius, w.center.x + w.arcRadius));

                if (wheel) {
                    const wheelHeight = Tools.pythHB(wheel.arcRadius, wheel.center.x - p.x );
                    const y = Math.max(wheel.center.y + wheelHeight, p.y * yScale * frontScale);
                    return {
                        x: p.x,
                        y: y,//p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
                else {
                    return {
                        x: p.x,
                        y: p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
            }]
        });

        this.top.apply((l, w, p) => {
            const frontScale = frontPoints(l)[w].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p) => {
                const wheel = wheels.find(w => Tools.betweenInclusive(p.x, w.center.x - w.arcRadius, w.center.x + w.arcRadius));

                if (wheel) {
                    const wheelHeight = Tools.pythHB(wheel.arcRadius, wheel.center.x - p.x );

                    const yTop = p.y * yScale * frontScale;
                    const topOffset = p.z === 0 || p.z === widthPoints - 1 ? 0 : 1;

                    const wheelTop = wheel.center.y + wheelHeight + topOffset;

                    const y = Tools.betweenInclusive(p.z, this.halfWidth - wheel.offset + 1, this.halfWidth + wheel.offset - 1)
                        ? yTop
                        : Math.max(yTop, wheelTop);

                    return {
                        x: p.x,
                        y: y,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }         
                }
                else {
                    return {
                        x: p.x,
                        y: p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
            }]
        });

        this.bottom.apply((l, w, p) => {
            const frontScale = frontPoints(l)[w].y / heightPoints;
            const yScale = sidePoints[l].y / heightPoints;
            const zScale = topPoints[l].y / widthPoints;

            p.handlers = [(p, allPoints) => {
                const wheel = wheels.find(w => Tools.betweenInclusive(p.x, w.center.x - w.arcRadius, w.center.x + w.arcRadius));

                if (wheel) {
                    const wheelHeight = Tools.pythHB(wheel.arcRadius, wheel.center.x - p.x );

                    const y = Tools.betweenInclusive(p.z, this.halfWidth - wheel.offset, this.halfWidth + wheel.offset)
                        ? p.y * yScale * frontScale
                        : wheel.center.y + wheelHeight;

                    return {
                        x: p.x,
                        y: y,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }         
                }
                else {
                    return {
                        x: p.x,
                        y: p.y * yScale * frontScale,
                        z: offsetScale(p.z, this.halfWidth, zScale)
                    }
                }
            }]
        });

        this.front.apply((l, w, p) => {
            const frontScale = frontPoints(0)[l].y / heightPoints;
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
            const frontScale = frontPoints(this.top.length - 1)[l].y / heightPoints;
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


    public sectionPoints(
        design: IDesign,
        section: ISectionData): ISectionPoints {
        const { 
            front, top,
            //left, right, 
            //back,  bottom 
        } = this;

        const result : ISectionPoints = {
            front: [],
            side: [],
            top: []
        }

        if (section === null || [section.front, section.side, section.top].every(p => p === null)) return result;

        const transformed = top.transformedVertices(1);

        if (section.front !== null) {
            if (design.frontSegments[section.front]) {
                result.front.push(...design.frontSegments[section.front]);
            }
            else {
                const sourcePoints = Generate
                .range(0, front.length)
                .map(y => transformed[y + (section.front || 0) * front.length])
                ;

                result.front.push(...sourcePoints.map(p => ({ x: p.x, y: p.y })));
            }
        }

        if (section.top !== null) {
            const sourcePoints = Generate
                .range(0, top.length)
                .map(y => transformed[(section.top || 0) + y * top.width])
                ;

            result.top.push(...sourcePoints.map(p => ({ x: p.x, y: p.z })));
        }

        if (section.side !== null) {
            const sourcePoints = Generate
                .range(0, top.length)
                .map(y => transformed[(section.side || 0) + y * top.width])
                ;

            result.side.push(...sourcePoints.map(p => ({ x: p.x, y: p.y })));
        }

        return result;
    }

    public get geometry(): BufferGeometry[] {
        const { left, right, front, back, top, bottom } = this;
      
        const parts: IBodyPart[] = [
            left,
            right,
            front, 
            back, 
            top,
            bottom
        ]
        return parts.map(p => p.geometry(5));
    }
}
