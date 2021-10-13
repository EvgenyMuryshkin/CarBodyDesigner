import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { IRenderSettings, ISectionData, Tools } from './lib';
import { ModalsComponent } from './components';
import { DesignStore, IDesign, IDesignStoreState } from './DesignStore';
import { SideEditor } from './components/side-editor';
import { wheelDrawingType } from './components/drawing-model';
import { MainToolbar } from './MainToolbar';

interface IState {
  designStore: DesignStore;
  currentSectionData: ISectionData;
  renderSettings: IRenderSettings;
  designStoreState: IDesignStoreState;
}

export class App extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);

    const designStore = new DesignStore();

    this.state = {
      designStore,
      renderSettings: {
        wireframes: false,
        flatShading: false,
      },
      designStoreState: designStore.state,
      currentSectionData: {
        front: null,
        side: null,
        top: null
      }
    }
  }

  componentDidMount() {
    const { designStore } = this.state;
    designStore.subscribe(s => this.setState({ designStoreState: s }));

    window.ontouchstart = function(event) {
      if (event.touches.length > 1) { //If there is more than one touch
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
    const { designStoreState, designStore, renderSettings, currentSectionData } = this.state;
    const { design } = designStoreState;
    if (!design) return null;

    const { boxSize, frontPoints, sidePoints, topPoints, colorOdd, colorEven, wheels } = design;

    const canvasWidth = 700;
    const canvasHeight = 300;

    const modifyDesign = (diff: Partial<IDesign>) => {
      const modified = {
        ...design,
        ...diff
      };
      designStore.updateDesign(modified);
    }

    return (
      <table className="main-layout">
        <tbody>
          <tr>
            <td>
              <SideEditor 
                id="front"
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
                sections={boxSize.x}
                onSectionSelected={s => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      front: s
                    }
                  })
                }}
                onSectionChanged={(sections, points) => {}}
              />
            </td>
            <td>
              <SideEditor 
                id="top"
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
                sections={boxSize.z}
                onSectionSelected={s => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      top: s
                    }
                  })
                }}                
                onSectionChanged={(sections, points) => {}}
              />
            </td>
          </tr>
          <tr>
            <td>
              <SideEditor 
                id="side"
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
                sections={boxSize.y}
                onSectionSelected={s => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      side: s
                    }
                  })
                }}
                onSectionChanged={(sections, points) => {}}
              />
            </td>
            <td>
              <AppScene 
                bodyPoints={boxSize}
                sidePoints={sidePoints} 
                frontPoints={frontPoints} 
                topPoints={topPoints}
                renderSettings={renderSettings}
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

  renderDesignSelector() {
    const { designStore, designStoreState } = this.state;
    const { storageModel, design } = designStoreState;

    return (
      <div className="menu menu-top">
        {storageModel.designs.map(d => {
          const classes = {
            "design-selector": true,
            "design-selector-active": d === design
          }
          return (
            <div key={d.name} className={Tools.classNames(classes)} onClick={() => {
              designStore.setActiveDesign(d);
            }}>{d.name}</div>
          );
        })}
      </div>      
    )
  }

  render() {
    const { designStore, designStoreState, renderSettings } = this.state;

    return (
      <div className="App">
        <div>
          <MainToolbar 
            designStore={designStore} 
            designStoreState={designStoreState} 
            renderSettings={renderSettings} 
            renderSettingsChanged={s => this.setState({ renderSettings: s })}
          />
          {this.renderDesignSelector()}
          {this.renderDesign()}
        </div>   
        <ModalsComponent/>
      </div>
    );
  }
}

export default App;
