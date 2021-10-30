import React from 'react';
import { IIconProps, Toolbar } from './components';
import { DesignStore, IDesignStoreState } from './DesignStore';
import { IRenderSettings } from './lib';
import { DesignStoreOperations } from './DesignStoreOperations';
import { ToolbarFactory } from './ToolbarFactory';

interface IProps {
    designStore: DesignStore;
    designStoreState: IDesignStoreState;
    renderSettings: IRenderSettings;
    renderSettingsChanged: (renderSettings: IRenderSettings) => void;
}

export class MainToolbar extends React.Component<IProps> {
    
    modify(diff: Partial<IRenderSettings>) {
        const { renderSettingsChanged, renderSettings } = this.props;

        renderSettingsChanged({
            ...renderSettings,
            ...diff
        });
    }

    toggleWireframes() {
        this.modify({ wireframes: !this.props.renderSettings.wireframes });
    }

    toggleFlatShading() {
        this.modify({ flatShading: !this.props.renderSettings.flatShading });
    }

    get dso() {
        const { designStoreState } = this.props;
        return new DesignStoreOperations(designStoreState);
    }

    render() {
        const toolbarFactory = new ToolbarFactory();
        const items = toolbarFactory.MainToolbar(
            () => this.dso, 
            () => this.props.renderSettings,
            (diff) => this.modify(diff)
            );

        const iconParams: Partial<IIconProps> = {
            bordered: true,
            size: "large"
        }

        return <Toolbar iconParams={iconParams} items={items} className="menu menu-top" />;
    }
}