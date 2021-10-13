import * as React from "react"
import { IPoint2D } from "../../lib";
import { DrawingCanvas, IDrawingCanvasProps } from "../drawing-canvas/drawing-canvas";
import { drawingMode } from "../drawing-model";
import { Icon, IconSeparator, IIconProps } from "../icon/icon";
import { Dialogs } from "../modal/modal";
import { ModalSideEditor } from "./modal-side-editor";
import "./side-editor.scss";

export interface ISideEditorProps extends IDrawingCanvasProps {
    title: string;
}

interface IState {
    mode: drawingMode;
    currentSection: number | null;
}

export class SideEditor extends React.Component<ISideEditorProps, IState> {
    constructor(props: ISideEditorProps) {
        super(props);
        this.state = {
            mode: drawingMode.Contour,
            currentSection: null
        }
    }

    moveUp() {
        const { maxY, wheels, onChange } = this.props;
        const samples = [...this.props.samples];
        if (samples.some(s => s.y > maxY - 1)) return;
        samples.forEach(s => s.y++);
        onChange(samples, wheels);
    }

    moveDown() {
        const { wheels, onChange } = this.props;
        const samples = [...this.props.samples];
        if (samples.some(s => s.y < 1)) return;
        samples.forEach(s => s.y--);
        onChange(samples, wheels);
    }
    
    allUp() {
        const { maxY, wheels, onChange } = this.props;
        const samples = [...this.props.samples];
        samples.forEach(s => s.y = maxY);
        onChange(samples, wheels);

    }

    allDown() {
        const { wheels, onChange } = this.props;
        const samples = [...this.props.samples];
        samples.forEach(s => s.y = 0);
        onChange(samples, wheels);
    }

    async fullscreenEdit() {
        const { title, samples, wheels, onChange } = this.props;
        let newSamples = samples;
        let newWheels = wheels;

        if (await Dialogs.Modal({
            title: title,
            body: <ModalSideEditor {...this.props} onChange={(s, w) => {
                newSamples = s;
                newWheels = w;
            }}/>,
            buttonsFactory: Dialogs.OKCancelButtons
        })) {
            onChange(newSamples, newWheels);
        }
    }

    smooth() {
        const { onChange, samples, wheels } = this.props;
        const newSamples = samples
        .map((s, idx): IPoint2D => {
            if (idx === 0 || idx === samples.length - 1) return s;
            return {
                x: s.x,
                y: (samples[idx-1].y + samples[idx].y + samples[idx + 1].y) / 3
            }
        });
        onChange(newSamples, wheels);
    }

    renderMenu() {
        const { wheels } = this.props;
        const { mode } = this.state;
        const iconParams: Partial<IIconProps> = {
            bordered: true,
            size: "small"
        }
        
        return (
            <div className="menu menu-top">
                <Icon type="AiOutlineFullscreen" title="Fullscreen edit" {...iconParams} onClick={async () => await this.fullscreenEdit()}/>
                <IconSeparator {...iconParams}/>
                <Icon type="ImPencil2" title="Draw countour" {...iconParams} selected={mode === drawingMode.Contour} onClick={() => this.setState({ mode: drawingMode.Contour })}/>   
                {wheels && <Icon type="GiCartwheel" title="Draw wheel" {...iconParams} selected={mode === drawingMode.Wheel} onClick={() => this.setState({ mode: drawingMode.Wheel })}/>}
                <IconSeparator {...iconParams}/>
                <Icon type="ImMoveUp" title="Move Up" {...iconParams} onClick={() => this.moveUp()}/>
                <Icon type="ImMoveDown" title="Move Down" {...iconParams} onClick={() => this.moveDown()}/>
                <Icon type="AiOutlineBorderTop" title="All Up" {...iconParams} onClick={() => this.allUp()}/>
                <Icon type="AiOutlineBorderBottom" title="All Down" {...iconParams} onClick={() => this.allDown()}/>
                <Icon type="GiWhiplash" title="Smooth" {...iconParams} onClick={() => this.smooth()}/>
            </div>
        )
    }
    
    render() {
        const { 
            id,
            title, 
            width, 
            height, 
            maxY, 
            symmetrical, 
            samples, 
            onChange, 
            wheels, 
            wheelDrawing, 
            sections,
            onSectionChanged,
            onSectionSelected
        } = this.props;
        const { mode, currentSection } = this.state;

        const titleParts = [
            title,
            currentSection !== null ? `@${currentSection}`: null
        ]
        return (
            <div className="side-editor">
                {this.renderMenu()}
                <div className="side-drawing-container">
                    {titleParts.filter(Boolean).join(",")}
                    <DrawingCanvas 
                        id={id}
                        symmetrical={symmetrical}
                        width={width}
                        height={height}
                        samples={samples} 
                        maxY={maxY}
                        mode={mode}
                        onChange={onChange}
                        wheels={wheels}
                        wheelDrawing={wheelDrawing}
                        sections={sections}
                        onSectionChanged={onSectionChanged}
                        onSectionSelected={(s) => {
                            this.setState({ 
                                currentSection: s 
                            }, () => {
                                onSectionSelected(s);
                            })                            
                        }}
                    />
                </div>
            </div>
        )
    }
}