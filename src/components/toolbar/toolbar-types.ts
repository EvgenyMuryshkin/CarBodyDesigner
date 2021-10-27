import { iconType, IIconProps } from "../icon/icon";

export interface IToolbarItem {
    isSeparator?: boolean;
    icon?: iconType;
    title?: string,
    action?: () => void;
    selected?: () => boolean;
    iconParams?: Partial<IIconProps>;
    hidden?: () => boolean;
}