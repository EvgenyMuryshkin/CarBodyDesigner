import * as React from "react"
import { IPoint2D } from "../../lib";
import { ISideEditorProps, SideEditor } from "./side-editor";
import "./side-editor.scss";

interface IProps extends ISideEditorProps {

}

interface IState {
    samples: IPoint2D[];
}

export class ModalSideEditor extends React.Component<IProps, IState> {
    _container: HTMLDivElement | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            samples: []
        }
    }

    componentDidMount() {
        const { samples } = this.props;
        this.setState({
            samples: samples.map((s): IPoint2D => ({ x: s.x, y: s.y }))
        })
    }

    render() {
        const { title, symmetrical, maxY, onChange} = this.props;
        const { samples } = this.state;

        const width = (this._container?.clientWidth ?? 0) * 0.9;
        const height = (this._container?.clientHeight ?? 0) * 0.9;

        return (
            <div className="modal-side-editor" ref={r => this._container = r}>
                ({this._container?.clientWidth}x{this._container?.clientHeight})
                { width && height ? <SideEditor 
                    title={title}
                    symmetrical={symmetrical}
                    width={width}
                    height={height}
                    samples={samples} 
                    maxY={maxY}
                    onChange={(newSamples) => {
                        this.setState({
                            samples: newSamples
                        }, 
                        () => onChange(this.state.samples))
                    }}
                /> : null
                }
            </div>
        );
    }
}