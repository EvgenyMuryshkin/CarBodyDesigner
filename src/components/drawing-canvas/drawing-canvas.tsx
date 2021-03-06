import React from "react";
import { Component } from "react";
import { IDesign } from "../../DesignStore";
import { DesignTools } from "../../DesignTools";
import { BufferStream, Generate, IPoint2D } from "../../lib";
import { Tools } from "../../lib/tools";
import { drawingMode, IWheelModel, sectionEditorMode, wheelDrawingType } from "../drawing-model";
import "./drawing-canvas.scss";
import { DrawingWheels } from "./drawing-wheels";

export interface IDrawingCanvasProps {
    id: string;
    symmetrical: boolean;
    height: number;
    width: number;
    maxY: number;
    contour: IPoint2D[];
    section: IPoint2D[] | null;
    sectionBaseline: IPoint2D[] | null;
    wheelDrawing: wheelDrawingType;
    wheels: IWheelModel[] | null;
    onCountourChange: (samples: IPoint2D[], wheels: IWheelModel[] | null) => void;
    onSectionSelected: (showSectionSelector: boolean, section: number) => void;
    onSectionChanged: (sections: number[], points: IPoint2D[] | null) => void;
    sections: number;
    design: IDesign;
    sectionMode: sectionEditorMode;
}

enum wheelDrawingMode {
    Create,
    MoveCenter,
    ChangeRadius,
    ChangeWidth,
    ChangeOffset
}

interface IWheelData {
    wheel: IWheelModel | null;
    wheelIndex: number;
    distToCenter: number;
    distToRadiusHandler: number;
    distToOffsetHandler: number;
    distToWidthHandler: number;
}

interface IProps extends IDrawingCanvasProps {
    mode: drawingMode;
    showSectionSelector: boolean;
    sectionIndex: number;
}

interface IState {
    margin: number;
    sectionSelectorHeight: number;
    //width: number;
    //height: number;
    scale: number;
    wheelMode: wheelDrawingMode;
    wheelIndex: number;
}

export class DrawingCanvas extends Component<IProps, IState> {
    canvas: HTMLCanvasElement | null = null;
    sectionCanvas: HTMLCanvasElement | null = null;

    buffer: BufferStream<IPoint2D> | null = null;

    enabled = false;
    lastPoint: IPoint2D | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            scale: 0,
            margin: 25,
            sectionSelectorHeight: 80,
            wheelMode: wheelDrawingMode.Create,
            wheelIndex: -1
        }

        this.onMouseUp = this.onMouseUp.bind(this);
        this.processPoints = this.processPoints.bind(this);
        this.buffer = new BufferStream<IPoint2D>(50, this.processPoints);
    }

    componentDidMount() {
        document.addEventListener("mouseup", this.onMouseUp);
        this.updateScale();
    }

    componentWillUnmount() {
        document.removeEventListener("mouseup", this.onMouseUp);
    }

    updateScale() {
        const { width, height, contour, maxY} = this.props;
        const { sectionSelectorHeight, scale: currentScale, margin } = this.state;

        const scale = Math.min(
            Math.floor((width - 2 * margin - 20) / contour.length),
            Math.floor((height - 2 * margin - sectionSelectorHeight) / maxY)
        );

        if (currentScale !== scale) {
            this.setState({
                scale
            })
        }
    }

    get currentSamples(): IPoint2D[] {
        const { contour, section, sectionBaseline, showSectionSelector } = this.props;

        const sectionPoints = section || sectionBaseline;
        const source = 
            showSectionSelector && sectionPoints
            ? sectionPoints
            : contour;
        
        return source.map(s => ({ ...s }));
    }

    set currentSamples(newData: IPoint2D[]) {
        const { wheels, showSectionSelector, sectionIndex, onCountourChange, onSectionChanged } = this.props;

        if (showSectionSelector) {
            onSectionChanged([sectionIndex], newData);
        }
        else {
            onCountourChange(newData, wheels);
        }
    }

    mouseDisconnected() {
        this.enabled = false;
        this.lastPoint = null;
        this.setState({
            wheelMode: wheelDrawingMode.Create,
            wheelIndex: -1
        }, () => {
            const { contour, wheels, onCountourChange } = this.props;
            if (wheels) {
                const validWheels = wheels.filter(w => w.arcRadius > 2);
                onCountourChange(contour, validWheels);     
            }
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
        this.updateScale();
    }

    get width() {
        const { contour } = this.props;
        const { scale } = this.state;
        
        return (contour.length - 1) * scale;
    }

    get height() {
        const { maxY } = this.props;
        const { scale } = this.state;

        return maxY * scale;
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        const { contour, maxY } = this.props;
        const { scale, margin } = this.state;
        
        const width = (contour.length - 1) * scale;
        const height = maxY * scale;

        ctx.clearRect(0, 0, width + 2 * margin, height + 2 * margin);

        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(margin, margin + height);
        ctx.lineTo(margin + width, margin + height);
        ctx.stroke();

        ctx.setLineDash([1, 2])

        for (const col of Generate.range(0, contour.length)) {
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

    samplePoint(points: IPoint2D[], idx: number): IPoint2D | null {
        return this.scalePoint(points[idx]);
    }

    scalePoint(pt: IPoint2D | null) {
        const { scale } = this.state;
        if (!pt) return null;

        return {
            x: pt.x * scale,
            y: pt.y * scale
        }
    }

    drawWheels(ctx: CanvasRenderingContext2D) {
        const { wheels, wheelDrawing } = this.props;
        const { margin, scale } = this.state;

        const drawingWheels = new DrawingWheels(margin, scale, (p) => this.translate(this.scalePoint(p)));

        for (const wheel of wheels || []) {
            switch (wheelDrawing) {
                case wheelDrawingType.None: break;
                case wheelDrawingType.Side: drawingWheels.drawWheelSide(ctx, wheel); break;
                case wheelDrawingType.Top: drawingWheels.drawWheelTop(ctx, wheel); break;
            }
        }
    }

    drawPoints(ctx: CanvasRenderingContext2D, points: IPoint2D[], color: string) {
        const { margin } = this.state;

        const currentStyle = ctx.strokeStyle;
        ctx.lineWidth = 3;
        ctx.imageSmoothingEnabled = true;
        ctx.strokeStyle = color;

        ctx.beginPath();

        for (let i = 0; i < points.length - 1; i++) {
            const from = this.translate(this.samplePoint(points, i));
            const to = this.translate(this.samplePoint(points, i + 1));

            ctx.moveTo(margin + from.x, margin + from.y);
            ctx.lineTo(margin + to.x, margin + to.y);
        }

        ctx.stroke();
        ctx.strokeStyle = currentStyle;
    }

    drawSections(ctx: CanvasRenderingContext2D) {
        const { margin } = this.state;
        const { design, sectionMode, showSectionSelector } = this.props;
    
        if (!showSectionSelector || sectionMode !== sectionEditorMode.Pick) return;
        const designTools = new DesignTools(design);
        const existingIndexes = designTools.existingIndexes;

        ctx.beginPath();

        for (const idx of existingIndexes) {
            const from = this.translate(this.scalePoint({ x: idx, y: 0 }));
            const to = this.translate(this.scalePoint({x: idx, y: this.height}));

            ctx.moveTo(margin + from.x, margin + from.y);
            ctx.lineTo(margin + to.x, margin + to.y);
        }

        ctx.stroke();
    }

    drawSignal() {
        const { canvas } = this;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        this.drawGrid(ctx);

        const { contour, section, sectionBaseline, showSectionSelector, sectionMode } = this.props;

        if (showSectionSelector && sectionMode === sectionEditorMode.Edit) {            
            if (sectionBaseline)
                this.drawPoints(ctx, sectionBaseline, "gray");

            if (section)
                this.drawPoints(ctx, section, "black");
        }
        else {
            this.drawPoints(ctx, contour, "black");
        }


        this.drawWheels(ctx);
        this.drawSections(ctx);
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
        const samples = this.currentSamples;
        const halfIndex = (samples.length - 1) / 2;

        return {
            x: 2 * halfIndex - pt.x,
            y: pt.y
        }
    }

    processPoints(points: IPoint2D[]) {
        const { symmetrical, showSectionSelector, sectionMode, onSectionSelected } = this.props;

        if (showSectionSelector && sectionMode === sectionEditorMode.Pick) {
            onSectionSelected(showSectionSelector, points[points.length - 1].x);
            return;
        }
        
        const samples = this.currentSamples;

        const halfIndex = (samples.length - 1) / 2;

        for (const pt of points) {
            const { lastPoint } = this;
            if (lastPoint && pt.x !== lastPoint.x) {
                if (symmetrical) {
                    if (Tools.between(halfIndex, lastPoint.x, pt.x)) {
                        // do nothing here
                        // console.log("skipped", halfIndex, lastPoint.x, pt.x);

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

        this.currentSamples = samples;
    }

    onWheelChange(wheel: IWheelModel, wheelIndex: number) {
        const { contour, wheels, onCountourChange } = this.props;
        if (!wheels ) return;

        if (wheelIndex === -1) {
            this.setState({
                wheelIndex: wheels.length
            }, () => {
                onCountourChange(contour, [...wheels, wheel])
            })
        }
        else {
            this.setState({
                wheelIndex: wheelIndex
            }, () => {
                onCountourChange(contour, wheels.map((w, idx) => idx === wheelIndex ? wheel : w))
            })
        }
    }

    wheelDataFromPoint(pt: IPoint2D, wheel: IWheelModel): IWheelData {
        const { wheels } = this.props;

        const distToCenter = Math.sqrt(
            Math.pow(pt.x - wheel.center.x, 2) + 
            Math.pow(pt.y - wheel.center.y, 2),
        );

        const distToRadiusHandler = Math.sqrt(
            Math.pow(pt.x - wheel.center.x, 2) + 
            Math.pow(pt.y - (wheel.center.y + wheel.wheelRadius), 2),
        );

        const distToOffsetHandler = Tools.pythBP(pt.x - wheel.center.x, pt.y - 2 * wheel.offset);
        const distToWidthHandler = Tools.pythBP(pt.x - wheel.center.x, pt.y - 2 * (wheel.offset + wheel.width ));

        return {
            wheel,
            wheelIndex: (wheels || []).indexOf(wheel),
            distToCenter,
            distToRadiusHandler,
            distToOffsetHandler,
            distToWidthHandler
        }
    }

    wheelIndexFromPoint(pt: IPoint2D): IWheelData {
        const { wheels } = this.props;
        const { wheelIndex } = this.state;

        if (wheels && wheels[wheelIndex]) return this.wheelDataFromPoint(pt, wheels[wheelIndex]);

        for (const wheel of wheels || []) {
            const wheelData = this.wheelDataFromPoint(pt, wheel);

            const distances = [
                wheelData.distToCenter,
                wheelData.distToRadiusHandler,
                wheelData.distToOffsetHandler,
                wheelData.distToWidthHandler
            ]

            if (distances.some(d => d < 2)) {
                return wheelData;
            }
        }

        return {
            wheel: null,
            wheelIndex: -1,
            distToCenter: 0,
            distToRadiusHandler: 0,
            distToOffsetHandler: 0,
            distToWidthHandler: 0
        }
    };

    fromCanvasCoordinates(canvas: HTMLCanvasElement | null, e: React.MouseEvent<HTMLCanvasElement>): IPoint2D {
        const { contour, maxY } = this.props;
        const { scale, margin } = this.state;

        if (!canvas) return { x: 0, y: 0 };

        var rect = canvas.getBoundingClientRect();
        const pt = this.translate({ 
            x: e.clientX - rect.left - margin, 
            y: 0
        });

        pt.x = Tools.withinRange(Math.round(pt.x / scale), 0, contour.length - 1);
        pt.y = Tools.withinRange(pt.y / scale, 0, maxY);

        return pt;
    }

    setPosition(e: React.MouseEvent<HTMLCanvasElement>) {
        const { contour, maxY, mode, wheelDrawing } = this.props;
        const { scale, margin, wheelMode } = this.state;
        if (!this.canvas) return;
        e.stopPropagation();
        e.preventDefault();

        var rect = this.canvas.getBoundingClientRect();
        const pt = this.translate({ 
            x: e.clientX - rect.left - margin, 
            y: e.clientY - rect.top - margin 
        });
        
        pt.x = Tools.withinRange(Math.round(pt.x / scale), 0, contour.length - 1);
        pt.y = Tools.withinRange(pt.y / scale, 0, maxY);

        const wheelData = this.wheelIndexFromPoint(pt);

        const { wheel, wheelIndex, distToCenter, distToRadiusHandler, distToOffsetHandler, distToWidthHandler } = wheelData;

        if (mode === drawingMode.Contour/* && !wheel*/) {
            this.buffer?.next(pt);
            return;
        }
        else if (mode === drawingMode.Wheel || (mode === drawingMode.Contour && wheel)) {
            const { wheels } = this.props;

            if (!wheels) return;

            if (wheel) {
                switch (wheelDrawing) {
                    case wheelDrawingType.Side:
                        pt.x = Tools.withinRange(pt.x, wheel.wheelRadius, contour.length - 1 - wheel.wheelRadius); 
                        pt.y = Tools.withinRange(pt.y, 0, maxY - wheel.wheelRadius); 
                        break;
                    case wheelDrawingType.Top:
                        pt.x = Tools.withinRange(pt.x, wheel.wheelRadius, contour.length - 1 - wheel.wheelRadius); 
                        pt.y = Tools.withinRange(pt.y, 0, maxY); 
                        break;
                }
            }

            switch (wheelMode) {
                // eslint-disable-next-line
                case wheelDrawingMode.MoveCenter: {
                    if (wheel) {
                        this.onWheelChange({
                            ...wheel,
                            center: pt,
                        }, wheelIndex);
                    }
                } break;
                // eslint-disable-next-line
                case wheelDrawingMode.ChangeRadius: {
                    if (wheel) {
                        this.onWheelChange({
                            ...wheel,
                            arcRadius: distToCenter,
                            wheelRadius: distToCenter
                        }, wheelIndex);
                    }
                } break;
                // eslint-disable-next-line
                case wheelDrawingMode.ChangeOffset: {
                    if (wheel) {
                        this.onWheelChange({
                            ...wheel,
                            offset: pt.y / 2
                        }, wheelIndex);
                    }
                } break;
                // eslint-disable-next-line
                case wheelDrawingMode.ChangeWidth: {
                    if (wheel) {
                        this.onWheelChange({
                            ...wheel,
                            width: (pt.y / 2) - wheel.offset
                        }, wheelIndex);
                    }
                } break;
                // eslint-disable-next-line
                case wheelDrawingMode.Create: {
                    switch (wheelDrawing) {
                        // eslint-disable-next-line
                        case wheelDrawingType.Side: {
                            if (wheel) {
                                if (distToCenter < 2) {
                                    this.setState({
                                        wheelMode: wheelDrawingMode.MoveCenter
                                    });
                                    return;
                                }
                                else if (distToRadiusHandler < 3) {
                                    this.setState({
                                        wheelMode: wheelDrawingMode.ChangeRadius
                                    });
                                    return;
                                }
                            }
                        } break;
                        // eslint-disable-next-line
                        case wheelDrawingType.Top: {
                            if (wheel) {
                                if (distToOffsetHandler < 2) {
                                    this.setState({
                                        wheelMode: wheelDrawingMode.ChangeOffset
                                    });
                                    return;
                                }
                                else if (distToWidthHandler < 3) {
                                    this.setState({
                                        wheelMode: wheelDrawingMode.ChangeWidth
                                    });
                                    return;
                                }
                            }
                        } break;
                    }

                    this.setState({
                        wheelMode: wheelDrawingMode.ChangeRadius,
                    }, () => {
                        this.onWheelChange({
                            center: pt,
                            arcRadius: 0,
                            wheelRadius: 0,
                            offset: 10,
                            width: 10
                        }, wheelIndex);
                    });
                } break;
            }
        }
    }

    renderSectionSelector() {
        const { sectionMode, onSectionChanged, onSectionSelected, sections, sectionIndex, showSectionSelector } = this.props;

        if (sectionMode !== sectionEditorMode.Edit) return null;
        if (!onSectionChanged) return null;
        if (!showSectionSelector) return null;

        const sectionSelected = (section: number) => {
            onSectionSelected(showSectionSelector, section)
        }

        const max = sections - 1;
        return (
            <div className="section-selector">
                <input type="range" min={0} max={max} value={sectionIndex} onChange={e => sectionSelected(parseInt(e.target.value))}/>
                <input type="number" value={sectionIndex} min={0} max={max} onChange={e => sectionSelected(parseInt(e.target.value))}/>
            </div>
        );
    }

    render() {
        const { contour, maxY } = this.props;
        const { scale, margin } = this.state;
        if (!scale) return null;

        const width = contour.length * scale  + 2 * margin;
        const height = maxY * scale  + 2 * margin;

        return (
            <div>
                <div>
                    {this.renderSectionSelector()}
                    <canvas
                        width={width}
                        height={height}
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