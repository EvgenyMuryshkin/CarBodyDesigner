import React from 'react';
import './App.scss';
import { AppScene } from './AppScene';
import { IRenderSettings, ISectionData, Tools } from './lib';
import { ModalsComponent } from './components';
import { DesignStore, IDesign, IDesignStoreState } from './DesignStore';
import { SideEditor } from './components/side-editor';
import { sectionEditorMode, wheelDrawingType } from './components/drawing-model';
import { MainToolbar } from './MainToolbar';
import { BodyShape, CountourQuery } from './BodyShape';
import { generationParity } from './SidePlane';
import CookieConsent from 'react-cookie-consent';
import { debounce, interval, Subject } from 'rxjs';
import { DesignStoreOperations } from './DesignStoreOperations';

interface IState {
  designStore: DesignStore;
  currentSectionData: ISectionData;
  renderSettings: IRenderSettings;
  designStoreState: IDesignStoreState;
  showSectionSelector: boolean;
  currentSection: number;
}

export class App extends React.Component<{}, IState> {
  _updateStream: Subject<{}> = new Subject<{}>();

  constructor(props: any) {
    super(props);

    const designStore = new DesignStore();

    this.state = {
      designStore,
      renderSettings: {
        wireframes: false,
        flatShading: false,
        ground: true,
        lightOrbit: true,
        renderWheels: true
      },
      designStoreState: designStore.state,
      currentSectionData: {
        front: null,
        side: null,
        top: null
      },
      showSectionSelector: false,
      currentSection: 0
    }


    this
        ._updateStream
        .pipe(debounce(() => interval(500)))
        .subscribe(() => this.forceUpdate());
  }

  componentDidMount() {
    const { designStore, renderSettings } = this.state;
    designStore.subscribe(s => this.setState({ designStoreState: s }));
    this.subscribeForResizeEvents();

    window.ontouchstart = function(event) {
      if (event.touches.length > 1) { //If there is more than one touch
          event.preventDefault();
      }
    }

    if (designStore.hasStoredDesigns) {
      designStore.initializeFromStorage();
    }
    else {
      designStore.initializeFromStorage();

      const ops = new DesignStoreOperations({ designStore: designStore, design: null, storageModel: null }, renderSettings);
      ops.loadSampleDesigns();
    }
/*
    window.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    })
    */
  }

  subscribeForResizeEvents() {
    window.addEventListener("resize", () => {
      this._updateStream.next({});
    });
  }

  renderDesign() {
    const { 
      designStoreState, 
      designStore, 
      renderSettings, 
      currentSectionData, 
      showSectionSelector, 
      currentSection 
    } = this.state;
    const { design } = designStoreState;
    if (!design) return null;

    const { boxSize, frontPoints, sidePoints, topPoints, wheels, frontSegments } = design;

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

    const onSectionSelected = (show: boolean, section: number) => {
      this.setState({
        currentSectionData: {
          ...currentSectionData,
          front: show ? section : null
        },
        showSectionSelector: show,
        currentSection: section
      })
    }

    const height = window.innerHeight - 100;
    const tableSizeProps: React.CSSProperties = {
      width: window.innerWidth,
      height: height
    };

    const rowSizeProps: React.CSSProperties = {
      height: height / 2
    };

    const cellSizeProps: React.CSSProperties = {
      width: window.innerWidth / 2,
      height: height / 2
    };

    const canvasWidth = Math.floor(window.innerWidth / 2);
    const canvasHeight = Math.floor(height / 2);

    console.log(canvasWidth, canvasHeight);

    return (
      <div className="main-layout-div" style={tableSizeProps}>
        <div className="main-layout-row" style={rowSizeProps}>
          <div className="main-layout-cell" style={cellSizeProps}>
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
                onSectionSelected={onSectionSelected}
                onSectionChanged={(sections, points) => {
                  const modifiedSegments = [...design.frontSegments];
                  sections.forEach(s => {
                    if (s === sections[0] && points !== null) {
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
                showSectionSelector={showSectionSelector}
                currentSection={currentSection}
                design={design}
                sectionMode={sectionEditorMode.Edit}
              />
          </div>
          <div className="main-layout-cell" style={cellSizeProps}>
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
                onSectionSelected={onSectionSelected}                
                onSectionChanged={(sections, points) => {}}
                section={null/*section.top.map((p, idx) => ({ x: idx, y: p.y }))*/}
                sectionBaseline={null}
                showSectionSelector={showSectionSelector}
                currentSection={currentSection}
                design={design}
                sectionMode={sectionEditorMode.Pick}
              />
          </div>
        </div>
        <div className="main-layout-row" style={rowSizeProps}>
          <div className="main-layout-cell" style={cellSizeProps}>
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
                onSectionSelected={onSectionSelected}
                onSectionChanged={(sections, points) => {}}
                section={null/*section.side.map((p, idx) => ({ x: idx, y: p.y }))*/}
                sectionBaseline={null}
                showSectionSelector={showSectionSelector}
                currentSection={currentSection}
                design={design}
                sectionMode={sectionEditorMode.Pick}
              />
          </div>
          <div className="main-layout-cell" style={cellSizeProps}>
          <AppScene 
                width={canvasWidth}
                height={canvasHeight}
                design={design}
                renderSettings={renderSettings}
              />
          </div>
        </div>
      </div>
    )
  }

  renderDesignSelector() {
    const { designStore, designStoreState } = this.state;
    const { storageModel, design } = designStoreState;

    if (!storageModel) return null;

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
          <div className="app-toolbars">
            <MainToolbar 
              designStore={designStore} 
              designStoreState={designStoreState} 
              renderSettings={renderSettings} 
              renderSettingsChanged={s => this.setState({ renderSettings: s })}
            />
            {this.renderDesignSelector()}
          </div>
          {this.renderDesign()}
        </div>   
        <ModalsComponent/>
        <CookieConsent>This website uses cookies to enhance the user experience.</CookieConsent>
      </div>
    );
  }
}

export default App;
