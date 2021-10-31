import React from "react"
import { Dialogs, IIconProps, Toolbar } from "./components"
import { drawingMode, sectionEditorMode } from "./components/drawing-model";
import { IToolbarItem } from "./components/toolbar";
import { DesignStoreOperations } from "./DesignStoreOperations"
import { IRenderSettings } from "./lib";
import { Tutorial } from "./tutorial"

export interface ISideEditorData {
    sectionMode: sectionEditorMode;
    mode: drawingMode;
    showSectionSelector: boolean;
    hasWheels: boolean;
    currentSection: number;
    sectionParams: Partial<IIconProps>;
}

export interface ISideEditorActions {
    fullscreenEdit() : Promise<void>;
    moveUp(): void;
    moveDown(): void;
    allUp(): void;
    allDown(): void;
    smooth(): void;
    lockSection(): void;
    removeSection(): void;
    applyToRemaining(): void;
    onSectionSelected(showSectionSelector: boolean, currentSection: number): void;
    setDrawingMode(mode: drawingMode): void;
}

export class ToolbarFactory {
    MainToolbar(
        dsoFactory: () => DesignStoreOperations,
        renderSettingsFactory: () => IRenderSettings,
        renderSettingsModified: (diff: Partial<IRenderSettings>) => void
        ): IToolbarItem[] {
        const dso = () => dsoFactory();
        const renderSettings = () => renderSettingsFactory();

        const items: IToolbarItem[] = [
            { icon: "FcViewDetails", title: "Legend", action: () => Toolbar.Modal("Main Toolbar", items) },
            { icon: "FaUniversity", title: "Tutorials", action: () => this.tutorials(items) },
            { isSeparator: true },
            { icon: "GrPowerReset", title: "Reset All", action: () => dso().resetAll() },
            { icon: "GrFavorite", title: "Load sample designs", action: () => dso().loadSampleDesigns() },
            { isSeparator: true },
            { icon: "VscNewFile", title: "New Design", action: () => dso().newDesign()},
            { icon: "FiDownload", title: "Download designs" , action: () => dso().downloadDesigns()},
            { icon: "FiUpload", title: "Upload designs", action: () => dso().uploadDesigns()},
            { isSeparator: true },
            { icon: "GrClone", title: "Clone Design", action: () => dso().cloneDesign()},
            { icon: "AiOutlineSetting", title: "Design Settings", action: () => dso().settings()},
            { icon: "AiOutlineExport", title: "Export Design to STL", action: () => dso().exportSTL()},
            { icon: "AiOutlineCloseCircle", title: "Delete Design", action: () => dso().deleteDesign()},
            { isSeparator: true },
            { icon: "GiWireframeGlobe", title: "Wireframes", selected: () => renderSettings().wireframes, action: () => renderSettingsModified({ wireframes: !renderSettings().wireframes })} ,
            { icon: "CgEditShadows", title: "Flat Shading", selected: () => renderSettings().flatShading, action: () => renderSettingsModified({ flatShading: !renderSettings().flatShading })},
            { icon: "GiFlatPlatform", title: "Ground plane", selected: () => renderSettings().ground, action: ()=> renderSettingsModified({ ground: !renderSettings().ground })},
            { icon: "CgSmartHomeLight", title: "Light orbiting", selected: () => renderSettings().lightOrbit, action: ()=> renderSettingsModified({ lightOrbit: !renderSettings().lightOrbit })},
            { icon: "GiCartwheel", title: "Render Wheels", selected: () => renderSettings().renderWheels, action: ()=> renderSettingsModified({ renderWheels: !renderSettings().renderWheels })},
            { isSeparator: true },
            { icon: "AiOutlineGithub", title: "GitHub - Project Repository", action: () => { window.open("https://github.com/EvgenyMuryshkin/CarBodyDesigner")}},
            { icon: "AiOutlineTwitter", title: "Twitter - Evgeny Muryshkin", action: () => { window.open("https://twitter.com/ITMayWorkDev")}},
            { icon: "BiChip", title: "QuSoC - FPGA design toolkit", action: () => { window.open("https://github.com/EvgenyMuryshkin/qusoc")}},
        ];

        return items;
    }

    async tutorials(mainToolbarItems: IToolbarItem[]) {
        const sideEditorToolbar = this.SideEditorToolbar(
            {
                sectionMode: sectionEditorMode.Edit,
                mode: drawingMode.Contour,
                showSectionSelector: false,
                hasWheels: false,
                currentSection: 0,
                sectionParams: {}
            },
            null
        );

        await Dialogs.Modal({
            title: "How to create a car model",
            icon: "FaUniversity",
            body: <Tutorial mainToolbarItems={mainToolbarItems} sideEditorToolbar={sideEditorToolbar}/>,
            buttonsFactory: Dialogs.CloseButtons
        });
    }

    SideEditorToolbar(data: ISideEditorData, actions: ISideEditorActions | null): IToolbarItem[] {
        const { mode, hasWheels, sectionParams, showSectionSelector, currentSection } = data;

        const items: IToolbarItem[] = [
            { icon: "FcViewDetails", title: "Legend", action: () => Toolbar.Modal("Main Toolbar", items) },
            { icon: "AiOutlineFullscreen", title: "Fullscreen edit",  action: async () => await actions?.fullscreenEdit() },
            { isSeparator: true },
            { icon: "ImPencil2", title: "Draw countour", selected: () => mode === drawingMode.Contour, 
                action: () => actions?.setDrawingMode(drawingMode.Contour)
            },   
            { icon: "GiCartwheel", title:"Draw wheel", selected: () => mode === drawingMode.Wheel, 
                hidden: () => !hasWheels,
                action: () => actions?.setDrawingMode(drawingMode.Wheel),
                iconParams: {
                    readOnly: showSectionSelector
                },
            },
            { isSeparator: true },
            { icon: "ImMoveUp", title: "Move Up", action: () => actions?.moveUp()},
            { icon: "ImMoveDown", title: "Move Down", action: () => actions?.moveDown()},
            { icon: "AiOutlineBorderTop", title: "All Up", action: () => actions?.allUp()},
            { icon: "AiOutlineBorderBottom", title: "All Down", action: () => actions?.allDown()},
            { icon: "GiWhiplash", title: "Smooth", action: () => actions?.smooth()},
            { isSeparator: true },
            { icon: "GiSlicedBread" ,
                title: "Slice Edit",
                selected: () => showSectionSelector,
                action: () => actions?.onSectionSelected(!showSectionSelector, currentSection)
            },
            { icon: "AiFillLock",
                title: "Lock section",
                iconParams: sectionParams,
                action: () => actions?.lockSection()
            },
            { icon: "RiDeleteBack2Line", 
                title: "Revert section",
                iconParams: sectionParams,
                action: () => actions?.removeSection()
            },                
            { icon: "TiArrowForwardOutline", 
                title: "Apply to remaining sections",
                iconParams: sectionParams,
                action: () => actions?.applyToRemaining()
            }
            /*,
            { 
                icon: "AiOutlineFunction", 
                iconParams: sectionParams,
                title: "Interpolate sections",
                hidden: () => !onInterpolateSections,
                action: () => this.interpolateSections()
            }*/
        ];

        return items;
    }
}