import React from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { BodyShape } from "./BodyShape";
import { IPoint2D, IPoint3D } from "./lib";
import { Vector3 } from "three";
import { generationParity } from "./SidePlane";
import { Subject, debounce, Subscription, interval } from "rxjs";
// https://dustinpfister.github.io/2018/04/13/threejs-orbit-controls/
// https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse
// https://threejs.org/docs/#examples/en/controls/OrbitControls

export interface IProps {
    bodyPoints: IPoint3D;
    sidePoints: IPoint2D[];
    frontPoints: IPoint2D[];
    topPoints: IPoint2D[];
    wireframes: boolean;
    flatShading: boolean;
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
            .pipe(debounce(() => interval(1000)))
            .subscribe(() => this.updateMesh());
    }

    componentDidMount() {
        this.init();
        this.updateMesh();

        requestAnimationFrame(this.animate);
        this.forceUpdate();
    }

    componentDidUpdate() {
        this._updateStream.next({});
    }

    componentWillUnmount() {
        this._subscription.unsubscribe();
    }

    updateMesh() {
        
        const { scene } = this;

        if (!scene) return;

        if (this.bodyMesh)
            this.bodyMesh.forEach(m => this.scene?.remove(m));

        this.bodyMesh = [];
        /*
        par.update(this.props.points);
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } );
        this.bodyMesh = new THREE.Mesh( par, material );
        scene.add( this.bodyMesh );
        */

        const { bodyPoints, sidePoints, frontPoints, topPoints, wireframes, flatShading } = this.props;

        const wireframesColor = 0x00FF00;

        const parts = [
            { parity: generationParity.Odd, color: 0xEB7D09 },
            { parity: generationParity.Even, color: 0x000000 }          
        ];

        for (const p of parts) {
            const body = new BodyShape(bodyPoints.x, bodyPoints.y, bodyPoints.z, p.parity);
            body.apply(sidePoints, frontPoints, topPoints );
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

    init()
    {
        this.scene = new THREE.Scene();
    
        // The X axis is red. The Y axis is green. The Z axis is blue.
        var axesHelper = new THREE.AxesHelper( 500 );
        this.scene.add( axesHelper );

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.z = 1000;
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

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
    }

    ang = 0;
    animate()
    {
        const { renderer, scene, camera, orbitControls } = this;

        requestAnimationFrame(this.animate);

       
        this.ang += 0.01;
        const vec = new Vector3(500, 600, 700);
        vec.applyAxisAngle(new Vector3(0, 1, 0), this.ang);

        this.light?.position?.set(vec.x, vec.y, vec.z);

        orbitControls?.update();

        if (renderer && scene && camera) {
            renderer.render( scene, camera );
        }
    }

    onContainerCreated(d: HTMLDivElement | null) {
        const firstInit = this.container == null;

        this.container = d;
        if (d && this.renderer?.domElement)
        {
            this.renderer.setSize( d.offsetWidth - 4, d.offsetHeight - 4 );

            if (firstInit) {
                this.updateMesh();
                this.container?.appendChild?.(this.renderer.domElement);                
            }
        }
/*
        window.addEventListener("resize", () => {
            const { renderer, camera, container } = this;

            if (renderer && container && camera) {
                const newWidth = container.offsetWidth - 10;
                const newHeight = container.offsetHeight - 10;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        });
*/
    }

    public render() {
        return (
            <div className="three-container">
                <div className="three-container" ref={(d) => this.onContainerCreated(d)} />
            </div>
        )
    }
}