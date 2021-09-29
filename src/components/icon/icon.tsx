import * as React from "react"
import { IconBaseProps } from "react-icons";
import { CgEditShadows } from "react-icons/cg";
import { GiWireframeGlobe } from "react-icons/gi";
import { GrPowerReset } from "react-icons/gr";
import { Tools } from "../../lib";
import "./icon.scss";

export type iconType = 
    "GrPowerReset" | 
    "GiWireframeGlobe" | 
    "CgEditShadows"
    ;

export interface IProps {
    type: iconType;
    title?: string;
    selected?: boolean;
    className?: string;
    onClick?: () => void;
}

export class Icon extends React.Component<IProps> {
    getIcon() {
        const { type, className, selected = false, onClick } = this.props;
        const classNames: {[key: string]: boolean} = {
            "icon": true,
            "icon-selected": selected
        };

        if (className) classNames[className] = true;

        const iconProps: IconBaseProps = {
            className: Tools.classNames(classNames),
            onClick: () => onClick?.()
        };

        switch (type) {
            case "CgEditShadows": return <CgEditShadows {...iconProps}/>;
            case "GiWireframeGlobe": return <GiWireframeGlobe {...iconProps}/>;
            case "GrPowerReset": return <GrPowerReset {...iconProps}/>
            default: return null;
        }
    }

    render() {
        return (
            <div className="icon-container">
                {this.getIcon()}
            </div>
        )
    }
}