import * as React from "react"
import { IPoint2D } from "../../lib";
import { DrawingCanvas, IDrawingCanvasProps } from "../drawing-canvas/drawing-canvas";
import { Icon, IIconProps } from "../icon/icon";
import { Dialogs } from "../modal/modal";
import { ModalSideEditor } from "./modal-side-editor";
import "./side-editor.scss";

export interface ISideEditorProps extends IDrawingCanvasProps {
    title: string;
}

export class SideEditor extends React.Component<ISideEditorProps> {

    moveUp() {
        const { maxY, onChange } = this.props;
        const samples = [...this.props.samples];
        if (samples.some(s => s.y > maxY - 1)) return;
        samples.forEach(s => s.y++);
        onChange(samples);
    }

    moveDown() {
        const { onChange } = this.props;
        const samples = [...this.props.samples];
        if (samples.some(s => s.y < 1)) return;
        samples.forEach(s => s.y--);
        onChange(samples);
    }
    
    allUp() {
        const { maxY, onChange } = this.props;
        const samples = [...this.props.samples];
        samples.forEach(s => s.y = maxY);
        onChange(samples);

    }

    allDown() {
        const { onChange } = this.props;
        const samples = [...this.props.samples];
        samples.forEach(s => s.y = 0);
        onChange(samples);
    }

    async fullscreenEdit() {
        const { title, onChange } = this.props;
        let newSamples = null;

        if (await Dialogs.Modal({
            title: title,
            body: <ModalSideEditor {...this.props} onChange={(s) => newSamples = s} />,
            buttonsFactory: Dialogs.OKCancelButtons
        })) {
            if (newSamples) onChange(newSamples)
        }
    }

    smooth() {
        const { onChange, samples } = this.props;
        const newSamples = samples
        .map((s, idx): IPoint2D => {
            if (idx === 0 || idx === samples.length - 1) return s;
            return {
                x: s.x,
                y: (samples[idx-1].y + samples[idx].y + samples[idx + 1].y) / 3
            }
        });
        onChange(newSamples);
        console.log(samples, newSamples);
    }

    renderMenu() {
        const iconParams: Partial<IIconProps> = {
            bordered: true,
            size: "small"
        }
        
        return (
            <div className="menu menu-top">
                <Icon type="AiOutlineFullscreen" title="Fullscreen edit" {...iconParams} onClick={async () => await this.fullscreenEdit()}/>
                <Icon type="ImMoveUp" title="Move Up" {...iconParams} onClick={() => this.moveUp()}/>
                <Icon type="ImMoveDown" title="Move Up" {...iconParams} onClick={() => this.moveDown()}/>
                <Icon type="AiOutlineBorderTop" title="All Up" {...iconParams} onClick={() => this.allUp()}/>
                <Icon type="AiOutlineBorderBottom" title="All Down" {...iconParams} onClick={() => this.allDown()}/>
                <Icon type="GiWhiplash" title="Smooth" {...iconParams} onClick={() => this.smooth()}/>
            </div>
        )
    }
    
    render() {
        const { title, width, height, maxY, symmetrical, samples, onChange} = this.props;

        return (
            <div className="side-editor">
                {this.renderMenu()}
                <div className="side-drawing-container">
                    {title}
                    <DrawingCanvas 
                        symmetrical={symmetrical}
                        width={width}
                        height={height}
                        samples={samples} 
                        maxY={maxY}
                        onChange={onChange}
                    />
                </div>
            </div>
        )
    }
}