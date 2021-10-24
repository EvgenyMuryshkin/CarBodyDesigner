import { IPoint2D } from "../../lib";
import { IWheelModel } from "../drawing-model";

export class DrawingWheels {
    constructor(
        private margin: number, 
        private scale: number,
        private toCtx: (p: IPoint2D) => IPoint2D) {

    }

    drawWheelSide(ctx: CanvasRenderingContext2D, wheel: IWheelModel) {
        const { margin, scale, toCtx } = this;

        const center = toCtx(wheel.center);
        const wheelArcFrontFrom = toCtx({ x: wheel.center.x - wheel.wheelRadius, y: wheel.center.y });
        const wheelArcFrontTo = toCtx({ x: wheel.center.x - wheel.wheelRadius, y: 0 });

        const wheelArcBackFrom = toCtx({ x: wheel.center.x + wheel.wheelRadius, y: wheel.center.y });
        const wheelArcBackTo = toCtx({ x: wheel.center.x + wheel.wheelRadius, y: 0 });

        const wheelRadiusHandle = toCtx({ x: wheel.center.x, y: wheel.center.y + wheel.wheelRadius });

        ctx.beginPath();
        ctx.arc(
            margin + center.x, 
            margin + center.y,
            wheel.wheelRadius * scale,
            Math.PI, 
            2 * Math.PI
        );

        ctx.moveTo(margin + wheelArcFrontFrom.x, margin + wheelArcFrontFrom.y);
        ctx.lineTo(margin + wheelArcFrontTo.x, margin + wheelArcFrontTo.y);

        ctx.moveTo(margin + wheelArcBackFrom.x, margin + wheelArcBackFrom.y);
        ctx.lineTo(margin + wheelArcBackTo.x, margin + wheelArcBackTo.y);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
            margin + center.x, 
            margin + center.y,
            5,
            0,
            2 * Math.PI,
        )

        ctx.arc(
            margin + wheelRadiusHandle.x, 
            margin + wheelRadiusHandle.y,
            5,
            0,
            2 * Math.PI,
        )
        ctx.fill();
    }

    drawWheelTop(ctx: CanvasRenderingContext2D, wheel: IWheelModel) {
        const { margin, toCtx } = this;

        const innerCenter = toCtx({
            x: wheel.center.x,
            y: 2 * wheel.offset
        });
        const outerCenter = toCtx({
            x: wheel.center.x,
            y: 2 * (wheel.offset + wheel.width)
        });        

        const wheelContour: IPoint2D[] = [
            {
                x: wheel.center.x - wheel.wheelRadius,
                y: 2 * wheel.offset
            },
            {
                x: wheel.center.x + wheel.wheelRadius,
                y: 2 * wheel.offset
            },
            {
                x: wheel.center.x + wheel.wheelRadius,
                y: 2 * (wheel.offset + wheel.width)
            },
            {
                x: wheel.center.x - wheel.wheelRadius,
                y: 2 * (wheel.offset + wheel.width)
            },
        ];

        const mappedWheelCountour = wheelContour.map(toCtx);
 
        ctx.beginPath();
        ctx.moveTo(margin + mappedWheelCountour[3].x, margin + mappedWheelCountour[3].y);
        mappedWheelCountour.forEach((p, idx) => {
            ctx.lineTo(margin + p.x, margin + p.y);
        })
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
            margin + innerCenter.x, 
            margin + innerCenter.y,
            5,
            0,
            2 * Math.PI,
        )

        ctx.arc(
            margin + outerCenter.x, 
            margin + outerCenter.y,
            5,
            0,
            2 * Math.PI,
        )
        ctx.fill();
    }
}