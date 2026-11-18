import { Matrix, Vector } from "./matrix.js";

// create a 4x4 matrix to the perspective projection / view matrix
// Nper calculation
function mat4x4Perspective(prp, srp, vup, clip) { 
    // 1. translate PRP to origin
    const translate = new Matrix(4, 4);
    mat4x4Translate(translate, -prp.x, -prp.y, -prp.z);
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    const n = prp.subtract(srp);
    n.normalize();

    const u = vup.cross(n);
    u.normalize();

    const v = n.cross(u);
    
    const rotate = new Matrix(4, 4);
    rotate.values = [
        [u.x, u.y, u.z, 0],
        [v.x, v.y, v.z, 0],
        [n.x, n.y, n.z, 0],
        [0, 0, 0, 1]
    ];
    // 3. shear such that CW is on the z-axis
    const [left, right, bottom, top, near, far] = clip;
    const centerX = (left + right) / 2;
    const centerY = (bottom + top) / 2;

    const shear = new Matrix(4, 4);
    shear.values = [
        [1, 0, centerX / near, 0],
        [0, 1, centerY / near, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])
    const scale = new Matrix(4, 4);
    mat4x4Scale(
        scale,
        (2 * near) / ((right - left) * far),
        (2 * near) / ((top - bottom) * far),
        1 / far
    );

    return Matrix.multiply([scale, shear, rotate, translate]);
}

// create a 4x4 matrix to project a perspective image on the z=-1 plane
function mat4x4MPer() {
    let mper = new Matrix(4, 4);
    // mper.values = ...;
    mper.values = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, -1, 0]
    ];
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
    // viewport.values = ...;
    viewport.values = [
        [width / 2, 0, 0, width / 2],
        [0, -height / 2, 0, height / 2],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
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
