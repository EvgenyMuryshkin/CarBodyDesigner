import * as React from "react"
import { IPoint2D, Tools } from "../../lib";
import { IWheelModel } from "../drawing-model";
import { ISideEditorProps, SideEditor } from "./side-editor";
import "./side-editor.scss";

interface IProps extends ISideEditorProps {

}

interface IState {
    samples: IPoint2D[];
    wheels: IWheelModel[] | null;
}

export class ModalSideEditor extends React.Component<IProps, IState> {
    _container: HTMLDivElement | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            samples: [],
            wheels: null
        }
    }

    componentDidMount() {
        const { samples, wheels } = this.props;
        this.setState({
            samples: samples.map((s): IPoint2D => ({ x: s.x, y: s.y })),
            wheels: wheels ? wheels.map(w => Tools.clone(w)) : null
        })
    }

    render() {
        const { id, title, symmetrical, maxY, onChange, wheelDrawing, sections, onSectionSelected, onSectionChanged} = this.props;
        const { samples, wheels } = this.state;

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
                    samples={samples} 
                    maxY={maxY}
                    onChange={(newSamples, newWheels) => {
                        this.setState({
                            samples: newSamples,
                            wheels: newWheels
                        }, 
                        () => onChange(this.state.samples, this.state.wheels))
                    }}
                    wheels={wheels}
                    wheelDrawing={wheelDrawing}
                    sections={sections}
                    onSectionChanged={onSectionChanged}
                    onSectionSelected={onSectionSelected}
                /> : null
                }
            </div>
        );
    }
}