import React from 'react';
import { Dialogs, Forms, IIconProps, Toolbar, IToolbarItem } from './components';
import { DesignStore, IDesign, IDesignStoreState } from './DesignStore';
import { IRenderSettings, Tools } from './lib';
import { DesignStoreOperations } from './DesignStoreOperations';

interface IProps {
    designStore: DesignStore;
    designStoreState: IDesignStoreState;
    renderSettings: IRenderSettings;
    renderSettingsChanged: (renderSettings: IRenderSettings) => void;
}

interface IState {
    items: IToolbarItem[];
}

export class MainToolbar extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            items: [
                { icon: "BiHelpCircle", title: "Help", action: ()=> Toolbar.Modal("Main Toolbar", this.state.items) },
                { icon: "GrPowerReset", title:"Reset All", action: () => this.resetAll() },
                { isSeparator: true },
                { icon: "VscNewFile", title: "New Design", action: () => this.newDesign()},
                { icon: "FiDownload", title: "Download designs" , action: () => this.dso.downloadDesigns()},
                { icon: "FiUpload", title: "Upload designs", action: () => this.dso.uploadDesigns()},
                { icon: "AiOutlineExport", title: "Export STL", action: () => this.dso.exportSTL()},
                { isSeparator: true },
                { icon: "GrClone", title: "Clone Design", action: () => this.cloneDesign()},
                { icon: "AiOutlineSetting", title: "Settings", action: () => this.settings()},
                { icon: "AiOutlineCloseCircle", title: "Delete Design", action: () => this.deleteDesign()},
                { isSeparator: true },
                { icon: "GiWireframeGlobe", title: "Wireframes", selected: () => this.props.renderSettings.wireframes, action: () => this.toggleWireframes()} ,
                { icon: "CgEditShadows", title: "Flat Shading", selected: () => this.props.renderSettings.flatShading, action: () => this.toggleFlatShading()},
                { isSeparator: true },
                { icon: "AiOutlineGithub", title: "Github", action: () => { window.open("https://github.com")}},
                { icon: "AiOutlineTwitter", title: "Twitter", action: () => { window.open("https://twitter.com")}},
                { icon: "BiChip", title: "QuSoC", action: () => { window.open("https://github.com/EvgenyMuryshkin/qusoc")}},
            ]
        }
    }

    async newDesign() {
        const { designStore } = this.props;

        const now = new Date();
        const newDesign = await Forms.Modal(
            "New Design", 
            {
                stringName: `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
            }
        );
    
        if (newDesign) {
            const design = designStore.newDesing(newDesign.stringName);
            this.updateDesign(design);  
        }
    }

    async resetAll() {
        const { designStore } = this.props;
        if (!await Dialogs.Confirm("Reset all designs?")) return;
        designStore.resetAll();
    }
    
    updateDesign(design: IDesign | null) {
        const { designStore } = this.props;
        if (!design) return;
        designStore.updateDesign(design);
    }

    async cloneDesign() {
        const { designStoreState } = this.props;
        const { design } = designStoreState;

        if (!design) return;
        const now = new Date();
    
        const cloneDesignParams = await Forms.Modal(
            "Clone Design", 
            {
                stringName: `${design.name} - ${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
            }
        );
        if (!cloneDesignParams) return;
        const clonedDesign = Tools.clone(design);
        clonedDesign.name = cloneDesignParams.stringName;
        this.updateDesign(clonedDesign);  
    }
    
    async deleteDesign() {
        const { designStore, designStoreState } = this.props;
        const { design } = designStoreState;

        if (!design) return;
        if (!await Dialogs.Confirm(`Delete ${design.name}`)) return;
    
        designStore.deleteDesign(design);
    }
    
    async settings() {
        const { designStore, designStoreState } = this.props;
        const { design } = designStoreState;
        if (!design) return;
    
        const settings = await Forms.Modal(design.name, {
            stringName: design.name,
            colorOdd: design.colorOdd,
            colorEven: design.colorEven
        });
        if (!settings) return;
        designStore.updateDesign(design, (d) => {
            d.name = settings.stringName;
            d.colorOdd = settings.colorOdd;
            d.colorEven = settings.colorEven;
        });
    }
    
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
        const { items } = this.state;

        const iconParams: Partial<IIconProps> = {
            bordered: true,
            size: "large"
        }

        return <Toolbar iconParams={iconParams} items={items} className="menu menu-top" />;
    }
}