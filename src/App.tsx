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
    const boxSize: IPoint3D = {x: 101, y: 41, z: 31};

    this.state = {
      boxSize,
      sidePoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: 21 })),
      frontPoints: Generate.range(0, boxSize.y).map(i => ({ x: i, y: 41 })),
      topPoints: Generate.range(0, boxSize.x).map(i => ({ x: i, y: 41 })),
    }
  }

  render() {
    const { boxSize, sidePoints, frontPoints, topPoints } = this.state;
    const length = 550;
    return (
      <div className="App">
        <table className="main-layout">
          <tbody>
            <tr>
              <td>
                <div className="side-drawing-container">
                  Front
                  <DrawingCanvas 
                      samples={frontPoints}
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
                      samples={topPoints} 
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
                    samples={sidePoints} 
                    onChange={(newPoints) => {
                    this.setState({
                      sidePoints: newPoints
                    })
                  }}/>
                </div>
              </td>
              <td><AppScene 
                bodyPoints={boxSize}
                length={length} 
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
