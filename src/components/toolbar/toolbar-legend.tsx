import React from 'react';
import { Icon } from '../icon/icon';
import { Dialogs, IGenericDialog } from '../modal';
import { IToolbarItem } from './toolbar-types';

interface IProps {
    items: IToolbarItem[];
    dialogFactory?: (() => IGenericDialog | null) | null;
}

export class ToolbarLegend extends React.Component<IProps> {
    render() {
        const { items, dialogFactory } = this.props;

        const rows = items.map((i, idx) => {
            if (i.isSeparator) {
                return <tr key={idx}><td colSpan={2} className="toolbar-legend-separator"></td></tr>
            }

            return (
                <tr key={idx}>
                    <td className="toolbar-legend-icon">
                        <Icon type={i.icon} selected={i.selected?.()} 
                            onClick={() => {
                            const genericDialog = dialogFactory?.();
                            if (genericDialog) {
                                Dialogs.Remove(genericDialog);
                                i.action?.();
                            }
                        }}/>
                    </td>
                    <td>{i.title}</td>
                </tr>
            )
        });

        return (
            <table className="toolbar-legend">
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }
}