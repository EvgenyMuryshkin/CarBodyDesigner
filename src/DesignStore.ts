import { IWheelModel } from "./components/drawing-model";
import { IPoint2D, IPoint3D } from "./lib";

export interface IDesign {
    name: string;
    boxSize: IPoint3D;
    sidePoints: IPoint2D[];
    frontPoints: IPoint2D[];
    topPoints: IPoint2D[];
    colorOdd: number;
    colorEven: number;
    wheels: IWheelModel[];
}
  
export interface IStorageModel {
    designs: IDesign[];
}

export class DesignStore {
    static loadFromLocalStorage() : IStorageModel {
        const json = localStorage.getItem("Designs");
        if (!json) return { designs: [] }
    
        const model = JSON.parse(json) as IStorageModel;
        model.designs.forEach(d => {
            if (!d.wheels) d.wheels = [];
            d.wheels.forEach(w => {
                if (!w.offset) w.offset = 10;
                if (!w.width) w.width = 10;
            })
        });
        
        return model;
    }

    static saveStorageModel(model: IStorageModel) {
        if (!model) return;

        const payload = JSON.stringify(model);
        localStorage.setItem("Designs", payload);
    }

    static saveToLocalStorage(design: IDesign | null, update?: (design: IDesign) => void) {
        if (!design) return;
    
        const model = this.loadFromLocalStorage()
        model.designs = model.designs.map(d => {
            if (d.name === design.name) {
                update?.(design);
                return design;
            }

            return d;
        });
        if (!model.designs.includes(design)) model.designs.push(design);
    
        this.saveStorageModel(model);
    }

    static deleteDesign(design: IDesign | null) {
        if (!design) return;
        const model = this.loadFromLocalStorage();
        model.designs = model.designs.filter(d => d.name !== design.name);
        this.saveStorageModel(model);
        return { 
            storageModel: model, 
            design: model.designs[0] || null
        }
    }

    static updateDesign(design: IDesign | null, update?: (design: IDesign) => void) {
        if (!design) return;
        this.saveToLocalStorage(design, update);
        const storageModel = this.loadFromLocalStorage();

        return { 
            storageModel, 
            design: storageModel.designs.find(d => d.name === design.name) || null
        }
    }
}