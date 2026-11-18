// commit test -----
import * as CG from './transforms.js';
import { Matrix, Vector } from "./matrix.js";

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = true;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;

        // Image inside cube
        this.cubeImage = new Image();
        this.cubeImage.onload = () => this.draw();
        this.cubeImage.src = './hehe-boi.png';
    }

    // Rotate animated models around their own centers
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation

        // Go through each model in the scene
        for (let model of this.scene.models) {

            // Skip models without animation
            if (!model.animation) {
                continue;
            }

            // Get the rotation axis and speed
            let axis = model.animation.axis;
            let rps = model.animation.rps;

            let seconds = time / 1000; // Convert milliseconds to seconds

            let angle = 2 * Math.PI * rps * seconds; // Calculate the rotation angle in radians

            let center = model.center;

            // Find the center of generic models
            if (!center) {
                let minX = Infinity;
                let minY = Infinity;
                let minZ = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;
                let maxZ = -Infinity;

                // Find the smallest and largest coordinates
                for (let vertex of model.vertices) {
                    minX = Math.min(minX, vertex.x);
                    minY = Math.min(minY, vertex.y);
                    minZ = Math.min(minZ, vertex.z);

                    maxX = Math.max(maxX, vertex.x);
                    maxY = Math.max(maxY, vertex.y);
                    maxZ = Math.max(maxZ, vertex.z);
                }

                // Calculate the center using the minimum and maximum values
                center = CG.Vector4(
                    (minX + maxX) / 2,
                    (minY + maxY) / 2,
                    (minZ + maxZ) / 2,
                    1
                );
            }

            // Store the center coordinates
            let cx = center.x;
            let cy = center.y;
            let cz = center.z;

            // Cone center is at the base, so move it halfway up
            if (model.type === 'cone') {
                cy += model.height / 2;
            }

            // Move the model's center to the origin before rotating
            let translate1 = new Matrix(4, 4);
            translate1.values = [
                [1, 0, 0, -cx],
                [0, 1, 0, -cy],
                [0, 0, 1, -cz],
                [0, 0, 0, 1]
            ];

            // Create the rotation matrix using sine and cosine
            let rotate = new Matrix(4, 4);
            let c = Math.cos(angle);
            let s = Math.sin(angle);

            // Rotate around the x-axis
            if (axis === 'x') {
                rotate.values = [
                    [1, 0, 0, 0],
                    [0, c, -s, 0],
                    [0, s, c, 0],
                    [0, 0, 0, 1]
                ];
            }

            // Rotate around the y-axis
            else if (axis === 'y') {
                rotate.values = [
                    [c, 0, s, 0],
                    [0, 1, 0, 0],
                    [-s, 0, c, 0],
                    [0, 0, 0, 1]
                ];
            }

            // Rotate around the z-axis
            else if (axis === 'z') {
                rotate.values = [
                    [c, -s, 0, 0],
                    [s, c, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ];
            }
            else {
                continue; // Skip models with an invalid rotation axis
            }

            // Move the model back to its original center
            let translate2 = new Matrix(4, 4);
            translate2.values = [
                [1, 0, 0, cx],
                [0, 1, 0, cy],
                [0, 0, 1, cz],
                [0, 0, 0, 1]
            ];

            // Combine the matrices to rotate the model around its center
            model.matrix = Matrix.multiply([
                translate2,
                rotate,
                translate1
            ]);
        }
    }


    //
    rotateLeft() {
        this.rotateView(Math.PI / 180);
        // let view = this.scene.view;

        // // Direction from camera position to target
        // let direction = view.srp.subtract(view.prp);

        // const rotation = new Matrix(4, 4);
        // CG.mat4x4RotateY(rotation, Math.PI / 180);

        // const direction4 = CG.Vector4(direction.x, direction.y, direction.z, 0);
        // const rotated = rotation.mult(direction4);
    }
    
    //
    rotateRight() {
       this.rotateView(-Math.PI / 180);
        // const view = this.scene.view;
        // const direction = view.srp.subtract(view.prp);

        // const rotation = new Matrix(4, 4);
        // CG.mat4x4RotateY(rotation, -Math.PI / 180);

        // const direction4 = CG.Vector4(direction.x, direction.y, direction.z, 0);
        // const rotated = rotation.mult(direction4);
        // const [x, y, z] = rotated.values.map(row => row[0]);

        // view.srp = view.prp.add(CG.Vector3(x, y, z));
    }
    
    rotateView(angle) {
        const view = this.scene.view;
        const direction = view.srp.subtract(view.prp);

        const n = view.prp.subtract(view.srp);
        n.normalize();

        const u = view.vup.cross(n);
        u.normalize();

        const v = n.cross(u);

        const forward = CG.Vector3(direction.x,
    direction.y, direction.z);
        forward.scale(Math.cos(angle));

        const sideways = v.cross(direction);
        sideways.scale(Math.sin(angle));

        view.srp = view.prp.add(forward.add(sideways));
    }

    //
    moveLeft() {
        let view = this.scene.view;
        let n = view.prp.subtract(view.srp);
        let u = view.vup.cross(n);
        u.normalize();
        u.scale(1);
        view.prp = view.prp.subtract(u);
        view.srp = view.srp.subtract(u);
    }
    
    //
    moveRight() {
        let view = this.scene.view;
        let n = view.prp.subtract(view.srp);
        let u = view.vup.cross(n);
        u.normalize();
        u.scale(1);
        view.prp = view.prp.add(u);
        view.srp = view.srp.add(u);
    }
    
    //
    moveBackward() {
        let view = this.scene.view;
        let n = view.prp.subtract(view.srp);
        n.normalize();
        n.scale(1);
        view.prp = view.prp.add(n);
        view.srp = view.srp.add(n);
    }
    
    //
    moveForward() {
        let view = this.scene.view;
        let n = view.prp.subtract(view.srp);
        n.normalize();
        n.scale(1);
        view.prp = view.prp.subtract(n);
        view.srp = view.srp.subtract(n);
    }

    //
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D
        //     * translate/scale to viewport (i.e. window)
        //     * draw line

        const {prp, srp, vup, clip} = this.scene.view;
        const viewMatrix = CG.mat4x4Perspective(prp, srp, vup, clip);
        const projection = CG.mat4x4MPer();
        const viewport = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);

        for (const model of this.scene.models) {
            const modelView =
        viewMatrix.mult(model.matrix);
            const transformedVertices = model.vertices.map(
                vertex => Matrix.multiply([modelView, vertex])
            );

        if (model.type === 'cube' && this.cubeImage.naturalWidth > 0) {
            const center = Matrix.multiply([modelView, model.center]);

            if (this.outcodePerspective(center, -clip[4] / clip[5]) === 0) {
                const projected = Matrix.multiply([projection, center]);
                const screen = Matrix.multiply([
                    viewport,
                    CG.Vector4(
                        projected.x / projected.w,
                        projected.y / projected.w,
                        0,
                        1
                    )
                ]);

                const imageWorldWidth = 1;
                const distance = -center.z * clip[5];

                const width = (
                    this.canvas.width * clip[4] * imageWorldWidth
                ) / ((clip[1] - clip[0]) * distance);
                
                const height = width * this.cubeImage.naturalHeight
                    / this.cubeImage.naturalWidth;

                this.ctx.save();
                this.ctx.translate(screen.x, screen.y);
                this.ctx.rotate(Math.PI);

                this.ctx.drawImage(
                    this.cubeImage,
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );

                this.ctx.restore();
            }
        }

            for (const edge of model.edges) {
                for (let i = 0; i < edge.length - 1; i++) {
                    const line = {
                        pt0: transformedVertices[edge[i]],
                        pt1: transformedVertices[edge[i + 1]]
                    };
                    const clipped = 
            this.clipLinePerspective(line, -clip[4] / clip[5]);
                
                if (clipped === null) {
                    continue;
                }

                const projected0 = Matrix.multiply([projection, clipped.pt0]);
                const projected1 = Matrix.multiply([projection, clipped.pt1]);

                const x0 = projected0.x / projected0.w;
                const y0 = projected0.y / projected0.w;
                const x1 = projected1.x / projected1.w;
                const y1 = projected1.y / projected1.w;
                const screen0 = Matrix.multiply([viewport,
                    CG.Vector4(x0, y0, 0, 1)]);
                const screen1 = Matrix.multiply([viewport,
                    CG.Vector4(x1, y1, 0, 1)]);

                    this.drawLine(screen0.x, screen0.y, screen1.x,
                        screen1.y);
                }
            }
        }
    }

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = CG.Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
        let p1 = CG.Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        while (true) {
            if ((out0 | out1) === 0) {
                return {
                    pt0: CG.Vector4(p0.x, p0.y, p0.z, line.pt0.w),
                    pt1: CG.Vector4(p1.x, p1.y, p1.z, line.pt1.w)
                };
            }

            if ((out0 & out1) !== 0) {
                return null;
            }

            const clipFirst = out0 !== 0;
            const outsideCode = clipFirst ? out0 : out1;
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const dz = p1.z - p0.z;
            let t;

            if ((outsideCode & NEAR) !== 0) {
                t = (z_min - p0.z) / dz;
            } else if ((outsideCode & FAR) !== 0) {
                t = (-1 - p0.z) / dz;
            } else if ((outsideCode & LEFT) !== 0) {
                t = (p0.z - p0.x) / (dx - dz);
            } else if((outsideCode & RIGHT) !== 0) {
                t = (-p0.z - p0.x) / (dx + dz);
            } else if ((outsideCode & TOP) !== 0) {
                t = (-p0.z - p0.y) / (dy + dz);
            } else if ((outsideCode & BOTTOM) !== 0) {
                t = (p0.z - p0.y) / (dy - dz);
            }
            else {
                return null;
            }

            const intersection = CG.Vector3(
                p0.x + t * dx,
                p0.y + t * dy,
                p0.z + t * dz
            );

            if (clipFirst) {
                p0 = intersection;
                out0 = this.outcodePerspective(p0, z_min);
            } else {
                p1 = intersection;
                out1 = this.outcodePerspective(p1, z_min);
            }
        }
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: CG.Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: CG.Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: CG.Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            if (model.type === 'generic') {
                model.vertices = [];
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(CG.Vector4(scene.models[i].vertices[j][0],
                                                   scene.models[i].vertices[j][1],
                                                   scene.models[i].vertices[j][2],
                                                   1));
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            }
            else {
                model.center = CG.Vector4(scene.models[i].center[0],
                                         scene.models[i].center[1],
                                         scene.models[i].center[2],
                                         1);
                for (let key in scene.models[i]) {
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }
            

            // Generate vertices and edges for the different shapes (common models) - when program loads a scene:
            if (model.type === 'cube') {
                this.createCube(model);
            }
            else if (model.type === 'cone') {
                this.createCone(model);
            }
            else if (model.type === 'cylinder') {
                this.createCylinder(model);
            }
            else if (model.type === 'sphere') {
                this.createSphere(model);
            }

            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }
    
    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0); // move to the first point
        this.ctx.lineTo(x1, y1); // draw a line to the second point
        this.ctx.stroke(); // draw the line on the canvas

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }


    // Create a cube with 8 corner points and 12 edges - using its center, width, height, and depth
    createCube(model) {
        let x = model.center.x;
        let y = model.center.y;
        let z = model.center.z;

        // Divide the dimensions in half to find the corners
        let w = model.width / 2;
        let h = model.height / 2;
        let d = model.depth / 2;

        // Create the 4 corner points on the back face
        model.vertices = [
            CG.Vector4(x-w, y-h, z-d, 1),
            CG.Vector4(x+w, y-h, z-d, 1),
            CG.Vector4(x+w, y+h, z-d, 1),
            CG.Vector4(x-w, y+h, z-d, 1),
            // Create the 4 corner points on the front face
            CG.Vector4(x-w, y-h, z+d, 1),
            CG.Vector4(x+w, y-h, z+d, 1),
            CG.Vector4(x+w, y+h, z+d, 1),
            CG.Vector4(x-w, y+h, z+d, 1)
        ];

        model.edges = [
            [0, 1, 2, 3, 0],  // Connects points around the back face
            [4, 5, 6, 7, 4],  // Connects points around the front face
            // Connects the back face to the front face:
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7]
        ];
    }


    // Create a cone with a circular base and one top point
    createCone(model) {
        model.vertices = [];
        model.edges = [];

        // Get the center of the cone
        let x = model.center.x;
        let y = model.center.y;
        let z = model.center.z;

        let sides = model.sides;

        // Create the points around the circular base
        for (let i = 0; i < sides; i++) {
            let angle = 2 * Math.PI * i / sides;

            let px = x + model.radius * Math.cos(angle);
            let pz = z + model.radius * Math.sin(angle);

            model.vertices.push(CG.Vector4(px, y, pz, 1));
        }

        // The last vertex is the top of the cone
        model.vertices.push(CG.Vector4(x, y + model.height, z, 1));

        for (let i = 0; i < sides; i++) {
            let next = (i + 1) % sides;  // '% sides' connects the last base vertex back to the first to close the circle

            // Connects points around the base
            model.edges.push([i, next]);

            // Connects each base point to the top
            model.edges.push([i, sides]);
        }
    }

    // Generate a cylinder using two circular bases
    createCylinder(model) {
        model.vertices = [];
        model.edges = [];

        // Get the center of the cylinder
        let x = model.center.x;
        let y = model.center.y;
        let z = model.center.z;

        let sides = model.sides;
        let halfHeight = model.height / 2;

        // Create one bottom and one top vertex for each side
        for (let i = 0; i < sides; i++) {
            let angle = 2 * Math.PI * i / sides;

            let px = x + model.radius * Math.cos(angle);
            let pz = z + model.radius * Math.sin(angle);

            // Bottom and top vertices
            model.vertices.push(CG.Vector4(px, y - halfHeight, pz, 1));
            model.vertices.push(CG.Vector4(px, y + halfHeight, pz, 1));
        }

        // Connect the two circular bases and their matching points
        for (let i = 0; i < sides; i++) {
            let next = (i + 1) % sides;

            let bottom = i * 2;
            let top = bottom + 1;

            let nextBottom = next * 2;
            let nextTop = nextBottom + 1;

            // Connect points around the bottom base
            model.edges.push([bottom, nextBottom]);

            // Connect points around the top base
            model.edges.push([top, nextTop]);

            // Connect the bottom points to the top points
            model.edges.push([bottom, top]);
        }
    }

    // Generate a sphere using latitude and longitude lines
    createSphere(model) {
        model.vertices = [];
        model.edges = [];

        // Get the center of the sphere
        let x = model.center.x;
        let y = model.center.y;
        let z = model.center.z;

        let slices = model.slices;
        let stacks = model.stacks;
        let radius = model.radius;

        // Create the vertices for each latitude and longitude:
        for (let i = 0; i <= stacks; i++) { // Loop through each latitude level from top to bottom
            let phi = Math.PI * i / stacks;

            for (let j = 0; j < slices; j++) { // Create points around each latitude circle
                let theta = 2 * Math.PI * j / slices;

                // Calculate the x, y, and z positions of each point
                let px = x + radius * Math.sin(phi) * Math.cos(theta);
                let py = y + radius * Math.cos(phi);
                let pz = z + radius * Math.sin(phi) * Math.sin(theta);

                model.vertices.push(CG.Vector4(px, py, pz, 1));
            }
        }

        // Connect the vertices to form the sphere's wireframe
        for (let i = 0; i <= stacks; i++) {
            for (let j = 0; j < slices; j++) {
                let current = i * slices + j;
                let next = i * slices + (j + 1) % slices;

                // Connect points around each latitude
                model.edges.push([current, next]);

                // Connect points between latitudes
                if (i < stacks) {
                    model.edges.push([current, current + slices]);
                }
            }
        }
    }


};

export { Renderer };
