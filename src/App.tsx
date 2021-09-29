import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { DrawingCanvas } from './components/drawing-canvas/drawing-canvas';
import { Generate, IPoint2D, IPoint3D } from './lib';
import { Icon } from './components';

interface IState {
  storageModel: IStorageModel;

  boxSize: IPoint3D;
  sidePoints: IPoint2D[];
  frontPoints: IPoint2D[];
  topPoints: IPoint2D[];

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
    const boxSize: IPoint3D = {x: 101, y: 41, z: 31};
//    const boxSize: IPoint3D = {x: 11, y: 7, z: 5};
//    const boxSize: IPoint3D = {x: 3, y: 3, z: 3};

    this.state = {
      boxSize,
      sidePoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.z })),
      frontPoints: Generate.range(0, boxSize.y).map(i => ({ x: i, y: boxSize.z })),
      topPoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.y })),
      wireframes: false,
      flatShading: true,
      storageModel: this.loadFromLocalStorage()
    }
  }

  resetModel() {
    const boxSize: IPoint3D = {x: 101, y: 41, z: 31};
    const sidePoints =  Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.z }));
    const frontPoints = Generate.range(0, boxSize.y).map(i => ({ x: i, y: boxSize.z }));
    const topPoints =  Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.y }));

    this.setState({
      boxSize,
      sidePoints,
      frontPoints,
      topPoints
    }, () => this.saveToLocalStorage());
  }

  componentDidMount() {
    const { storageModel } = this.state;
    if (!storageModel?.designs?.length) {
      this.resetModel();
    }
    else {
      const design = storageModel.designs[0];
      const { boxSize, topPoints, frontPoints, sidePoints } = design; 
      this.setState({
        boxSize,
        topPoints,
        frontPoints,
        sidePoints
      })
    }
  }

  loadFromLocalStorage() : IStorageModel {
    const json = localStorage.getItem("Designs");
    if (!json) return { designs: [] }

    return JSON.parse(json) as IStorageModel;
  }

  saveToLocalStorage() {
    const { boxSize, frontPoints, sidePoints, topPoints } = this.state;

    const model = this.loadFromLocalStorage();
    model.designs = [
      {
        name: "Default",
        boxSize,
        frontPoints,
        sidePoints,
        topPoints
      }
    ];

    const payload = JSON.stringify(model);
    localStorage.setItem("Designs", payload);
  }

  render() {
    const { storageModel, boxSize, sidePoints, frontPoints, topPoints, wireframes, flatShading } = this.state;
    const canvasWidth = 700;
    const canvasHeight = 300;

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
                        this.setState({
                          frontPoints: newPoints
                        }, () => this.saveToLocalStorage())
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
                        this.setState({
                          topPoints: newPoints
                        }, () => this.saveToLocalStorage())
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
                        this.setState({
                          sidePoints: newPoints
                        }, () => this.saveToLocalStorage())
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
        </div>   
      </div>
    );
  }
}

export default App;
