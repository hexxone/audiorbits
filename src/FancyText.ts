
import * as THREE from 'three';


export class FancyText {

    private scene: THREE.Scene;

    private mesh: THREE.Mesh;

    constructor(scene: THREE.Scene, CPos: THREE.Vector3, text: string, hideAfter: number = 6, font: string = "css/HEXAGON_cup_font.json") {
        this.scene = scene;

        const loader = new THREE.FontLoader();
        loader.load(font, (font) => {

            const geometry = new THREE.TextGeometry(text, {
                font: font,
                size: 200,
                height: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });

            const textMaterial = new THREE.MeshPhongMaterial(
                { color: 0xffffff, specular: 0xffffff }
            );

            const mesh = new THREE.Mesh(geometry, textMaterial);
            mesh.position.set(CPos.x, CPos.y, CPos.z);
            this.mesh = mesh;
            scene.add(mesh);
        });

        // hide again
        setTimeout(() => this.Hide(), hideAfter * 1000);
    }

    public Hide() {
        this.scene.remove(this.mesh);
    }
}