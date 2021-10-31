import { IWheelModel } from "./components/drawing-model";
import { Generate, IPoint2D, IPoint3D } from "./lib";
import * as Rx from "rxjs";

export interface IDesign {
    name: string;
    boxSize: IPoint3D;
    sidePoints: IPoint2D[];
    frontPoints: IPoint2D[];
    topPoints: IPoint2D[];
    colorOdd: number;
    colorEven: number;
    colorWheels: number;
    wheels: IWheelModel[];
    frontSegments: IPoint2D[][];
}
  
export interface IStorageModel {
    version: number;
    designs: IDesign[];
}

export interface IDesignStore {
    replaceStorageModel(storageModel: IStorageModel): void;
    appendStorageModel(storageModel: IStorageModel): void;
    resetAll(): void;
    newDesing(name: string): IDesign;
    updateDesign(design: IDesign | null, update?: (design: IDesign) => void): void;
    deleteDesign(design: IDesign | null): void;
}

export interface IDesignStoreState {
    designStore: IDesignStore;
    storageModel: IStorageModel | null;
    design: IDesign | null;
}

export class DesignStore {
    _stream: Rx.BehaviorSubject<IDesignStoreState>;

    constructor() {
        this._stream = new Rx.BehaviorSubject<IDesignStoreState>({ 
            designStore: this, 
            storageModel: this.defaultStorageModel(), 
            design: null
        });
    }

    get hasStoredDesigns() {
        return localStorage.getItem("Designs") !== null;
    }

    initializeFromStorage() {
        this.updateDesign(null);
    }

    subscribe(handler: (state: IDesignStoreState) => void) {
        this._stream.subscribe(handler);
    }

    get state() {
        return this._stream.value;
    }

    defaultStorageModel(): IStorageModel {
        return { version: 1, designs: [this.newDesing("Default")] }
    }

    migrate(model: IStorageModel) {
        model.designs.forEach(d => {
            if (!d.wheels) d.wheels = [];
            d.wheels.forEach(w => {
                if (!w.offset) w.offset = 10;
                if (!w.width) w.width = 10;
            });

            if (!d.frontSegments) d.frontSegments = [];

            if (d.colorWheels === undefined)
                d.colorWheels = 0x202020;
        });
    }

    loadFromLocalStorage() : IStorageModel {
        const json = localStorage.getItem("Designs");
        if (!json) return this.defaultStorageModel();
    
        const model = JSON.parse(json) as IStorageModel;
        this.migrate(model);
        
        return model;
    }

    saveStorageModel(model: IStorageModel) {
        if (!model) return;

        const payload = JSON.stringify(model);
        localStorage.setItem("Designs", payload);
    }

    saveToLocalStorage(design: IDesign | null, update?: (design: IDesign) => void) {
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

    deleteDesign(design: IDesign | null) {
        if (!design) return;
        const model = this.loadFromLocalStorage();
        model.designs = model.designs.filter(d => d.name !== design.name);
        this.saveStorageModel(model);
        this.updateDesign(null);
    }

    updateDesign(design: IDesign | null, update?: (design: IDesign) => void) {
        if (design) {
            this.saveToLocalStorage(design, update);
        }

        this.setActiveDesign(design);
    }

    setActiveDesign(design: IDesign | null) {
        const storageModel = this.loadFromLocalStorage();

        const newState: IDesignStoreState = {
            designStore: this,
            storageModel: storageModel, 
            design: storageModel.designs.find(d => d.name === design?.name) || storageModel.designs[0]
        }

        this._stream.next(newState);
    }

    newDesing(name: string): IDesign {
        const boxSize: IPoint3D = {x: 101, y: 41, z: 31};
        const sidePoints = Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.z }));
        const frontPoints = Generate.range(0, boxSize.y).map(i => ({ x: i, y: boxSize.z }));
        const topPoints = Generate.range(0, boxSize.x).map(i => ({ x: i, y: boxSize.y }));
    
        return {
            name,
            boxSize,
            sidePoints,
            frontPoints,
            topPoints,
            colorOdd: 0xEB7D09,
            colorEven: 0x000000,
            colorWheels: 0x202020,
            wheels: [],
            frontSegments: []
        }
    }

    resetAll() {
        this.saveStorageModel(this.defaultStorageModel());
        this.setActiveDesign(null);
    }

    replaceStorageModel(storageModel: IStorageModel) {
        this.migrate(storageModel);
        this.saveStorageModel(storageModel ?? this.defaultStorageModel());
        this.setActiveDesign(null);
    }

    appendStorageModel(appendStorageModel: IStorageModel) {
        const { storageModel } = this._stream.value;
        if (!storageModel) return;

        this.migrate(storageModel);
        storageModel.designs.push(...appendStorageModel.designs);
        this.replaceStorageModel(storageModel);
    }
}