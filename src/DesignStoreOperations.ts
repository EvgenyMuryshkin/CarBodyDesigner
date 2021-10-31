import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { BodyShape } from "./BodyShape";
import { Dialogs, Forms } from "./components";
import { IDesignStoreState, IStorageModel } from "./DesignStore";
import { generationParity } from "./SidePlane";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { MathUtils } from "three";
import * as THREE from "three";
import { DesignTools } from "./DesignTools";
import axios from "axios";
import { Tools } from "./lib/tools";
import { Wheels } from "./Wheels";
import { IRenderSettings } from "./lib";

export class DesignStoreOperations {
    constructor(private designStoreState: IDesignStoreState, private renderSettings: IRenderSettings) {

    }

    exportText(content: string, contentType: string, fileName: string) {
        const blob = new Blob( [ content ], { type: contentType } );
        this.exportBlob(blob, fileName);
    }

    exportBlob(blob: Blob, fileName: string) {
        const link = document.createElement( 'a' );
        link.style.display = 'none';
        document.body.appendChild( link );
    
        link.href = URL.createObjectURL( blob );
        link.download = fileName;
        link.click();
    
        link.remove();
    }

    async exportSTL() {
        const { renderWheels } = this.renderSettings;
        const { design } = this.designStoreState;
        if (!design) return;

        const params = await Forms.Modal("Export to STL", {
            stringName: `${design.name}.stl`,
            intXRotationDeg: 90,
            intYRotationDeg: 0,
            intZRotationDeg: 0
        });
    
        if (!params) return;
    
        const { boxSize, topPoints, frontPoints, sidePoints, wheels } = design;
        const exporter = new STLExporter();
        const bodyShape = new BodyShape(boxSize.x, boxSize.y, boxSize.z, generationParity.All);
        const designTools = new DesignTools(design);
        const interpolatedSegments = designTools.interpolateSections();
        bodyShape.applyContour(sidePoints, frontPoints, topPoints, wheels, interpolatedSegments );

        const finalGeometry = bodyShape.geometry;

        if (renderWheels) {
            const wheelsBuilder = new Wheels(boxSize.x, boxSize.y, boxSize.z);
            finalGeometry.push(...wheelsBuilder.geometry(wheels));
        }

        const singleGeometry = mergeBufferGeometries(finalGeometry);
        
        singleGeometry.rotateX(MathUtils.degToRad(params.intXRotationDeg));
        singleGeometry.rotateY(MathUtils.degToRad(params.intYRotationDeg));
        singleGeometry.rotateZ(MathUtils.degToRad(params.intXRotationDeg));
    
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        const mesh = new THREE.Mesh( singleGeometry, material );
    
        const stl = exporter.parse(mesh);
        this.exportText(stl, 'text/plain', params.stringName || "test.stl");
    }

    async loadSampleDesigns() {
        if (!await Dialogs.Confirm("Load sample designs?")) return;

        const { designStore } = this.designStoreState;        
        const response = await axios.get("/SampleDesigns.json");
        designStore.replaceStorageModel(response.data);
    }

    async downloadDesigns() {
        const { storageModel } = this.designStoreState;        
        
        const params = await Forms.Modal("Download designs", {
            stringName: `CarBodyDesigns.json`
        });
    
        if (!params) return;
        const json = JSON.stringify(storageModel, null, 2);
        this.exportText(json, 'application/json', params.stringName || "CarBodyDesigns.json");
    }

    async uploadDesigns() {
        const params = await Forms.Modal("Upload designs", {
            flagAppendToExisting: false
        });
        if (!params) return;
        const { designStore } = this.designStoreState;        

        const fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        fileInput.setAttribute("accept", "application/json");

        fileInput.onchange = () => {
            const file = fileInput?.files?.[0];
            if (!file) return;

            let fr = new FileReader();
            fr.onload = async (ev) => {
                if (ev?.target?.result) {
                    const parsed = JSON.parse(ev?.target?.result?.toString()) as IStorageModel;
                    if (!parsed.version) {
                        await Dialogs.Notification("Provided file is not a designs model");
                        return;
                    }

                    if (params.flagAppendToExisting) {
                        designStore.appendStorageModel(parsed);
                    }
                    else {
                        designStore.replaceStorageModel(parsed);
                    }
                }
            };
            fr.readAsText(file);
        };

        document.body.appendChild( fileInput );
    
        fileInput.click();    
        fileInput.remove();
    }

    async resetAll() {
        const { designStore } = this.designStoreState;        
        if (!await Dialogs.Confirm("Reset all designs?")) return;
        designStore.resetAll();
    }

    async newDesign() {
        const { designStore } = this.designStoreState;        

        const now = new Date();
        const newDesign = await Forms.Modal(
            "New Design", 
            {
                stringName: `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
            }
        );
    
        if (newDesign) {
            const design = designStore.newDesing(newDesign.stringName);
            designStore.updateDesign(design);
        }
    }

    async cloneDesign() {
        const { design, designStore } = this.designStoreState;

        if (!design) return;
        const now = new Date();
    
        const cloneDesignParams = await Forms.Modal(
            "Clone Design", 
            {
                stringName: `${design.name} - ${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`
            }
        );
        if (!cloneDesignParams) return;
        const clonedDesign = Tools.clone(design);
        clonedDesign.name = cloneDesignParams.stringName;
        designStore.updateDesign(clonedDesign);  
    }

    async deleteDesign() {
        const { design, designStore } = this.designStoreState;

        if (!design) return;
        if (!await Dialogs.Confirm(`Delete ${design.name}`)) return;
    
        designStore.deleteDesign(design);
    }

    async settings() {
        const { design, designStore } = this.designStoreState;
        if (!design) return;
    
        const settings = await Forms.Modal(design.name, {
            stringName: design.name,
            colorOdd: design.colorOdd,
            colorEven: design.colorEven,
            colorWheels: design.colorWheels
        });
        if (!settings) return;
        designStore.updateDesign(design, (d) => {
            d.name = settings.stringName;
            d.colorOdd = settings.colorOdd;
            d.colorEven = settings.colorEven;
            d.colorWheels = settings.colorWheels;
        });
    }
}