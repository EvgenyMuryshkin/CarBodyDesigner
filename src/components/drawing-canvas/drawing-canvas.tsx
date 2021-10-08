import React from "react";
import { Component } from "react";
import { BufferStream, Generate, IPoint2D } from "../../lib";
import { Tools } from "../../lib/tools";
import { drawingMode, IWheelModel } from "../drawing-model";
import "./drawing-canvas.scss";

export interface IDrawingCanvasProps {
    symmetrical: boolean;
    height: number;
    width: number;
    samples: IPoint2D[];
    maxY: number;
    onChange: (samples: IPoint2D[]) => void;
}

enum wheelDrawingMode {
    Create,
    MoveCenter,
    ChangeRadius
}

interface IProps extends IDrawingCanvasProps{
    mode: drawingMode;
    wheel: IWheelModel | null;
    onWheelChange: (wheel: IWheelModel) => void;
}

interface IState {
    margin: number;
    //width: number;
    //height: number;
    scale: number;
    wheelMode: wheelDrawingMode;
}

export class DrawingCanvas extends Component<IProps, IState> {
    canvas: HTMLCanvasElement | null = null;
    buffer: BufferStream<IPoint2D> | null = null;

    enabled = false;
    lastPoint: IPoint2D | null = null;

    constructor(props: IProps) {
        super(props);

        const scale = Math.min(
            Math.floor(props.width / props.samples.length),
            Math.floor(props.height / props.maxY)
        ) 
        this.state = {
            //width: props.width,
            //height: props.height,
            scale: scale,
            margin: 25,
            wheelMode: wheelDrawingMode.Create
        }

        this.onMouseUp = this.onMouseUp.bind(this);
        this.processPoints = this.processPoints.bind(this);
        this.buffer = new BufferStream<IPoint2D>(50, this.processPoints);
    }

    componentDidMount() {
        document.addEventListener("mouseup", this.onMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener("mouseup", this.onMouseUp);
    }

    mouseDisconnected() {
        this.enabled = false;
        this.lastPoint = null;
        this.setState({
            wheelMode: wheelDrawingMode.Create
        });
    }

    onMouseUp(e: MouseEvent | null) {
        if (!this.enabled) return;

        e?.stopPropagation();
        e?.preventDefault();

        this.mouseDisconnected();
    }

    componentDidUpdate() {
        this.drawSignal();
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        const { samples, maxY } = this.props;
        const { scale, margin } = this.state;
        
        const width = (samples.length - 1) * scale;
        const height = maxY * scale;

        ctx.clearRect(0, 0, width + 2 * margin, height + 2 * margin);

        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(margin, margin + height);
        ctx.lineTo(margin + width, margin + height);
        ctx.stroke();

        ctx.setLineDash([1, 2])

        for (const col of Generate.range(0, samples.length)) {
            ctx.moveTo(margin + col * scale, margin);
            ctx.lineTo(margin + col * scale, margin + height);    
        }

        for (const row of Generate.range(0, maxY)) {
            ctx.moveTo(margin + 0, margin + row * scale);
            ctx.lineTo(margin + width, margin + row * scale);    
        }

        ctx.strokeStyle = "#000000";
        ctx.stroke();
        ctx.setLineDash([]);
    }

    translate(p: IPoint2D | null): IPoint2D {
        const { maxY } = this.props;
        const { scale } = this.state;
        const yAxis = maxY * scale;

        if (!p) return { x: 0, y: 0 };

        return {
            x: Math.floor(p.x),
            y: yAxis - p.y
        };
    }

    samplePoint(idx: number): IPoint2D | null {
        const { samples } = this.props;
        return this.scalePoint(samples[idx]);
    }

    scalePoint(pt: IPoint2D | null) {
        const { scale } = this.state;
        if (!pt) return null;

        return {
            x: pt.x * scale,
            y: pt.y * scale
        }
    }

    drawSignal() {
        const { canvas } = this;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        this.drawGrid(ctx);

        const { samples } = this.props;
        const { margin } = this.state;

        ctx.lineWidth = 3;
        ctx.imageSmoothingEnabled = true;

        ctx.beginPath();

        for (let i = 0; i < samples.length - 1; i++) {
            const from = this.translate(this.samplePoint(i));
            const to = this.translate(this.samplePoint(i + 1));

            ctx.moveTo(margin + from.x, margin + from.y);
            ctx.lineTo(margin + to.x, margin + to.y);
        }

        ctx.stroke();

        const { wheel } = this.props;
        const { scale } = this.state;
        if (wheel) {
            const center = this.translate(this.scalePoint(wheel.center));
            const wheelArcFrontFrom = this.translate(this.scalePoint({ x: wheel.center.x - wheel.wheelRadius, y: wheel.center.y }));
            const wheelArcFrontTo = this.translate(this.scalePoint({ x: wheel.center.x - wheel.wheelRadius, y: 0 }));

            const wheelArcBackFrom = this.translate(this.scalePoint({ x: wheel.center.x + wheel.wheelRadius, y: wheel.center.y }));
            const wheelArcBackTo = this.translate(this.scalePoint({ x: wheel.center.x + wheel.wheelRadius, y: 0 }));

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
                margin + wheelArcFrontFrom.x, 
                margin + wheelArcFrontFrom.y,
                5,
                0,
                2 * Math.PI,
            )
            ctx.fill();
        }
    }

    lerp(samples: IPoint2D[], from: IPoint2D, to: IPoint2D) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const delta = dy / dx;

        Generate
        .inclusive(from.x, to.x)
        .forEach((i, idx) => {
            samples[i].y = from.y + idx * delta;
        })
    }

    reflect(pt: IPoint2D): IPoint2D {
        const { samples } = this.props;
        const halfIndex = (samples.length - 1) / 2;

        return {
            x: 2 * halfIndex - pt.x,
            y: pt.y
        }
    }

    processPoints(points: IPoint2D[]) {
        const { symmetrical, onChange } = this.props;
        const samples = [...this.props.samples];

        const halfIndex = (samples.length - 1) / 2;

        for (const pt of points) {
            const { lastPoint } = this;
            if (lastPoint && pt.x !== lastPoint.x) {
                if (symmetrical) {
                    if (Tools.between(halfIndex, lastPoint.x, pt.x)) {
                        // do nothing here
                        console.log("skipped", halfIndex, lastPoint.x, pt.x);

                        //this.lerp(samples, lastPoint, pt);
                        //this.lerp(samples, this.reflect(pt), this.reflect(lastPoint));
                    }
                    else {
                        this.lerp(samples, lastPoint, pt);
                        this.lerp(samples, this.reflect(pt), this.reflect(lastPoint));
                    }
                }
                else {
                    this.lerp(samples, lastPoint, pt);
                }                
            }
            else {
                if (symmetrical) {
                    samples[pt.x].y = pt.y;
                    samples[this.reflect(pt).x].y = pt.y;
                }
                else {
                    samples[pt.x].y = pt.y;
                }
            }

            this.lastPoint = pt;
        }

        this.drawSignal();
        onChange(samples);
    }

    setPosition(e: React.MouseEvent<HTMLCanvasElement>) {
        const { samples, maxY, mode } = this.props;
        const { scale, margin, wheelMode } = this.state;
        if (!this.canvas) return;
        e.stopPropagation();
        e.preventDefault();

        var rect = this.canvas.getBoundingClientRect();
        const pt = this.translate({ 
            x: e.clientX - rect.left - margin, 
            y: e.clientY - rect.top - margin 
        });
        
        pt.x = Tools.withinRange(Math.round(pt.x / scale), 0, samples.length - 1);
        pt.y = Tools.withinRange(pt.y / scale, 0, maxY);

        switch (mode) {
            case drawingMode.Contour: this.buffer?.next(pt); break;
            case drawingMode.Wheel: {
                const { wheel, onWheelChange } = this.props;

                const distToCenter = wheel ? Math.sqrt(
                    Math.pow(pt.x - wheel.center.x, 2) + 
                    Math.pow(pt.y - wheel.center.y, 2),
                ) : 0;

                const distToRadiusHandler = wheel ? Math.sqrt(
                    Math.pow(pt.x - (wheel.center.x - wheel.wheelRadius), 2) + 
                    Math.pow(pt.y - wheel.center.y, 2),
                ) : 0;

                if (wheel) {
                    pt.x = Tools.withinRange(pt.x, wheel.wheelRadius, samples.length - 1 - wheel.wheelRadius); 
                    pt.y = Tools.withinRange(pt.y, 0, maxY - wheel.wheelRadius); 
                }

                switch (wheelMode) {
                    case wheelDrawingMode.MoveCenter: {
                        if (wheel) {
                            onWheelChange({
                                center: pt,
                                arcRadius: wheel.arcRadius,
                                wheelRadius: wheel.wheelRadius
                            });
                        }
                    } break;
                    case wheelDrawingMode.ChangeRadius: {
                        if (wheel) {
                            onWheelChange({
                                center: wheel.center,
                                arcRadius: distToCenter,
                                wheelRadius: distToCenter
                            });
                        }
                    } break;
                    case wheelDrawingMode.Create: {
                        if (wheel && distToCenter < 3) {
                            this.setState({
                                wheelMode: wheelDrawingMode.MoveCenter
                            })
                        }
                        else if (wheel && distToRadiusHandler < 3) {
                            this.setState({
                                wheelMode: wheelDrawingMode.ChangeRadius
                            }) 
                        }
                        else {
                            this.setState({
                                wheelMode: wheelDrawingMode.ChangeRadius,
                            }, () => {
                                onWheelChange({
                                    center: pt,
                                    arcRadius: 0,
                                    wheelRadius: 0
                                });
                            })
                        }
                    } break;
                }
            } break;
        }
    }

    render() {
        const { samples, maxY } = this.props;
        const { scale, margin } = this.state;
        const width = samples.length * scale;
        const height = maxY * scale;

        return (
            <div>
                <div>
                    <canvas
                        width={width + 2 * margin}
                        height={height + 2 * margin}
                        className="drawing-canvas"
                        onDoubleClick={e => {
                            e.stopPropagation();
                            e.preventDefault();         
                        }}
                        onContextMenu={e => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        onPointerEnter={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onPointerLeave={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.mouseDisconnected();
                        }}
                        onPointerDown={e => {
                            if (e.buttons !== 1) return;

                            this.enabled = true;
                            this.lastPoint = null;
                            this.setPosition(e);

                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onPointerUp={e => {
                            this.mouseDisconnected();
 
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onPointerMove={e => {
                            if (!this.enabled) return;
                            this.setPosition(e);

                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onPointerCancel={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                            if (e.buttons !== 1) return;
                            this.enabled = true;
                            this.lastPoint = null;
                            this.setPosition(e);
                            e.preventDefault();
                            e.stopPropagation(); 
                        }}
                        onMouseMove={(e) => {
                            if (!this.enabled) return;
                            this.setPosition(e);
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onMouseUp={e => {
                            this.mouseDisconnected();
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        ref={(r) => {
                            this.canvas = r;
                            this.drawSignal();
                        }}
                    />                
                </div>
            </div>
        );
    }
}