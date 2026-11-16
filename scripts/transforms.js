import { Matrix, Vector } from "./matrix.js";

// create a 4x4 matrix to the perspective projection / view matrix
// Nper calculation
function mat4x4Perspective(prp, srp, vup, clip) { 
    // 1. translate PRP to origin
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    // 3. shear such that CW is on the z-axis
    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])

    // convert prp, srp, vup to vectors
    prp = Vector3(prp[0], prp[1], prp[2]);
    srp = Vector3(srp[0], srp[1], srp[2]);
    vup = Vector3(vup[0], vup[1], vup[2]);

    // read the window boundaries and clipping distance
    let left = clip[0];
    let right = clip[1];
    let bottom = clip[2];
    let top = clip[3];
    let near = clip[4];
    let far = clip[5];

    // ---Step 1
    let translate = new Matrix(4, 4); // create a new 4x4 matrix to translate PRP to origin
    mat4x4Translate(translate, -prp.x, -prp.y, -prp.z); // translate PRP to origin

    // ---Step 2
    let n = prp.subtract(srp); // n-axis points from the SRP toward the PRP
    n.normalize();            // make n a unit vector
    let u = vup.cross(n); // u-axis points to the right
    u.normalize();        // make u a unit vector
    let v = n.cross(u); // v-axis points up in the VRC

    // put the VRC axes in the rows of the rotation matrix
    let rotate = new Matrix(4, 4); // matrix R
    rotate.values = [
        [u.x, u.y, u.z, 0], 
        [v.x, v.y, v.z, 0], 
        [n.x, n.y, n.z, 0], 
        [0, 0, 0, 1]       
    ];

    // ---Step 3
    // dop is cw - prp. In vrc, prp is already at the origin
    let dop = Vector3((left + right) / 2, (bottom + top) / 2, -near); 
    
    let shear = new Matrix(4, 4); // SHpar
    mat4x4ShearXY(shear, -dop.x / dop.z, -dop.y / dop.z); 

    // ---Step 4
    // perspective scale matrix Sper
    let scale = new Matrix(4, 4);
    mat4x4Scale(scale, 
        (2 * near) / ((right - left) * far),
        ((2 * near) / ((top - bottom) * far)), 
        1 / far); // scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])

    // combine the transformations into a single matrix to get Nper
    let transform = Matrix.multiply([scale, shear, rotate, translate]);
    return transform;
}

// create a 4x4 matrix to project a perspective image on the z=-1 plane
function mat4x4MPer() {
    let mper = new Matrix(4, 4);
    // mper.values = ...;
    mper.values = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, -1, 0]];    
    return mper;
}

// create a 4x4 matrix to translate/scale projected vertices to the viewport (window)
function mat4x4Viewport(width, height) { // take the Canvas dimensions in pixels
    // horizontal scale factor and half the window width
    let halfWidth = width / 2;
    // vertical scale factor and half the window height
    let halfHeight = height / 2;

    // viewport matrix V, with the Y row adapted for Canvas
    let viewport = new Matrix(4, 4);
    viewport.values = [[halfWidth, 0, 0, halfWidth], [0, -halfHeight, 0, halfHeight], [0, 0, 1, 0], [0, 0, 0, 1]];
    return viewport;
}

////////////////////////////
// 4x4 Transform Matrices 
////////////////////////////                                                        
// set values of existing 4x4 matrix to the identity matrix
function mat4x4Identity(mat4x4) { 
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the translate matrix
function mat4x4Translate(mat4x4, tx, ty, tz) {
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, 0, tx],
                     [0, 1, 0, ty],
                     [0, 0, 1, tz],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the scale matrix
function mat4x4Scale(mat4x4, sx, sy, sz) {
    // mat4x4.values = ...;
    mat4x4.values = [[sx, 0, 0, 0],
                     [0, sy, 0, 0],
                     [0, 0, sz, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about x-axis matrix
function mat4x4RotateX(mat4x4, theta) { // x stays the same, y and z change
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, 0, 0],
                     [0, Math.cos(theta), -Math.sin(theta), 0],
                     [0, Math.sin(theta), Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about y-axis matrix
function mat4x4RotateY(mat4x4, theta) { // y stays the same, x and z change
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta), 0, Math.sin(theta), 0],
                     [0, 1, 0, 0],
                     [-Math.sin(theta), 0, Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about z-axis matrix
function mat4x4RotateZ(mat4x4, theta) { // z stays the same, x and y change
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta), -Math.sin(theta), 0, 0],
                     [Math.sin(theta), Math.cos(theta), 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the shear parallel to the xy-plane matrix
function mat4x4ShearXY(mat4x4, shx, shy) { // z stays the same, x and y change
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, shx, 0],
                     [0, 1, shy, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}

export {
    mat4x4Perspective,
    mat4x4MPer,
    mat4x4Viewport,
    mat4x4Identity,
    mat4x4Translate,
    mat4x4Scale,
    mat4x4RotateX,
    mat4x4RotateY,
    mat4x4RotateZ,
    mat4x4ShearXY,
    Vector3,
    Vector4
};
