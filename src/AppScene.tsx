import React from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { BodyShape } from "./BodyShape";
import { IRenderSettings } from "./lib";
import { Vector3 } from "three";
import { generationParity } from "./SidePlane";
import { Subject, debounce, Subscription, interval } from "rxjs";
import { IDesign } from "./DesignStore";
import { DesignTools } from "./DesignTools";
// https://dustinpfister.github.io/2018/04/13/threejs-orbit-controls/
// https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse
// https://threejs.org/docs/#examples/en/controls/OrbitControls

export interface IProps {
    height: number;
    width: number;
    design: IDesign;
    renderSettings: IRenderSettings;
}

interface IState {
}

export class AppScene extends React.Component<IProps, IState> {
    _subscription: Subscription;
    _updateStream: Subject<{}> = new Subject<{}>();

    scene: THREE.Scene | null = null;
    camera: THREE.PerspectiveCamera | null = null;
    light: THREE.DirectionalLight | null = null;
    renderer: THREE.WebGLRenderer | null = null;
    bodyMesh: THREE.Mesh[] | null = null;
    orbitControls: OrbitControls | null = null;
    groundControls: THREE.Object3D[] = [];

    container: HTMLDivElement | null = null;

    public constructor(props: IProps)
    {
        super(props);
        this.state = {
            flatShading: true
        }
        this.animate = this.animate.bind(this);
        
        this._subscription = this
            ._updateStream
            .pipe(debounce(() => interval(500)))
            .subscribe(() => this.updateMesh("debounce"));
    }

    componentDidMount() {
        this.init();
        this.subscribeForResizeEvents();
        this.updateMesh("mount");

        requestAnimationFrame(this.animate);
        this.forceUpdate();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.renderSettings.ground !== this.props.renderSettings.ground) {
            if (this.props.renderSettings.ground) {
                this.scene?.add(...this.groundControls);
            }
            else {
                this.scene?.remove(...this.groundControls);
            }
        }

        this._updateStream.next({});
    }

    componentWillUnmount() {
        this._subscription.unsubscribe();
    }

    updateMesh(from: string) {
        const { scene } = this;

        if (!scene) return;

        if (this.bodyMesh)
            this.bodyMesh.forEach(m => this.scene?.remove(m));

        this.bodyMesh = [];

        const { 
            design,
            renderSettings
        } = this.props;
        const { 
            boxSize, 
            frontPoints, 
            sidePoints, 
            topPoints, 
            colorOdd, 
            colorEven, 
            wheels 
        } = design;

        const { flatShading, wireframes } = renderSettings;
        const wireframesColor = 0x00FF00;
        
        const parts = [
            { parity: generationParity.Odd, color: colorOdd },
            { parity: generationParity.Even, color: colorEven }          
        ];

        const designTools = new DesignTools(design);
        const interpolatedSegments = designTools.interpolateSections();
    
        for (const p of parts) {
            const body = new BodyShape(boxSize.x, boxSize.y, boxSize.z, p.parity);
            body.applyContour(sidePoints, frontPoints, topPoints, wheels, interpolatedSegments);

            //const material = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } );
            //const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
            const material = new THREE.MeshPhongMaterial({ 
                color: wireframes ? wireframesColor : p.color, 
                wireframe: wireframes, 
                flatShading: flatShading 
            });
            this.bodyMesh.push(...body.geometry.map(m => new THREE.Mesh( m, material )));
        }

        this.bodyMesh.forEach(m => scene.add( m ));
    }

    initGround() {
        if (!this.scene) return;

        const ground = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;

        const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
        const gridMaterial = grid.material as THREE.Material;
        gridMaterial.opacity = 0.2;
        gridMaterial.transparent = true;

        this.groundControls = [ground, grid]

        this.scene.add( ...this.groundControls );
    }

    init()
    {
        this.scene = new THREE.Scene();
    
        // The X axis is red. The Y axis is green. The Z axis is blue.
        var axesHelper = new THREE.AxesHelper( 500 );
        this.scene.add( axesHelper );

        //this.scene.background = new THREE.Color( 0xa0a0a0 );
        //this.scene.fog = new THREE.Fog( 0xa0a0a0, 200, 5000 );

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = -300;
        this.camera.position.z = 300;
        this.camera.position.y = 300;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.set( 0, 25, 0 );
        this.orbitControls.update();

        this.scene.add( new THREE.AmbientLight( 0x777777 ) );

        this.light = new THREE.DirectionalLight( 0xdfebff, 1 );
        this.light.position.set( 500, 600, 700 );
        //light.position.multiplyScalar( 1.3 );

        this.light.castShadow = true;

        this.light.shadow.mapSize.width = 1024;
        this.light.shadow.mapSize.height = 1024;

        const d = 300;

        this.light.shadow.camera.left = - d;
        this.light.shadow.camera.right = d;
        this.light.shadow.camera.top = d;
        this.light.shadow.camera.bottom = - d;

        this.light.shadow.camera.far = 1000;

        this.scene.add( this.light );

        this.initGround();
    }

    ang = 0;
    animate()
    {
        const { renderSettings } = this.props;
        const { renderer, scene, camera, orbitControls } = this;

        requestAnimationFrame(this.animate);

        if (renderSettings.lightOrbit) {
            this.ang += 0.01;
            const vec = new Vector3(500, 600, 700);
            vec.applyAxisAngle(new Vector3(0, 1, 0), this.ang);
    
            this.light?.position?.set(vec.x, vec.y, vec.z);
        }

        orbitControls?.update();

        if (renderer && scene && camera) {
            renderer.render( scene, camera );
        }
    }

    onContainerCreated(d: HTMLDivElement | null) {
        this.container = d;
        if (d && this.renderer?.domElement)
        {
            this.renderer.setSize(d.offsetWidth - 2, d.offsetHeight - 2);
            if (this.camera) {
                this.camera.aspect = d.offsetWidth / d.offsetHeight;
                this.camera.updateProjectionMatrix();
            }

            d.appendChild?.(this.renderer.domElement);                
        }
    }

    subscribeForResizeEvents() {
        window.addEventListener("resize", () => {
            const { renderer, camera, container } = this;

            if (renderer && container && camera) {
                const newWidth = container.offsetWidth - 2;
                const newHeight = container.offsetHeight - 2;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        });
    }

    public render() {
        const { width, height } = this.props;
        console.log('scene', width, height);
        const sizeProps: React.CSSProperties = {
            width: width,
            height: height
          };
        return (
            <div style={sizeProps}>
                <div style={sizeProps} ref={(d) => this.onContainerCreated(d)} />
            </div>
        )
    }
}