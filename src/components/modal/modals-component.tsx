import * as React from "react"
import { createPortal } from "react-dom"
import { Icon } from "../icon/icon";
import { Dialogs, IGenericDialog } from "./modal";
import "./modal.scss";

interface IProps {

}

interface IState {
    dialogs: IGenericDialog[];
}

export class ModalsComponent extends React.Component<IProps, IState> {
    internalDialogs: IGenericDialog[] = [];

    constructor(props: IProps) {
        super(props);

        this.state = {
            dialogs: []
        }
    }

    componentDidMount() {
        Dialogs.DialogsStream.subscribe(op => {
            const newDialogs = [
                ...this.internalDialogs.filter(d => !op.remove.includes(d)),
                ...op.add
            ];

            this.setState({
                dialogs: newDialogs
            })
        })
    }

    render() {
        const { dialogs } = this.state;

        const backdrop = dialogs.length ? <div className="modal-backdrop"/> : null;
        const modalDialogs = dialogs.map((d, idx) => {
            const { title, icon, body, footer } = d;
            return (
                <div key={idx} className="modal-dialog">
                    <div className="modal-header">
                        {icon && <div className="modal-header-icon"><Icon type={icon} size="small" /></div>}
                        <div className="modal-header-title">{title}</div>
                    </div>
                    { body && <div className="modal-body">{body}</div> }
                    { footer && <div className="modal-footer">{footer}</div> }
                </div>   
            )
        });

        const modalContainer = modalDialogs.length
        ? (
            <div className="modal-container">
                {modalDialogs}
            </div> 
        )
        : null;

        const modals = (
            <div className="modal" onSelect={e => console.log(e)}>
                {backdrop}
                {modalContainer}
            </div>
        )

        return createPortal(modals, document.body, "modals");
    }
}