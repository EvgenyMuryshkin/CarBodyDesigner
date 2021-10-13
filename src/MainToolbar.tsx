import React from 'react';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { BodyShape } from './BodyShape';
import { Dialogs, Forms, Icon, IconSeparator, IIconProps } from './components';
import { DesignStore, IDesign, IDesignStoreState } from './DesignStore';
import { IRenderSettings, Tools } from './lib';
import { generationParity } from './SidePlane';
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { MathUtils } from 'three';
import * as THREE from "three";

interface IProps {
    designStore: DesignStore;
    designStoreState: IDesignStoreState;
    renderSettings: IRenderSettings;
    renderSettingsChanged: (renderSettings: IRenderSettings) => void;
}

export class MainToolbar extends React.Component<IProps> {
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

    resetModel() {
        const { designStore, designStoreState } = this.props;
        const { design } = designStoreState;
        if (!design) return;
    
        const newDesign = designStore.newDesing(design.name);
        this.updateDesign(newDesign);
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

    async exportSTL() {
        const { designStoreState } = this.props;
        const { design } = designStoreState;
        if (!design) return;

        const params = await Forms.Modal("Export to STL", {
            stringName: `${design.name}.stl`,
            intXRotationDeg: 0,
            intYRotationDeg: 0,
            intZRotationDeg: 0
        });
    
        if (!params) return;
    
        const { boxSize, topPoints, frontPoints, sidePoints, wheels } = design;
        const exporter = new STLExporter();
        const bodyShape = new BodyShape(boxSize.x, boxSize.y, boxSize.z, generationParity.All);
        bodyShape.apply(sidePoints, frontPoints, topPoints, wheels );
        const singleGeometry = mergeBufferGeometries(bodyShape.geometry);
        
        singleGeometry.rotateX(MathUtils.degToRad(params.intXRotationDeg));
        singleGeometry.rotateY(MathUtils.degToRad(params.intYRotationDeg));
        singleGeometry.rotateZ(MathUtils.degToRad(params.intXRotationDeg));
    
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        const mesh = new THREE.Mesh( singleGeometry, material );
    
        const stl = exporter.parse(mesh);
        const link = document.createElement( 'a' );
        link.style.display = 'none';
        document.body.appendChild( link );
    
        const blob = new Blob( [ stl ], { type: 'text/plain' } );
    
        link.href = URL.createObjectURL( blob );
        link.download = params.stringName || "test.stl";
        link.click();
    
        link.remove();
    }

    render() {
        const { renderSettings } = this.props;
        const { wireframes, flatShading } = renderSettings;
        const iconParams: Partial<IIconProps> = {
            bordered: true
        }
    
        return (
          <div className="menu menu-top">
            <Icon type="VscNewFile" title="New Design" {...iconParams} onClick={() => this.newDesign()}/>
            <IconSeparator/>
            <Icon type="GrClone" title="Clone Design" {...iconParams} onClick={() => this.cloneDesign()}/>
            <Icon type="AiOutlineSetting" title="Settings" {...iconParams} onClick={() => this.settings()}/>
            <Icon type="AiOutlineCloseCircle" title="Delete Design" {...iconParams} onClick={() => this.deleteDesign()}/>
    
            {/*<Icon type="GrPowerReset" onClick={() => this.resetModel()}/>*/}
            <IconSeparator/>
            <Icon type="GiWireframeGlobe" title="Wireframes" {...iconParams} selected={wireframes} onClick={() => this.setState({ wireframes: !wireframes })} />
            <Icon type="CgEditShadows" title="Flat Shading" {...iconParams} selected={flatShading} onClick={() => this.setState({ flatShading: !flatShading })}/>
            <Icon type="AiOutlineExport" title="Export STL" {...iconParams} onClick={() => this.exportSTL()}/>
          </div>      
        );
    }
}