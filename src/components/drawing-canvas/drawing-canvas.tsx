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
    width: number;
    height: number;
    xScale: number;
    yScale: number;
}

export class DrawingCanvas extends Component<IProps, IState> {
    canvas: HTMLCanvasElement | null = null;
    buffer: BufferStream<IPoint2D> | null = null;

    enabled = false;
    lastPoint: IPoint2D | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            width: props.width,
            height: props.height,
            xScale: Math.floor(props.width / props.samples.length),
            yScale: Math.floor(props.height / props.maxY)
        }

        this.onMouseUp = this.onMouseUp.bind(this);
        this.processPoints = this.processPoints.bind(this);
        this.buffer = new BufferStream<IPoint2D>(50, this.processPoints);
    }

    componentDidMount() {
        document.addEventListener("mouseup", this.onMouseUp);

        console.log(this.props.width, this.props.samples.length);
        console.log(this.props.height, this.props.maxY);
        console.log(this.state.xScale, this.state.yScale);
    }

    componentWillUnmount() {
        document.removeEventListener("mouseup", this.onMouseUp);
    }

    onMouseUp(e: Event) {
        if (!this.enabled) return;

        e.stopPropagation();
        e.preventDefault();
        this.enabled = false;
        this.lastPoint = null;
    }

    componentDidUpdate() {
        this.drawSignal();
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        const { samples, maxY } = this.props;
        const { width, height, xScale, yScale } = this.state;
        ctx.clearRect(0, 0, width, height);

        ctx.setLineDash([1, 2])
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);

        for (const col of Generate.range(0, samples.length )) {
            ctx.moveTo(col * xScale, 0);
            ctx.lineTo(col * xScale, height);    
        }

        for (const row of Generate.range(0, maxY)) {
            ctx.moveTo(0, row * yScale);
            ctx.lineTo(width, row * yScale);    
        }

        ctx.strokeStyle = "#000000";
        ctx.stroke();
        ctx.setLineDash([]);
    }

    translate(p: IPoint2D) {
        const { width, height, xScale } = this.state;

        const yAxis = height;

        return {
            x: Math.floor(p.x),
            y: yAxis - p.y
        };
    }

    samplePoint(idx: number): IPoint2D {
        const { samples } = this.props;
        const { xScale, yScale } = this.state;

        return {
            x: samples[idx].x * xScale,
            y: samples[idx].y * yScale
        }
    }

    drawSignal() {
        const { canvas } = this;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        this.drawGrid(ctx);

        const { samples } = this.props;
        const { xScale, yScale } = this.state;

        ctx.lineWidth = 3;
        ctx.imageSmoothingEnabled = true;

        ctx.beginPath();

        for (let i = 0; i < samples.length - 1; i++) {
            const from = this.translate(this.samplePoint(i));
            const to = this.translate(this.samplePoint(i + 1));

            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
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

                Generate
                    .inclusive(lastPoint.x, pt.x)
                    .forEach((i, idx) => {
                        samples[i].y = lastPoint.y + idx * dy / dx;
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
        const { height, width, xScale, yScale } = this.state;
        if (!this.canvas) return;
        e.stopPropagation();
        e.preventDefault();

        var rect = this.canvas.getBoundingClientRect();
        const pt = this.translate({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
        
        pt.x = Tools.between(Math.round(pt.x / xScale), 0, samples.length - 1);
        pt.y = Tools.between(Math.round(pt.y / yScale), 0, maxY);

        this.buffer?.next(pt);
    }

    render() {
        const { width, height, xScale, yScale } = this.state;

        return (
            <canvas
                width={width}
                height={height}
                className="drawing-canvas"
                onMouseDown={(e) => {
                    if (e.buttons != 1) return;
                    this.enabled = true;
                    this.setPosition(e);
                }}
                onMouseMove={(e) => {
                    if (!this.enabled) return;
                    this.setPosition(e);
                }}
                ref={(r) => {
                    this.canvas = r;
                    this.drawSignal();
                }}
            />
        );
    }
}