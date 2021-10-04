import * as React from "react"
import { IconBaseProps } from "react-icons";
import { CgEditShadows } from "react-icons/cg";
import { GiWireframeGlobe } from "react-icons/gi";
import { GrPowerReset, GrClone } from "react-icons/gr";
import { VscNewFile } from "react-icons/vsc";
import { AiOutlineSetting, AiOutlineInfoCircle, AiOutlineCloseCircle, AiOutlineWarning, AiOutlineBorderTop, AiOutlineBorderBottom, AiOutlineFullscreen } from "react-icons/ai";
import { ImMoveUp, ImMoveDown } from "react-icons/im"

import { Tools } from "../../lib";
import "./icon.scss";

export type iconSize =
    "small" | "medium" | "large";

export type iconType = 
    "GrPowerReset" | 
    "GiWireframeGlobe" | 
    "CgEditShadows" | 
    "VscNewFile" |
    "AiOutlineInfoCircle" |
    "AiOutlineCloseCircle" |
    "AiOutlineWarning" | 
    "GrClone" |
    "ImMoveUp" |
    "ImMoveDown" |
    "AiOutlineBorderTop" |
    "AiOutlineBorderBottom" | 
    "AiOutlineFullscreen" |
    "AiOutlineSetting"
    ;

export interface IProps {
    type: iconType;
    title?: string;
    size?: iconSize;
    selected?: boolean;
    className?: string;
    onClick?: () => void;
}

export class Icon extends React.Component<IProps> {
    getIcon() {
        const { type, title, className, selected = false, size = "medium", onClick } = this.props;
        const classNames: {[key: string]: boolean} = {
            "icon": true,
            "icon-selected": selected,
            [`icon-${size}`]: true
        };

        if (className) classNames[className] = true;

        const iconProps: IconBaseProps = {
            title: title,
            className: Tools.classNames(classNames),
            onClick: () => onClick?.()
        };

        switch (type) {
            case "CgEditShadows": return <CgEditShadows {...iconProps}/>;
            case "GiWireframeGlobe": return <GiWireframeGlobe {...iconProps}/>;
            case "GrPowerReset": return <GrPowerReset {...iconProps}/>;
            case "VscNewFile": return <VscNewFile {...iconProps}/>
            case "AiOutlineInfoCircle": return <AiOutlineInfoCircle {...iconProps}/>
            case "AiOutlineCloseCircle": return <AiOutlineCloseCircle {...iconProps} />
            case "AiOutlineWarning": return <AiOutlineWarning {...iconProps}/>
            case "GrClone": return <GrClone {...iconProps}/>
            case "ImMoveUp": return <ImMoveUp {...iconProps}/>
            case "ImMoveDown": return <ImMoveDown {...iconProps}/>
            case "AiOutlineBorderTop": return <AiOutlineBorderTop {...iconProps}/>
            case "AiOutlineBorderBottom": return <AiOutlineBorderBottom {...iconProps}/>
            case "AiOutlineFullscreen": return <AiOutlineFullscreen  {...iconProps}/>
            case "AiOutlineSetting": return <AiOutlineSetting {...iconProps}/>
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