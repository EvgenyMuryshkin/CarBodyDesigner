import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { BodyShape } from "./BodyShape";
import { Dialogs, Forms } from "./components";
import { IDesignStoreState, IStorageModel } from "./DesignStore";
import { generationParity } from "./SidePlane";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { FogExp2, MathUtils } from "three";
import * as THREE from "three";
import { DesignTools } from "./DesignTools";
import axios from "axios";

export class DesignStoreOperations {
    constructor(private designStoreState: IDesignStoreState) {

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
        const singleGeometry = mergeBufferGeometries(bodyShape.geometry);
        
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
        const response = await axios.get("SampleDesigns.json");
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
}