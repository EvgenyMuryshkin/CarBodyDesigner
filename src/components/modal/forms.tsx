import * as React from "react"
import { Dialogs } from "./modal";
import "./form.scss";

interface IDynamicFormProps<T extends {[key: string]: any}> {
    model: T;
    modified: (model: T) => void;
}

interface IDynamicFormState<T extends {[key: string]: any}> {
    model: T;   
}

class DynamicForm<T extends {[key: string]: any}> extends React.Component<IDynamicFormProps<T>, IDynamicFormState<T>> {
    constructor(props: IDynamicFormProps<T>) {
        super(props);
        this.state = {
            model: props.model
        }
    }

    render() {
        const { modified } = this.props;
        const { model } = this.state;
        if (!model) return null;

        const keys = Object.keys(model);

        const components = keys.map(key => {
            const index = key.split('').findIndex(c => c.toUpperCase() === c);
            if (index <= 0) {
                return (
                    <div key={key}>
                        Component type cannot be inferred: {key}
                    </div>
                )
            }
            const fieldName = key.substring(index);

            const formComponent = (fieldEditor: JSX.Element ) => {
                return (
                    <div key={key}>
                        <div className="form-label">{fieldName}</div>
                        <div>{fieldEditor}</div>
                    </div>
                )
            }

            const modify = (newValue: any) => {
                const newModel = Object.assign({}, model, {
                    [key]: newValue
                })
                this.setState({
                    model: newModel
                }, () => modified(this.state.model))
            };

            const fieldType = key.substring(0, index);
            switch(fieldType) {
                case "int": {
                    return formComponent(<input className="form-control" type="number" value={model[key]} onChange={e => modify(parseInt(e.target.value || "0"))}/>)
                }
                case "string": {
                    return formComponent(<input className="form-control" type="string" value={model[key]} onChange={e => modify(e.target.value || "")}/>)
                }
                case "color": {
                    return formComponent(<input 
                        className="form-control" 
                        type="color" 
                        value={`#${(model[key] ?? 0).toString(16).padStart(6,"0")}`} 
                        onChange={e => {
                            modify(parseInt((e.target.value ?? "#000000").substring(1), 16));
                        }}/>)              
                }
                default: {
                    return formComponent(<div>Unsupported field type: {fieldType}</div>)
                }
            }
        });

        return (
            <form className="form">
                {components}
            </form>
        );
    }
}

export class Forms {
    static async Modal<T extends {[key: string]: any}>(title: string, model: T): Promise<T | null> {
        if (!model) return model;

        let result = model;
        const form = <DynamicForm model={model} modified={(m) => result = m} />

        if (!await Dialogs.Modal({
            title,
            icon: "AiOutlineInfoCircle",
            body: form,
            buttonsFactory: Dialogs.OKCancelButtons
        })) return null;

        return result;
    }
}