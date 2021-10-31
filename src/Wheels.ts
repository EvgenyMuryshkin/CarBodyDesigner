import * as THREE from 'three';
import { BaseBodyShape } from "./BodyShapeTypes";
import { IWheelModel } from './components/drawing-model';

export class Wheels extends BaseBodyShape {
    geometry(wheels: IWheelModel[]) {
        const result: THREE.BufferGeometry[] = [];
        const scale = 5;

        const wheelGeometry = (wheel: IWheelModel) => {
            const radius = Math.min(wheel.wheelRadius, wheel.arcRadius - 0.5);

            const wheelGeometry = new THREE.CylinderGeometry( 
                radius * scale, 
                radius * scale, 
                wheel.width * scale, 
                32 
            );

            wheelGeometry.rotateX(Math.PI / 2);
            return wheelGeometry;
        }

        for (const wheel of wheels) {

            const wheel1 = wheelGeometry(wheel);

            wheel1.translate(
                wheel.center.x * scale, 
                wheel.center.y * scale,
                (this.halfWidth - wheel.offset) * scale - wheel.width * scale / 2
            );

            result.push(wheel1);

            const wheel2 = wheelGeometry(wheel);

            wheel2.translate(
                wheel.center.x * scale, 
                wheel.center.y * scale,
                (this.halfWidth + wheel.offset) * scale + wheel.width * scale / 2
            );

            result.push(wheel2);
        }
        
        return result;
    }
}