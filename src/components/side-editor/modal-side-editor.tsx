import * as React from "react"
import { IPoint2D, Tools } from "../../lib";
import { IWheelModel } from "../drawing-model";
import { ISideEditorProps, SideEditor } from "./side-editor";
import "./side-editor.scss";

interface IProps extends ISideEditorProps {

}

interface IState {
    contour: IPoint2D[];
    wheels: IWheelModel[] | null;
}

export class ModalSideEditor extends React.Component<IProps, IState> {
    _container: HTMLDivElement | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            contour: [],
            wheels: null
        }
    }

    componentDidMount() {
        const { contour, wheels } = this.props;
        this.setState({
            contour: contour.map((s): IPoint2D => ({ x: s.x, y: s.y })),
            wheels: wheels ? wheels.map(w => Tools.clone(w)) : null
        })
    }

    render() {
        const { 
            id, 
            title, 
            symmetrical, 
            maxY, 
            onCountourChange, 
            wheelDrawing, 
            sections, 
            onSectionSelected, 
            onSectionChanged,
            section,
            sectionBaseline
        } = this.props;
        const { contour, wheels } = this.state;

        const width = (this._container?.clientWidth ?? 0) * 0.9;
        const height = (this._container?.clientHeight ?? 0) * 0.9;

        return (
            <div className="modal-side-editor" ref={r => this._container = r}>
                ({this._container?.clientWidth}x{this._container?.clientHeight})
                { width && height ? <SideEditor 
                    id={`${id}_modal`}
                    title={title}
                    symmetrical={symmetrical}
                    width={width}
                    height={height}
                    contour={contour} 
                    maxY={maxY}
                    onCountourChange={(newSamples, newWheels) => {
                        this.setState({
                            contour: newSamples,
                            wheels: newWheels
                        }, 
                        () => onCountourChange(this.state.contour, this.state.wheels))
                    }}
                    wheels={wheels}
                    wheelDrawing={wheelDrawing}
                    sections={sections}
                    sectionBaseline={sectionBaseline}
                    onSectionChanged={onSectionChanged}
                    onSectionSelected={onSectionSelected}
                    section={section}
                /> : null
                }
            </div>
        );
    }
}