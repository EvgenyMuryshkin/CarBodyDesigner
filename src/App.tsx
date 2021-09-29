import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { DrawingCanvas } from './components/drawing-canvas/drawing-canvas';
import { Generate, IPoint2D, IPoint3D } from './lib';
import { Icon } from './components';

interface IState {
  storageModel: IStorageModel;
  currentDesign: IDesign | null;
  wireframes: boolean;
  flatShading: boolean;
}

interface IDesign {
  name: string;
  boxSize: IPoint3D;
  sidePoints: IPoint2D[];
  frontPoints: IPoint2D[];
  topPoints: IPoint2D[];
}

interface IStorageModel {
  designs: IDesign[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);

    this.state = {
      currentDesign: null,
      wireframes: false,
      flatShading: true,
      storageModel: this.loadFromLocalStorage()
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
      topPoints
    }
  }

  resetModel() {
    const { currentDesign } = this.state;
    if (!currentDesign) return;

    this.setState({
      currentDesign: this.newDesing(currentDesign.name),
    }, () => this.saveToLocalStorage(this.state.currentDesign));
  }

  componentDidMount() {
    const { storageModel } = this.state;

    const design = storageModel?.designs[0] ?? this.newDesing("Default");

    this.setState({
      currentDesign: design
    })
  }

  loadFromLocalStorage() : IStorageModel {
    const json = localStorage.getItem("Designs");
    if (!json) return { designs: [] }

    return JSON.parse(json) as IStorageModel;
  }

  saveToLocalStorage(design: IDesign | null) {
    if (!design) return;

    const model = this.loadFromLocalStorage()
    model.designs = model.designs.map(d => d.name === design.name ? design : d);
    if (!model.designs.includes(design)) model.designs.push(design);

    const payload = JSON.stringify(model);
    localStorage.setItem("Designs", payload);
  }

  renderDesign() {
    const { currentDesign, wireframes, flatShading } = this.state;
    if (!currentDesign) return null;

    const { boxSize, frontPoints, sidePoints, topPoints } = currentDesign;

    const canvasWidth = 700;
    const canvasHeight = 300;

    const modifyDesign = (diff: Partial<IDesign>) => {
      this.setState({
        currentDesign: {
          ...currentDesign,
          ...diff
        }
      }, () => this.saveToLocalStorage(this.state.currentDesign))

    }

    return (
      <table className="main-layout">
        <tbody>
          <tr>
            <td>
              <div className="side-drawing-container">
                Front
                <DrawingCanvas
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
                />
              </div>
            </td>
            <td>
              <div className="side-drawing-container">
                Top
                <DrawingCanvas 
                  symmetrical={false}
                  width={canvasWidth}
                  height={canvasHeight}
                  samples={topPoints} 
                  maxY={boxSize.y}
                  onChange={(newPoints) => {
                    modifyDesign({
                      topPoints: newPoints
                    })
                  }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="side-drawing-container">
                Side
                <DrawingCanvas 
                  symmetrical={false}
                  width={canvasWidth}
                  height={canvasHeight}
                  samples={sidePoints} 
                  maxY={boxSize.z}
                  onChange={(newPoints) => {
                    modifyDesign({
                      sidePoints: newPoints
                    })
                  }}
                />
              </div>
            </td>
            <td><AppScene 
              bodyPoints={boxSize}
              sidePoints={sidePoints} 
              frontPoints={frontPoints} 
              topPoints={topPoints}
              wireframes={wireframes}
              flatShading={flatShading}
              /></td>
          </tr>
        </tbody>
      </table>
    )
  }

  render() {
    const { storageModel, currentDesign, wireframes, flatShading } = this.state;

    if (!currentDesign) return null;

    return (
      <div className="App">
        <div className="menu menu-side">
          <Icon type="GrPowerReset" onClick={() => this.resetModel()}/>
          <Icon type="GiWireframeGlobe" selected={wireframes} onClick={() => this.setState({ wireframes: !wireframes })} />
          <Icon type="CgEditShadows" selected={flatShading} onClick={() => this.setState({ flatShading: !flatShading })}/>
        </div>
        <div>
          <div className="menu menu-top">
            {storageModel.designs.map(d => {
              return <div key={d.name} className="design-selector design-selector-active">{d.name}</div>
            })}
          </div>
          {this.renderDesign()}
        </div>   
      </div>
    );
  }
}

export default App;
