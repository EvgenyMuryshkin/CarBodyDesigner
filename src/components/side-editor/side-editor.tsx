import * as React from "react"
import { Generate, IPoint2D } from "../../lib";
import { DrawingCanvas, IDrawingCanvasProps } from "../drawing-canvas/drawing-canvas";
import { drawingMode } from "../drawing-model";
import { IIconProps } from "../icon/icon";
import { Dialogs } from "../modal/modal";
import { IToolbarItem } from "../toolbar";
import { Toolbar } from "../toolbar/toolbar";
import { ModalSideEditor } from "./modal-side-editor";
import "./side-editor.scss";

export interface ISideEditorProps extends IDrawingCanvasProps {
    title: string;
    currentSection: number;
    showSectionSelector: boolean;
    onInterpolateSections?: () => void;
}

interface IState {
    mode: drawingMode;
}

export class SideEditor extends React.Component<ISideEditorProps, IState> {
    constructor(props: ISideEditorProps) {
        super(props);
        this.state = {
            mode: drawingMode.Contour
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
        const { wheels, currentSection, showSectionSelector, onCountourChange, onSectionChanged } = this.props;

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
        const { showSectionSelector, currentSection, sections, onSectionChanged } = this.props;
        if (!showSectionSelector) {
            await Dialogs.Notification("Section editor is disabled");
            return;
        }

        if (!await Dialogs.Confirm("Apply current contour to the rest of the model?")) return;

        const { currentSamples } = this;

        onSectionChanged(Generate.inclusive(currentSection, sections), currentSamples);
    }

    async removeSection() {
        const { currentSection, onSectionChanged } = this.props;

        if (!await Dialogs.Confirm("Revert current section to baseline?")) return;
        onSectionChanged([currentSection], null);
    }

    async lockSection() {
        const { currentSection, sectionBaseline, onSectionChanged } = this.props;

        if (!await Dialogs.Confirm("Lock current section to baseline?")) return;
        onSectionChanged([currentSection], sectionBaseline); 
    }

    async interpolateSections() {
        const { onInterpolateSections } = this.props;
        onInterpolateSections?.();
    }
    
    renderMenu() {
        const { showSectionSelector, currentSection, wheels, onSectionSelected, onInterpolateSections } = this.props;
        const { mode } = this.state;
        const iconParams: Partial<IIconProps> = {
            bordered: true
        }

        const sectionParams: Partial<IIconProps> = {
            ...iconParams,
            readOnly: !showSectionSelector,
            readOnlyTitle: "Turn on section editor"
        };

        const items: IToolbarItem[] = [
            { icon: "FcViewDetails", title: "Legend", action: ()=> Toolbar.Modal("Main Toolbar", items) },
            { icon: "AiOutlineFullscreen", title: "Fullscreen edit",  action: async () => await this.fullscreenEdit() },
            { isSeparator: true },
            { icon: "ImPencil2", title: "Draw countour", selected: () => mode === drawingMode.Contour, action: () => this.setState({ mode: drawingMode.Contour })},   
            { icon: "GiCartwheel", title:"Draw wheel", selected: () => mode === drawingMode.Wheel, 
                hidden: () => !wheels,
                action: () => this.setState({ mode: drawingMode.Wheel }) },
            { isSeparator: true },
            { icon: "ImMoveUp", title: "Move Up", action: () => this.moveUp()},
            { icon: "ImMoveDown", title: "Move Down", action: () => this.moveDown()},
            { icon: "AiOutlineBorderTop", title: "All Up", action: () => this.allUp()},
            { icon: "AiOutlineBorderBottom", title: "All Down", action: () => this.allDown()},
            { icon: "GiWhiplash", title: "Smooth", action: () => this.smooth()},
            { isSeparator: true },
            { icon: "GiSlicedBread" ,
                title: "Slice Edit",
                selected: () => showSectionSelector,
                action: () => {
                    onSectionSelected(!showSectionSelector, currentSection)
                }
            },
            { icon: "AiFillLock",
                title: "Lock section",
                iconParams: sectionParams,
                action: () => this.lockSection()
            },
            { icon: "RiDeleteBack2Line", 
                title: "Revert section",
                iconParams: sectionParams,
                action: () => this.removeSection()
            },                
            { icon: "TiArrowForwardOutline", 
                title: "Apply to remaining sections",
                iconParams: sectionParams,
                action: () => this.applyToRemaining()
            }
            /*,
            { 
                icon: "AiOutlineFunction", 
                iconParams: sectionParams,
                title: "Interpolate sections",
                hidden: () => !onInterpolateSections,
                action: () => this.interpolateSections()
            }*/
        ]

        return <Toolbar className="menu menu-top" items={items} iconParams={iconParams} />
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
            onSectionSelected,
            showSectionSelector,
            currentSection,
            design,
            sectionMode
        } = this.props;
        const { mode } = this.state;

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
                            onSectionSelected(showSectionSelector, s);
                        }}
                        sectionIndex={currentSection}
                        design={design}
                        sectionMode={sectionMode}
                    />
                </div>
            </div>
        )
    }
}