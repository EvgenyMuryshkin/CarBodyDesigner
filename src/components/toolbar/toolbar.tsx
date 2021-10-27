import React from 'react';
import { Icon, IconSeparator, IIconProps } from '../icon/icon';
import { Dialogs, IGenericDialog } from '../modal';
import { ToolbarLegend } from './toolbar-legend';
import { IToolbarItem } from './toolbar-types';
import "./toolbar.scss";

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
        let genericDialog: IGenericDialog | null = null;

        await Dialogs.Notification(
            title,
            <ToolbarLegend items={items} dialogFactory={() => genericDialog} />,
            { genericDialogCallback: (d) => genericDialog = d }
        );
    }
}
