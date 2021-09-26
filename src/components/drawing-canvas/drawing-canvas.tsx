import React from "react";
import { Component } from "react";
import { BufferStream, Generate, IPoint2D } from "../../lib";
import { Tools } from "../../lib/tools";
import "./drawing-canvas.scss";

interface IProps {
    height: number;
    width: number;
    samples: IPoint2D[];
    maxY: number;
    onChange: (samples: IPoint2D[]) => void;
}

interface IState {
    margin: number;
    //width: number;
    //height: number;
    scale: number;
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
            margin: 15
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
        this.forceUpdate();
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

    translate(p: IPoint2D, toCanvas: boolean) {
        const { maxY } = this.props;
        const { margin, scale } = this.state;
        const yAxis = maxY * scale;
/*
        if (toCanvas) {
            return {
                x: margin + Math.floor(p.x),
                y: -margin + yAxis - p.y
            };
        }
        else {
            return {
                x: -margin + Math.floor(p.x),
                y: margin + yAxis - p.y
            };
        }
*/
        return {
            x: Math.floor(p.x),
            y: yAxis - p.y
        };
    }

    samplePoint(idx: number): IPoint2D {
        const { samples } = this.props;
        const { scale } = this.state;

        return {
            x: samples[idx].x * scale,
            y: samples[idx].y * scale
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
            const from = this.translate(this.samplePoint(i), true);
            const to = this.translate(this.samplePoint(i + 1), true);

            ctx.moveTo(margin + from.x, margin + from.y);
            ctx.lineTo(margin + to.x, margin + to.y);
        }

        ctx.stroke();
    }

    processPoints(points: IPoint2D[]) {
        const { onChange } = this.props;
        const samples = [...this.props.samples];

        for (const pt of points) {
            const { lastPoint } = this;
            if (lastPoint && pt.x !== lastPoint.x) {
                const dx = pt.x - lastPoint.x;
                const dy = pt.y - lastPoint.y;

                const delta = dy / dx;

                Generate
                    .inclusive(lastPoint.x, pt.x)
                    .forEach((i, idx) => {
                        samples[i].y = lastPoint.y + idx * delta;
                    })

            }
            else {
                samples[pt.x].y = pt.y;
            }

            this.lastPoint = pt;
        }

        this.drawSignal();
        onChange(samples);
    }

    setPosition(e: React.MouseEvent<HTMLCanvasElement>) {
        const { samples, maxY } = this.props;
        const { scale, margin } = this.state;
        if (!this.canvas) return;
        e.stopPropagation();
        e.preventDefault();

        var rect = this.canvas.getBoundingClientRect();
        const pt = this.translate({ 
            x: e.clientX - rect.left - margin, 
            y: e.clientY - rect.top - margin 
        }, false);
        
        pt.x = Tools.between(Math.round(pt.x / scale), 0, samples.length - 1);
        pt.y = Tools.between(pt.y / scale, 0, maxY - 1);

        this.buffer?.next(pt);
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
                        onMouseDown={(e) => {
                            if (e.buttons != 1) return;
                            this.enabled = true;
                            this.lastPoint = null;
                            this.setPosition(e);
                        }}
                        onMouseMove={(e) => {
                            if (!this.enabled) return;
                            console.log("moving");
                            this.setPosition(e);
                        }}
                        onMouseUp={e => {
                            console.log("up");

                            e.stopPropagation();
                            e.preventDefault();
                            this.mouseDisconnected();
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