import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { Canvas } from './Canvas';
import { DrawingCanvas } from './components/drawing-canvas/drawing-canvas';
import { IPoint2D } from './lib';

interface IState {
  points: IPoint2D[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      points: []
    }
  }

  render() {
    const { points } = this.state;
    const length = 550;
    return (
      <div className="App">
        <table className="main-layout">
          <tbody>
            <tr>
              <td>{/*<Canvas/>*/}</td>
              <td>{/*<Canvas/>*/}</td>
            </tr>
            <tr>
              <td>
                <div className="side-drawing-container">
                  <DrawingCanvas 
                    width={550} 
                    onChange={(newPoints) => {
                    this.setState({
                      points: newPoints
                    })
                  }}/>
                </div>
              </td>
              <td><AppScene length={length} points={points}/></td>
            </tr>
          </tbody>
        </table>      
      </div>
    );
  }
}

export default App;
