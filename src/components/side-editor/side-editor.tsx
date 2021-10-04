import * as React from "react"
import { DrawingCanvas, IDrawingCanvasProps } from "../drawing-canvas/drawing-canvas";
import { Icon } from "../icon/icon";
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

    renderMenu() {
        return (
            <div className="menu menu-top">
                <Icon type="AiOutlineFullscreen" title="Fullscreen edit" size="small" onClick={async () => await this.fullscreenEdit()}/>
                <Icon type="ImMoveUp" title="Move Up" size="small" onClick={() => this.moveUp()}/>
                <Icon type="ImMoveDown" title="Move Up" size="small" onClick={() => this.moveDown()}/>
                <Icon type="AiOutlineBorderTop" title="All Up" size="small" onClick={() => this.allUp()}/>
                <Icon type="AiOutlineBorderBottom" title="All Down" size="small" onClick={() => this.allDown()}/>
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