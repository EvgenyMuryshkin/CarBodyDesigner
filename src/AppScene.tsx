import React from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Geom } from "./Geom";
import { IPoint2D } from "./lib";

class ProjectionPoint {
    public x = 0;
    public y = 0;
    public z = 0;
}

// https://dustinpfister.github.io/2018/04/13/threejs-orbit-controls/
// https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse
// https://threejs.org/docs/#examples/en/controls/OrbitControls

export interface IProps {
    length: number;
    points: IPoint2D[];
}

export class AppScene extends React.Component<IProps> {
    scene: THREE.Scene | null = null;
    camera: THREE.PerspectiveCamera | null = null;
    renderer: THREE.WebGLRenderer | null = null;
    bodyMesh: THREE.Mesh | null = null;
    orbitControls: OrbitControls | null = null;

    container: HTMLDivElement | null = null;
    par: Geom | null = null;

    public constructor(props: IProps)
    {
        super(props);
        this.par = new Geom(props.length, 300, 200)
        this.animate = this.animate.bind(this);
    }

    componentDidMount() {
        this.init();
        requestAnimationFrame(this.animate);
    }

    componentDidUpdate() {
        this.updateMesh();
    }

    updateMesh() {
        const { par, scene } = this;

        if (!scene || !par) return;

        if (this.bodyMesh)
            this.scene?.remove(this.bodyMesh);

        par.update(this.props.points);
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } );
        this.bodyMesh = new THREE.Mesh( par, material );
        scene.add( this.bodyMesh );
    }

    init()
    {
        const { par } = this;
        if (!par) return;

        this.scene = new THREE.Scene();
    
        // The X axis is red. The Y axis is green. The Z axis is blue.
        var axesHelper = new THREE.AxesHelper( 500 );
        this.scene.add( axesHelper );

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.z = 1000;
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    animate()
    {
        const { renderer, scene, camera, orbitControls } = this;

        requestAnimationFrame(this.animate);

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
            <div className="three-container" ref={(d) => this.onContainerCreated(d)} />
        )
    }
}