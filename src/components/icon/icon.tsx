import * as React from "react"
import { IconBaseProps } from "react-icons";
import { CgEditShadows, CgSmartHomeLight } from "react-icons/cg";
import { GiWireframeGlobe, GiCartwheel } from "react-icons/gi";
import { GrFavorite, GrPowerReset, GrClone } from "react-icons/gr";
import { VscNewFile } from "react-icons/vsc";
import { AiOutlineFunction, AiFillLock, AiOutlineFastForward, AiOutlineGithub, AiOutlineTwitter, AiOutlineExport, AiOutlineSetting, AiOutlineInfoCircle, AiOutlineCloseCircle, AiOutlineWarning, AiOutlineBorderTop, AiOutlineBorderBottom, AiOutlineFullscreen } from "react-icons/ai";
import { ImMoveUp, ImMoveDown, ImPencil2 } from "react-icons/im"
import { GiWhiplash, GiSlicedBread, GiFlatPlatform } from "react-icons/gi"
import { TiArrowForwardOutline } from "react-icons/ti"
import { BiChip, BiHelpCircle } from "react-icons/bi"
import { RiDeleteBack2Line } from "react-icons/ri"
import { FiUpload, FiDownload } from "react-icons/fi"
import { FaUniversity } from "react-icons/fa"
import { FcViewDetails } from "react-icons/fc"

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
    "AiOutlineSetting" |
    "AiOutlineExport" | 
    "GiWhiplash" |
    "ImPencil2" |
    "GiCartwheel" |
    "GiSlicedBread" |
    "AiOutlineTwitter" |
    "AiOutlineGithub" |
    "AiOutlineFastForward" |
    "TiArrowForwardOutline" |
    "BiChip" |
    "RiDeleteBack2Line" |
    "AiFillLock" |
    "AiOutlineFunction" |
    "FiUpload" |
    "FiDownload" |
    "BiHelpCircle" |
    "GrFavorite" |
    "FaUniversity" |
    "FcViewDetails" |
    "GiFlatPlatform" |
    "CgSmartHomeLight"
    ;

export interface IIconElementProps {
    size?: iconSize;
    className?: string;    
}

export interface IIconProps extends IIconElementProps {
    type?: iconType;
    title?: string;
    readOnlyTitle?: string;
    selected?: boolean;
    readOnly?: boolean;
    hidden?: boolean; 
    bordered?: boolean;
    onClick?: () => void;
}

export class Icon extends React.Component<IIconProps> {
    getIcon() {
        const { 
            type, 
            title = "", 
            readOnlyTitle,
            bordered = false, 
            readOnly = false, 
            hidden = false,
            className, 
            selected = false, 
            size = "medium", 
            onClick
        } = this.props;

        const classNames: {[key: string]: boolean} = {
            "icon": true,
            "icon-selected": selected,
            "icon-bordered": bordered,
            "icon-readonly": readOnly,
            "icon-hidden": hidden,
            [`icon-${size}`]: true
        };

        if (className) classNames[className] = true;

        const iconTitle = readOnly 
            ? title + (readOnlyTitle ? ` (${readOnlyTitle})` : "")
            : title;

        const iconProps: IconBaseProps = {
            title: iconTitle,
            className: Tools.classNames(classNames),
            onClick: () => {
                if (readOnly) return;
                onClick?.()
            }
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
            case "AiOutlineExport": return <AiOutlineExport {...iconProps}/>
            case "GiWhiplash": return <GiWhiplash {...iconProps}/>
            case "ImPencil2": return <ImPencil2 {...iconProps}/>
            case "GiCartwheel": return <GiCartwheel {...iconProps}/>
            case "GiSlicedBread": return <GiSlicedBread {...iconProps}/>
            case "AiOutlineTwitter": return <AiOutlineTwitter {...iconProps}/>
            case "AiOutlineGithub": return <AiOutlineGithub {...iconProps} />
            case "AiOutlineFastForward": return <AiOutlineFastForward {...iconProps}/>
            case "TiArrowForwardOutline": return <TiArrowForwardOutline {...iconProps}/>
            case "BiChip": return <BiChip {...iconProps}/>
            case "RiDeleteBack2Line": return <RiDeleteBack2Line {...iconProps} />
            case "AiFillLock": return <AiFillLock {...iconProps}/>
            case "AiOutlineFunction": return <AiOutlineFunction {...iconProps}/>
            case "FiUpload": return <FiUpload {...iconProps} />
            case "FiDownload": return <FiDownload {...iconProps}/>
            case "BiHelpCircle": return <BiHelpCircle {...iconProps}/>
            case "GrFavorite": return <GrFavorite {...iconProps}/>
            case "FaUniversity": return <FaUniversity {...iconProps}/>
            case "FcViewDetails": return <FcViewDetails {...iconProps}/>
            case "GiFlatPlatform": return <GiFlatPlatform {...iconProps}/>
            case "CgSmartHomeLight": return <CgSmartHomeLight {...iconProps}/>
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

export const IconSeparator = (props: IIconElementProps) => {
    const { size, className } = props;
    const classNames: {[key: string]: boolean} = {
        "icon-separator": true,
        [`icon-${size}`]: true
    };

    if (className) classNames[className] = true;

    return (
        <div className="icon-container">
            <div className={Tools.classNames(classNames)}>&nbsp;</div>
        </div>
    )
}