import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { Canvas } from './Canvas';
import { DrawingCanvas } from './components/drawing-canvas/drawing-canvas';
import { Generate, IPoint2D, IPoint3D } from './lib';

interface IState {
  boxSize: IPoint3D;
  sidePoints: IPoint2D[];
  frontPoints: IPoint2D[];
  topPoints: IPoint2D[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
//    const boxSize: IPoint3D = {x: 101, y: 41, z: 31};
    const boxSize: IPoint3D = {x: 11, y: 7, z: 5};

    this.state = {
      boxSize,
      sidePoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.z })),
      frontPoints: Generate.range(0, boxSize.y).map(i => ({ x: i, y: boxSize.z })),
      topPoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.y })),
    }
  }

  render() {
    const { boxSize, sidePoints, frontPoints, topPoints } = this.state;
    const canvasWidth = 550;
    const canvasHeight = 300;

    return (
      <div className="App">
        <table className="main-layout">
          <tbody>
            <tr>
              <td>
                <div className="side-drawing-container">
                  Front
                  <DrawingCanvas
                    width={canvasWidth}
                    height={canvasHeight}
                    samples={frontPoints}
                    maxY={boxSize.z}
                    onChange={(newPoints) => {
                      this.setState({
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
                    width={canvasWidth}
                    height={canvasHeight}
                    samples={topPoints} 
                    maxY={boxSize.y}
                    onChange={(newPoints) => {
                      this.setState({
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
                    width={canvasWidth}
                    height={canvasHeight}
                    samples={sidePoints} 
                    maxY={boxSize.z}
                    onChange={(newPoints) => {
                      this.setState({
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
                topPoints={topPoints}/></td>
            </tr>
          </tbody>
        </table>      
      </div>
    );
  }
}

export default App;
