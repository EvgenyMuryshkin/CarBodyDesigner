import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { Generate, IPoint2D, IRenderSettings, ISectionData, Tools } from './lib';
import { ModalsComponent } from './components';
import { DesignStore, IDesign, IDesignStoreState } from './DesignStore';
import { SideEditor } from './components/side-editor';
import { wheelDrawingType } from './components/drawing-model';
import { MainToolbar } from './MainToolbar';
import { BodyShape, CountourQuery } from './BodyShape';
import { generationParity } from './SidePlane';
import { DesignTools } from './DesignTools';

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

    const { boxSize, frontPoints, sidePoints, topPoints, wheels, frontSegments } = design;

    const canvasWidth = 700;
    const canvasHeight = 300;

    const modifyDesign = (diff: Partial<IDesign>) => {
      const modified = {
        ...design,
        ...diff
      };
      designStore.updateDesign(modified);
    }

    const bodyShape = new BodyShape(boxSize.x, boxSize.y, boxSize.z, generationParity.All);
    bodyShape.applyContour(sidePoints, frontPoints, topPoints, wheels, [] );
    
    //const section = bodyShape.sectionPoints(design, currentSectionData);

    const contourQuery = new CountourQuery(frontPoints, frontSegments);
    const section = frontSegments[currentSectionData.front || 0];
    const sectionBaseline = section 
      ? contourQuery.query((currentSectionData.front || 0) - 1)
      : contourQuery.query(currentSectionData.front || 0);

      /*
    const designTools = new DesignTools(design);
    const interpolatedSegments = designTools.interpolateSections();
*/
    const interpolateSections = () => {      
      //Generate.range(0, boxSize.x).map(sectionIdx => {
      //  console.log(sectionIdx, interpolatedSegments[sectionIdx]);
      //})
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
                contour={frontPoints}
                maxY={boxSize.z}
                onCountourChange={(newPoints) => {
                  modifyDesign({
                    frontPoints: newPoints
                  })
                }}
                wheels={null}
                wheelDrawing={wheelDrawingType.None}
                sections={boxSize.x}
                onSectionSelected={(show, section) => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      front: show ? section : null
                    }
                  })
                }}
                onSectionChanged={(sections, points) => {
                  const modifiedSegments = [...design.frontSegments];
                  sections.forEach(s => {
                    if (s == sections[0] && points !== null) {
                      modifiedSegments[s] = points.map(p => ({ x: p.x, y: p.y }));
                    }
                    else {
                      delete modifiedSegments[s];
                    }
                  })
                  modifyDesign({
                    frontSegments: modifiedSegments
                  })
                }}
                sectionBaseline={sectionBaseline}
                section={section/*section.front.map((p, idx) => ({ x: idx, y: p.y }))*/}
                onInterpolateSections={interpolateSections}
              />
            </td>
            <td>
              <SideEditor 
                id="top"
                title={`Top (${topPoints.length}x${boxSize.y})`}
                symmetrical={false}
                width={canvasWidth}
                height={canvasHeight}
                contour={topPoints}
                maxY={boxSize.y}
                onCountourChange={(newPoints, newWheels) => {
                  modifyDesign({
                    topPoints: newPoints,
                    wheels: newWheels || [] 
                  })
                }}
                wheels={wheels}
                wheelDrawing={wheelDrawingType.Top}
                sections={boxSize.z}
                onSectionSelected={(show, section) => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      top: show ? section : null
                    }
                  })
                }}                
                onSectionChanged={(sections, points) => {}}
                section={null/*section.top.map((p, idx) => ({ x: idx, y: p.y }))*/}
                sectionBaseline={null}
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
                contour={sidePoints}
                maxY={boxSize.z}
                onCountourChange={(newPoints, newWheels) => {
                  modifyDesign({
                    sidePoints: newPoints,                    
                    wheels: newWheels || []
                  })
                }}
                wheels={wheels}
                wheelDrawing={wheelDrawingType.Side}
                sections={boxSize.y}
                onSectionSelected={(show, section) => {
                  this.setState({
                    currentSectionData: {
                      ...currentSectionData,
                      side: show ? section : null
                    }
                  })
                }}
                onSectionChanged={(sections, points) => {}}
                section={null/*section.side.map((p, idx) => ({ x: idx, y: p.y }))*/}
                sectionBaseline={null}
              />
            </td>
            <td>
              <AppScene 
                design={design}
                renderSettings={renderSettings}
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
