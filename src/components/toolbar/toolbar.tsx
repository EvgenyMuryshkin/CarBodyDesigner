import React from 'react';
import { Icon, IconSeparator, iconType, IIconProps } from '../icon/icon';
import { Dialogs, IGenericDialog } from '../modal';

export interface IToolbarItem {
    isSeparator?: boolean;
    icon?: iconType;
    title?: string,
    action?: () => void;
    selected?: () => boolean;
    iconParams?: Partial<IIconProps>;
    hidden?: () => boolean;
}

interface IProps {
    items: IToolbarItem[];
    iconParams: Partial<IIconProps>;
    className?: string;
}

export class Toolbar extends React.Component<IProps> {
    render() {
        const { className, items, iconParams } = this.props;

        const separatorParams: Partial<IIconProps> = {
            size: iconParams.size
        }

        const menuItems = items.map((i, idx) => {
            if (i.isSeparator) return <IconSeparator key={idx} {...separatorParams}/>;
            return (
                <Icon 
                    key={idx} 
                    {...iconParams} 
                    type={i.icon} 
                    title={i.title} 
                    selected={i.selected?.()} 
                    onClick={i.action}
                    {...(i.iconParams || {})}
                />
            )

        })

        return (
            <div className={className}>
                {menuItems}
            </div>      
        );
    }

    static async Modal(title: string, items: IToolbarItem[]) {
        const menuItems = items.filter(i => !i.isSeparator);
        let genericDialog: IGenericDialog | null = null;
        const rows = menuItems.map((i, idx) => {
            return (
                <tr key={idx}>
                    <td><Icon type={i.icon} selected={i.selected?.()} onClick={() => {
                        if (genericDialog) {
                            Dialogs.Remove(genericDialog);
                            i.action?.();
                        }
                    }}/></td>
                    <td>{i.title}</td>
                </tr>
            )
        })

        await Dialogs.Notification(
            title,
            (
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            ),
            { genericDialogCallback: (d) => genericDialog = d }
        );
    }
}