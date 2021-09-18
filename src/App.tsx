import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { Canvas } from './Canvas';
import { DrawingCanvas } from './components/drawing-canvas/drawing-canvas';
import { IPoint2D } from './lib';

interface IState {
  sidePoints: IPoint2D[];
  frontPoints: IPoint2D[];
  topPoints: IPoint2D[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      sidePoints: [],
      frontPoints: [],
      topPoints: []
    }
  }

  render() {
    const { sidePoints, frontPoints, topPoints } = this.state;
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
                      width={550} 
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
                      width={550} 
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
                    width={550} 
                    onChange={(newPoints) => {
                    this.setState({
                      sidePoints: newPoints
                    })
                  }}/>
                </div>
              </td>
              <td><AppScene length={length} sidePoints={sidePoints} frontPoints={frontPoints} topPoints={topPoints}/></td>
            </tr>
          </tbody>
        </table>      
      </div>
    );
  }
}

export default App;
