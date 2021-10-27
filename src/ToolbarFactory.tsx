import React from "react"
import { Dialogs, Toolbar } from "./components"
import { IToolbarItem } from "./components/toolbar";
import { DesignStoreOperations } from "./DesignStoreOperations"
import { IRenderSettings } from "./lib";
import { Tutorial } from "./tutorial"

export class ToolbarFactory {
    MainToolbar(
        dsoFactory: () => DesignStoreOperations,
        renderSettingsFactory: () => IRenderSettings,
        renderSettingsModified: (diff: Partial<IRenderSettings>) => void
        ): IToolbarItem[] {
        const dso = () => dsoFactory();
        const renderSettings = () => renderSettingsFactory();

        const mainToolbarItemsFactory = () => this.MainToolbar(dsoFactory, renderSettings, renderSettingsModified);

        return [
            { icon: "FcViewDetails", title: "Legend", action: () => Toolbar.Modal("Main Toolbar", mainToolbarItemsFactory()) },
            { icon: "FaUniversity", title: "Tutorials", action: () => this.tutorials(mainToolbarItemsFactory()) },
            { isSeparator: true },
            { icon: "GrPowerReset", title: "Reset All", action: () => dso().resetAll() },
            { icon: "GrFavorite", title: "Load sample designs", action: () => dso().loadSampleDesigns() },
            { isSeparator: true },
            { icon: "VscNewFile", title: "New Design", action: () => dso().newDesign()},
            { icon: "FiDownload", title: "Download designs" , action: () => dso().downloadDesigns()},
            { icon: "FiUpload", title: "Upload designs", action: () => dso().uploadDesigns()},
            { icon: "AiOutlineExport", title: "Export STL", action: () => dso().exportSTL()},
            { isSeparator: true },
            { icon: "GrClone", title: "Clone Design", action: () => dso().cloneDesign()},
            { icon: "AiOutlineSetting", title: "Settings", action: () => dso().settings()},
            { icon: "AiOutlineCloseCircle", title: "Delete Design", action: () => dso().deleteDesign()},
            { isSeparator: true },
            { icon: "GiWireframeGlobe", title: "Wireframes", selected: () => renderSettings().wireframes, action: () => renderSettingsModified({ wireframes: !renderSettings().wireframes })} ,
            { icon: "CgEditShadows", title: "Flat Shading", selected: () => renderSettings().flatShading, action: () => renderSettingsModified({ wireframes: !renderSettings().flatShading })},
            { isSeparator: true },
            { icon: "AiOutlineGithub", title: "Github", action: () => { window.open("https://github.com")}},
            { icon: "AiOutlineTwitter", title: "Twitter", action: () => { window.open("https://twitter.com")}},
            { icon: "BiChip", title: "QuSoC", action: () => { window.open("https://github.com/EvgenyMuryshkin/qusoc")}},
        ]
    }

    async tutorials(mainToolbarItems: IToolbarItem[]) {
        await Dialogs.Modal({
            title: "How to create a car model",
            icon: "FaUniversity",
            body: <Tutorial mainToolbarItems={mainToolbarItems}/>,
            buttonsFactory: Dialogs.CloseButtons
        });
    }
}