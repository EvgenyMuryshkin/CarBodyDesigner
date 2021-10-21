import * as React from "react"
import { Generate, IPoint2D, Tools } from "../../lib";
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
    currentSection: number;
    showSectionSelector: boolean;
}

export class SideEditor extends React.Component<ISideEditorProps, IState> {
    constructor(props: ISideEditorProps) {
        super(props);
        this.state = {
            mode: drawingMode.Contour,
            currentSection: 0,
            showSectionSelector: false
        }
    }

    get currentSamples(): IPoint2D[] {
        const { contour, section, sectionBaseline } = this.props;
        const { showSectionSelector } = this.state;
        const sectionPoints = section || sectionBaseline;

        const source = 
            showSectionSelector && sectionPoints 
            ? sectionPoints
            : contour;
        
        return source.map(s => ({ ...s }));
    }

    set currentSamples(newData: IPoint2D[]) {
        const { wheels, onCountourChange, onSectionChanged } = this.props;
        const { showSectionSelector, currentSection } = this.state;

        if (showSectionSelector) {
            onSectionChanged([currentSection], newData);
        }
        else {
            onCountourChange(newData, wheels);
        }
    }

    moveUp() {
        const { maxY } = this.props;
        const samples = this.currentSamples;
        if (samples.some(s => s.y > maxY - 1)) return;
        samples.forEach(s => s.y++);
        this.currentSamples = samples;
    }

    moveDown() {
        const samples = this.currentSamples;
        if (samples.some(s => s.y < 1)) return;
        samples.forEach(s => s.y--);
        this.currentSamples = samples;
    }
    
    allUp() {
        const { maxY } = this.props;
        const samples = this.currentSamples;
        samples.forEach(s => s.y = maxY);
        this.currentSamples = samples;

    }

    allDown() {
        const samples = this.currentSamples;
        samples.forEach(s => s.y = 0);
        this.currentSamples = samples;
    }

    async fullscreenEdit() {
        const { title, contour, wheels, onCountourChange } = this.props;
        let newSamples = contour;
        let newWheels = wheels;

        if (await Dialogs.Modal({
            title: title,
            body: <ModalSideEditor {...this.props} onCountourChange={(s, w) => {
                newSamples = s;
                newWheels = w;
            }}/>,
            buttonsFactory: Dialogs.OKCancelButtons
        })) {
            onCountourChange(newSamples, newWheels);
        }
    }

    smooth() {
        const { currentSamples } = this;
        const newSamples = this
            .currentSamples
            .map((s, idx): IPoint2D => {
                if (idx === 0 || idx === currentSamples.length - 1) return s;
                return {
                    x: s.x,
                    y: (currentSamples[idx-1].y + currentSamples[idx].y + currentSamples[idx + 1].y) / 3
                }
            });
        this.currentSamples = newSamples;
    }

    async applyToRemaining() {
        const { sections, onSectionChanged } = this.props;
        const { currentSection, showSectionSelector } = this.state;
        if (!showSectionSelector) {
            await Dialogs.Notification("Section editor is disabled");
            return;
        }

        if (!await Dialogs.Confirm("Apply current contour to the rest of the model?")) return;

        const { currentSamples } = this;

        onSectionChanged(Generate.inclusive(currentSection, sections), currentSamples);
    }

    async removeSection() {
        const { onSectionChanged } = this.props;
        const { currentSection } = this.state;

        if (!await Dialogs.Confirm("Revert current section to baseline?")) return;
        onSectionChanged([currentSection], null);
    }

    async lockSection() {
        const { sectionBaseline, onSectionChanged } = this.props;
        const { currentSection } = this.state;

        if (!await Dialogs.Confirm("Lock current section to baseline?")) return;
        onSectionChanged([currentSection], sectionBaseline); 
    }

    async interpolateSections() {

    }
    
    renderMenu() {
        const { wheels, onSectionSelected } = this.props;
        const { mode, showSectionSelector, currentSection } = this.state;
        const iconParams: Partial<IIconProps> = {
            bordered: true
        }
        
        const toggleSection = () => {
            this.setState({ showSectionSelector: !showSectionSelector }, () => {
                onSectionSelected(this.state.showSectionSelector, currentSection);
            })
        }

        const sectionParams: Partial<IIconProps> = {
            ...iconParams,
            readOnly: !showSectionSelector,
            readOnlyTitle: "Turn on section editor"
        };

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
                <IconSeparator {...iconParams}/>
                <Icon type="GiSlicedBread" 
                    title="Slice Edit" 
                    {...iconParams} 
                    selected={showSectionSelector} 
                    onClick={() => toggleSection()}
                />
                <Icon 
                    type="AiFillLock" 
                    title="Lock section"
                    {...sectionParams} 
                    onClick={() => this.lockSection()} 
                    />
                <Icon 
                    type="RiDeleteBack2Line" 
                    title="Revert section"
                    {...sectionParams} 
                    onClick={() => this.removeSection()}
                    />
                <Icon 
                    type="TiArrowForwardOutline" 
                    title="Apply to remaining sections" 
                    {...sectionParams} 
                    onClick={() => this.applyToRemaining()} />
                <Icon
                    type="AiOutlineFunction" {...sectionParams}
                    title="Interpolate sections"
                    onClick={() => this.interpolateSections()}/>
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
            contour, 
            onCountourChange, 
            wheels, 
            wheelDrawing, 
            sections,
            section,
            sectionBaseline,
            onSectionChanged,
            onSectionSelected
        } = this.props;
        const { mode, showSectionSelector, currentSection } = this.state;

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
                        contour={contour} 
                        maxY={maxY}
                        mode={mode}
                        onCountourChange={onCountourChange}
                        wheels={wheels}
                        wheelDrawing={wheelDrawing}
                        sections={sections}
                        onSectionChanged={onSectionChanged}
                        showSectionSelector={showSectionSelector}
                        section={section}
                        sectionBaseline={sectionBaseline}
                        onSectionSelected={(show, s) => {
                            this.setState({ 
                                currentSection: s 
                            }, () => {
                                onSectionSelected(showSectionSelector, s);
                            })                            
                        }}
                        sectionIndex={currentSection}
                    />
                </div>
            </div>
        )
    }
}