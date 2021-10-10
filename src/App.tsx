import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { Generate, IPoint3D, Tools } from './lib';
import { Forms, Icon, IconSeparator, IIconProps, ModalsComponent } from './components';
import { Dialogs } from './components/modal/modal';
import { DesignStore, IDesign, IStorageModel } from './DesignStore';
import { SideEditor } from './components/side-editor';
import { STLExporter  } from "three/examples/jsm/exporters/STLExporter";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

import { BodyShape } from './BodyShape';
import { generationParity } from './SidePlane';
import * as THREE from "three";
import { MathUtils } from 'three';
import { wheelDrawingType } from './components/drawing-model';

interface IState {
  storageModel: IStorageModel;
  currentDesign: IDesign | null;
  wireframes: boolean;
  flatShading: boolean;
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);

    this.state = {
      currentDesign: null,
      wireframes: false,
      flatShading: false,
      storageModel: DesignStore.loadFromLocalStorage()
    }
  }

  newDesing(name: string): IDesign {
    const boxSize: IPoint3D = {x: 101, y: 41, z: 31};
    const sidePoints =  Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.z }));
    const frontPoints = Generate.range(0, boxSize.y).map(i => ({ x: i, y: boxSize.z }));
    const topPoints =  Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.y }));

    return {
      name,
      boxSize,
      sidePoints,
      frontPoints,
      topPoints,
      colorOdd: 0xEB7D09,
      colorEven: 0x000000,
      wheels: []
    }
  }

  resetModel() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;

    const newDesign = this.newDesing(currentDesign.name);
    this.updateDesign(newDesign);
  }

  updateDesign(design: IDesign | null) {
    if (!design) return;
    const updated = DesignStore.updateDesign(design);
    if (!updated) return;

    this.setState({
      storageModel: updated.storageModel,
      currentDesign: updated.design
    })
  }

  componentDidMount() {
    const { storageModel } = this.state;

    const design = storageModel?.designs[0] ?? this.newDesing("Default");

    this.setState({
      currentDesign: design
    });

    window.ontouchstart = function(event) {
      if (event.touches.length>1) { //If there is more than one touch
          event.preventDefault();
      }
    }
/*
    window.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    })
    */
  }

  renderDesign() {
    const { currentDesign, wireframes, flatShading } = this.state;
    if (!currentDesign) return null;

    const { boxSize, frontPoints, sidePoints, topPoints, colorOdd, colorEven, wheels } = currentDesign;

    const canvasWidth = 700;
    const canvasHeight = 300;

    const modifyDesign = (diff: Partial<IDesign>) => {
      const modified = {
        ...currentDesign,
        ...diff
      };
      this.updateDesign(modified);
    }

    return (
      <table className="main-layout">
        <tbody>
          <tr>
            <td>
              <SideEditor 
                title={`Front (${frontPoints.length}x${boxSize.z})`}
                symmetrical={true}
                width={canvasWidth}
                height={canvasHeight}
                samples={frontPoints}
                maxY={boxSize.z}
                onChange={(newPoints) => {
                  modifyDesign({
                    frontPoints: newPoints
                  })
                }}
                wheels={null}
                wheelDrawing={wheelDrawingType.None}
              />
            </td>
            <td>
              <SideEditor 
                title={`Top (${topPoints.length}x${boxSize.y})`}
                symmetrical={false}
                width={canvasWidth}
                height={canvasHeight}
                samples={topPoints}
                maxY={boxSize.y}
                onChange={(newPoints, newWheels) => {
                  modifyDesign({
                    topPoints: newPoints,
                    wheels: newWheels || [] 
                  })
                }}
                wheels={wheels}
                wheelDrawing={wheelDrawingType.Top}
              />
            </td>
          </tr>
          <tr>
            <td>
              <SideEditor 
                title={`Side (${sidePoints.length}x${boxSize.z})`}
                symmetrical={false}
                width={canvasWidth}
                height={canvasHeight}
                samples={sidePoints}
                maxY={boxSize.z}
                onChange={(newPoints, newWheels) => {
                  modifyDesign({
                    sidePoints: newPoints,                    
                    wheels: newWheels || []
                  })
                }}
                wheels={wheels}
                wheelDrawing={wheelDrawingType.Side}
              />
            </td>
            <td>
              <AppScene 
                bodyPoints={boxSize}
                sidePoints={sidePoints} 
                frontPoints={frontPoints} 
                topPoints={topPoints}
                wireframes={wireframes}
                flatShading={flatShading}
                colorEven={colorEven}
                colorOdd={colorOdd}
                wheels={wheels}
              />
              </td>
          </tr>
        </tbody>
      </table>
    )
  }

  async newDesign() {
    const now = new Date();
    const newDesign = await Forms.Modal(
      "New Design", 
      {
        stringName: `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
      }
    );

    if (newDesign) {
      const design = this.newDesing(newDesign.stringName);
      this.updateDesign(design);  
    }
  }

  async cloneDesign() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;
    const now = new Date();

    const cloneDesignParams = await Forms.Modal(
      "Clone Design", 
      {
        stringName: `${currentDesign.name} - ${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
      }
    );
    if (!cloneDesignParams) return;
    const clonedDesign = Tools.clone(currentDesign);
    clonedDesign.name = cloneDesignParams.stringName;
    this.updateDesign(clonedDesign);  
  }

  async deleteDesign() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;
    if (!await Dialogs.Confirm(`Delete ${currentDesign.name}`)) return;

    const updated = DesignStore.deleteDesign(currentDesign);
    if (!updated) return;

    this.setState({
      storageModel: updated.storageModel,
      currentDesign: updated.design
    })
  }

  async settings() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;

    const settings = await Forms.Modal(currentDesign.name, {
      stringName: currentDesign.name,
      colorOdd: currentDesign.colorOdd,
      colorEven: currentDesign.colorEven
    });
    if (!settings) return;
    const updated = DesignStore.updateDesign(currentDesign, (d) => {
      d.name = settings.stringName;
      d.colorOdd = settings.colorOdd;
      d.colorEven = settings.colorEven;
    });
    if (!updated) return;

    this.setState({
      storageModel: updated.storageModel,
      currentDesign: updated.design
    })

  }

  async exportSTL() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;

    const params = await Forms.Modal("Export to STL", {
      stringName: `${currentDesign.name}.stl`,
      intXRotationDeg: 0,
      intYRotationDeg: 0,
      intZRotationDeg: 0
    });

    if (!params) return;

    const { boxSize, topPoints, frontPoints, sidePoints, wheels } = currentDesign;
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

  renderToolbar() {
    const { wireframes, flatShading } = this.state;
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

  renderDesignSelector() {
    const { storageModel, currentDesign } = this.state;

    return (
      <div className="menu menu-top">
        {storageModel.designs.map(d => {
          const classes = {
            "design-selector": true,
            "design-selector-active": d === currentDesign
          }
          return (
            <div key={d.name} className={Tools.classNames(classes)} onClick={() => {
              this.setState({
                currentDesign: d
              })
            }}>{d.name}</div>
          );
        })}
      </div>      
    )
  }

  render() {
    const { currentDesign } = this.state;

    if (!currentDesign) return null;

    return (
      <div className="App">
        <div>
          {this.renderToolbar()}
          {this.renderDesignSelector()}
          {this.renderDesign()}
        </div>   
        <ModalsComponent/>
      </div>
    );
  }
}

export default App;
