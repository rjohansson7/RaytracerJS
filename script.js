//import gauss from './gauss';

// CLASSES
class Color
{
    constructor(r, g, b, a) 
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vec3
{
    constructor(x, y, z) 
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static vec_length(v)
    {
        return Math.sqrt(Math.pow(v.x, 2.0) + Math.pow(v.y, 2.0) + Math.pow(v.z, 2.0));
    }

    static vec_cross(v1, v2)
    {
        return new Vec3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }

    static vec_normalize(v)
    {
        var len = Vec3.vec_length(v);
        return new Vec3(v.x / len, v.y / len, v.z / len);
    }

    static vec_sub(v1, v2)
    {
        return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }
    static scalar_mul(scalar, vector)
    {
        return new Vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
    }

    static scalar_sub(scalar, vector)
    {
        return new Vec3(vector.x - scalar, vector.y - scalar, vector.z - scalar);
    }

    static vec_add(v1, v2)
    {
        return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    static vec_dot(v1, v2)
    {
        return (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);
    }

    static vec_scale(v, k)
    {
        return new Vec3(v.x * k, v.y * k, v.z * k);
    }
}

class Ray
{
    constructor(origin, direction) 
    {
      this.origin = origin;
      this.direction = direction;

      this.closestHit = Infinity;
      this.farthestHit = -Infinity;
      this.objectHit = null;
    }

    calculateClosestHit(entities)
    {
        // Reset hit variables
        this.closestHit = Infinity;
        this.farthestHit = -Infinity;
        this.objectHit = null;

        // Test intersection against each entity
        entities.forEach(entity => 
        {
            var test = entity.intersect(this);
            if (isNaN(test.min) == false)
            {
                // Since a ray may hit a sphere twice i save both the close and the far hit
                if (test.min < this.closestHit)
                {
                    this.closestHit = test.min;
                    this.farthestHit = test.max;
                    this.objectHit = entity;
                }
            }
        });

        // Return true if hit
        if (this.objectHit != null)
        {
            return true;
        }

        return false;
    }
}

const LightType= 
{
    AMBIENT: 0,
    POINT: 1,
    DIRECTIONAL: 2
}

class Light
{
    constructor(type, ambient, diffuse, specular) 
    {
        this.type = type;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
    }
}

class PointLight extends Light
{
    constructor(position, ambient, diffuse, specular)
    {
        super(LightType.POINT, ambient, diffuse, specular);
        this.position = position;
    }
}

class Material 
{
    constructor(ambient, diffuse, specular, shininess)
    {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
    }
}

const Materials= {
    NEUTRAL: new Material(new Color(0.2, 0.2, 0.2, 1.0), new Color(0.8, 0.8, 0.8, 1.0), new Color(0.0225, 0.0225, 0.0225, 1.0), 12.8), 
    PLASTIC: new Material(new Color(0.0, 0.1, 0.06, 1.0), new Color(0.0, 0.50980392, 0.50980392, 1.0), new Color(0.50196078, 0.50196078, 0.50196078, 1.0), 128.0),
    CHROME: new Material(new Color(0.25, 0.25, 0.25, 1.0), new Color(0.4, 0.4, 0.4, 1.0), new Color(0.774597, 0.774597, 0.774597, 1.0), 0.6 * 128.0)
}

class Entity
{
    constructor(center, color, material)
    {
        this.center = center;
        this.color = color;
        this.material = material;
    }
}

class Sphere extends Entity
{
    constructor(center, radius, color, material)
    {
        super(center, color, material);
        this.radius = radius;
    }

    intersect(ray)
    {
        // Check if there is an intersection at all
        var intersect = Math.pow(Vec3.vec_dot(ray.direction, (Vec3.vec_sub(ray.origin, this.center))), 2.0) - (Math.pow(Vec3.vec_length(Vec3.vec_sub(ray.origin, this.center)), 2.0) - Math.pow(this.radius, 2.0));
        if (intersect < 0)
        {
            // No intersection
            return {min: NaN, max: NaN};
        }
        // Calculate where the intersection(s) happen
        var d1 = -(Vec3.vec_dot(ray.direction, Vec3.vec_sub(ray.origin, this.center))) + Math.sqrt(intersect); 
        var d2 = -(Vec3.vec_dot(ray.direction, Vec3.vec_sub(ray.origin, this.center))) - Math.sqrt(intersect); 
        // Return the intersections
        if (intersect == 0)
        {
            // One intersection
            console.log(d1);
            console.log(d2);
            return {min: Math.min(d1, d2), max: Math.max(d1, d2)};
        }
        else if (intersect > 0)
        {
            // Two intersections
            return {min: Math.min(d1, d2), max: Math.max(d1, d2)};
        }

        // No hit
        return {min: NaN, max: NaN};
    }

    getNormal(P)
    {
        return Vec3.vec_normalize(Vec3.vec_sub(P, this.center));
    }
}

class Plane extends Entity
{
    constructor(center, normal, up, width, height, color, material) // (botLeft, topRight, color, material)
    {
        super(center, color, material);
        this.normal = Vec3.vec_normalize(normal);
        this.up = Vec3.vec_normalize(up);
        this.width = width;
        this.height = height;

        // Make sure normal and up are perpendicular
        if (Vec3.vec_dot(normal, up) != 0.0)
        {
            throw "[ERROR][PLANE] The two vectors normal and up must be perpendicular!";
        }

        // Calculate right vector
        this.right = Vec3.vec_normalize(Vec3.vec_cross(normal, up));
    }

    intersect(ray)
    {
        // If the ray have a point for which (p - this.center).dot(this.normal) = 0, we have an intersection
        // since the dot product of two vectors which are perpendicular to each other is always equal to 0
        let denominator = Vec3.vec_dot(ray.direction, this.getNormal(0));
        //console.log(ray.direction);
        // If denominator is close to 0, the ray and the plane are parallel
        if(denominator > 0 || denominator < 0)
        {
            let t = Vec3.vec_dot(Vec3.vec_sub(this.center, ray.origin), this.getNormal(this.center)) / denominator;
            if (t > 0)
            {
                // The ray intersects the plane according to the plane equation, 
                // now we need to check if it is inside the specified width and height borders
               
                // Calculate coordinates for the point where the plane intersects with the ray
                let P = Vec3.vec_add(ray.origin, Vec3.scalar_mul(t, ray.direction)); 
                
                // I do this by sending a ray from P in the direction of the this.right vector
                // then checking where it intersects with the this.up vector
                //   P1 + a V1 = P2 + b V2 -> a V1 = (P2 - P1) + b V2 -> a = |(P2-P1) X V2| / |V1 X V2|
                //   upDistance = |(P-this.center) X this.right| / crossMag
                let crossMag = Vec3.vec_length(Vec3.vec_cross(this.up, this.right));
                if (crossMag != 0.0) 
                {
                    // Calculate how far in the up direction where point P lies
                    let Pheight = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.center), this.right)) / crossMag;
                    let Pwidth  = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.center), this.up)) / crossMag;
                    
                    // Is this point inside the plane's boundaries
                    if (Pheight <= (this.height / 2) && Pwidth <= (this.width / 2))
                    {
                        return {min: t, max: NaN};
                    }  
                }
            }
        }

        
        return {min: NaN, max: NaN};
    }

    getNormal(P)
    {
        // Ax + BX + Cx + d = 0 is my equation setup (where d=1).
        // In this case A, B and C is a normal to this plane
        return Vec3.vec_normalize(this.normal);
    }
}

class Heart extends Entity
{
    constructor(center, normal, up, width, height, color, material) // (botLeft, topRight, color, material)
    {
        super(center, color, material);
        this.normal = Vec3.vec_normalize(normal);
        this.up = Vec3.vec_normalize(up);
        this.width = width;
        this.height = height;

        // Make sure normal and up are perpendicular
        if (Vec3.vec_dot(normal, up) != 0.0)
        {
            throw "[ERROR][PLANE] The two vectors normal and up must be perpendicular!";
        }

        // Calculate right vector
        this.right = Vec3.vec_normalize(Vec3.vec_cross(normal, up));

    }

    intersect(ray)
    {
        // If the ray have a point for which (p - this.center).dot(this.normal) = 0, we have an intersection
        // since the dot product of two vectors which are perpendicular to each other is always equal to 0
        let denominator = Vec3.vec_dot(ray.direction, this.getNormal(0));
        //console.log(ray.direction);
        // If denominator is close to 0, the ray and the plane are parallel
        if(denominator > 0 || denominator < 0)
        {
            let t = Vec3.vec_dot(Vec3.vec_sub(this.center, ray.origin), this.getNormal(this.center)) / denominator;
            if (t > 0)
            {
                // The ray intersects the plane according to the plane equation, 
                // now we need to check if it is inside the specified width and height borders
               
                // Calculate coordinates for this point
                let P = Vec3.vec_add(ray.origin, Vec3.scalar_mul(t, ray.direction)); 
                
                // I do this by sending a ray from P in the direction of the this.right vector
                // then checking where it intersects with the this.up vector
                let crossMag = Vec3.vec_length(Vec3.vec_cross(this.right, this.up));
                if (crossMag != 0.0) 
                {
                    // Calculate how far in the up/right directions point P lies
                    let Pheight = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.center), this.up)) / crossMag;
                    let Pwidth = Vec3.vec_length(Vec3.vec_sub(P, Vec3.vec_add(this.center, Vec3.scalar_mul(Pheight, this.up))));
                    
                    // Is this point inside the plane's boundaries
                    if (Pheight <= (this.height / 2) && Pwidth <= (this.width / 2))
                    {
                        return {min: t, max: NaN};
                    }  
                }
            }
        }

        
        return {min: NaN, max: NaN};
    }

    getNormal(P)
    {
        // Ax + BX + Cx + d = 0 is my equation setup (where d=1).
        // In this case A, B and C is a normal to this plane
        return Vec3.vec_normalize(this.normal);
    }
}

class Camera
{
    constructor(position, target, up, fov, windowWidth, windowHeight)
    {
        this.position = position;
        this.target = target;
        this.verticalUp = up;
        this.fov = fov;

        this.windowWidth = windowWidth; 
        this.windowHeight = windowHeight;

        var E = this.position;
        var T = this.target;
        var w = this.verticalUp;
        var f = (Math.PI*2.0*this.fov/360.0); //(Math.PI*this.fov)/180.0;
        var k = this.windowWidth;
        var m = this.windowHeight;

        var t = Vec3.vec_sub(T, E);
        var b = Vec3.vec_cross(w, t);
        var tn = Vec3.vec_normalize(t);
        var bn = Vec3.vec_normalize(b);
        var vn = Vec3.vec_normalize(Vec3.vec_cross(tn, bn));

        var gx = Math.tan(f/2);
        var gy = gx * m/k;

        var qx = Vec3.scalar_mul(2.0 * gx / (k - 1), bn);
        var qy = Vec3.scalar_mul(2.0 * gy / (m - 1), vn);

        var p1m = Vec3.vec_add(tn, Vec3.vec_add(Vec3.scalar_mul(-gx, bn), Vec3.scalar_mul(-gy, vn)));
        
        this.QX = qx;
        this.QY = qy;
        this.P1M = p1m;
    }

    GetPixelRay(x, y)
    {
        var i = x + 1;
        var j = y + 1;
        
        var pij = Vec3.vec_add(this.P1M, Vec3.vec_add(Vec3.scalar_mul(i-1, this.QX), Vec3.scalar_mul(j-1, this.QY)));
        var rij = Vec3.vec_normalize(pij);
        
        return new Ray(this.position, rij);
    }
}

// GLOBAL
var c = document.getElementById("myCanvas");
Main();

// FUNCTIONS
function Main()
{
    var ctx = c.getContext("2d");

    // Create the imagebufferData
    var imageBufferData = new Uint8ClampedArray(c.width * c.height * 4);
    for (let x = 0; x < c.width; x++) 
    {
        for (let y = 0; y < c.height; y++) 
        {
            SetPixel(x, y, imageBufferData, 0.0, 0.0, 0.0, 1.0);
        }
    }

    var imageData = new ImageData(imageBufferData, c.width, c.height);

    // Start Ray tracing
    Raytrace(c.width, c.height, imageData);

    // Draw
    ctx.putImageData(imageData, 0, 0);
}

function SetPixel(x, y, buffer, newRed, newGreen, newBlue, newAlpha)
{
    // Flip y-coordinate
    y = c.height - y;

    // Apply the stride (4 elements per pixel)
    let index = ((x * 4) + (y * (c.width * 4)));

    buffer[index]     = newRed * 255.0;
    buffer[index + 1] = newGreen * 255.0;
    buffer[index + 2] = newBlue * 255.0;
    buffer[index + 3] = newAlpha * 255.0;
}

function Raytrace(windowWidth, windowHeight, imageBuffer)
{
    // Setup the camera
    var camera = new Camera(new Vec3(0.0, 0.0, 0.0), new Vec3(0.0, 0.0, 1.0), new Vec3(0.0, 1.0, 0.0), 90, windowWidth, windowHeight); //fov ? Math.PI / 2

    // Add entities
    var entities = [];
    entities.push(new Sphere(new Vec3(0.0, 0.0, 2.0), 0.5, new Color(0.0, 1.0, 0.0, 1.0), Materials.PLASTIC));
    entities.push(new Plane(new Vec3(-2.0, 0.0, 15.0), new Vec3(0.2, 0.0, -1.0), new Vec3(0.0, 1.0, 0.0), 10.0, 10.0, new Color(1.0, 0.0, 0.0, 1.0), Materials.CHROME));

    // Add lights
    var lights = [];
    //lights.push(new PointLight(new Vec3(10.0, -4.0, -10.0), new Color(0.0215, 0.1745, 0.0215, 1.0), new Color(0.85, 0.85, 0.85, 1.0), new Color(0.8, 0.8, 0.8, 1.0)));
    lights.push(new PointLight(new Vec3(10.0, 4.0, -10.0), new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0)));

    // Run the ray tracing calculations for every pixel
    for (let y = 0; y < camera.windowHeight; y++) 
    {
        for (let x = 0; x < camera.windowWidth; x++) 
        {
            // Get a ray for this pixel
            var ray = camera.GetPixelRay(x, y);

            // Test intersection against each entity
            if (ray.calculateClosestHit(entities))
            {
                var I = ComputeLighting(ray, camera, lights);

                SetPixel(x, y, imageBuffer.data, ray.objectHit.color.r * I.r, ray.objectHit.color.g * I.g, ray.objectHit.color.b * I.b, ray.objectHit.color.a);
            }
        }           
    }
}

function ComputeLighting(ray, camera, lights)
{
    var Ip = {r: 0.0, g: 0.0, b: 0.0};
    var Ia = {r: 0.0, g: 0.0, b: 0.0};

    // Calculate the point of the hit on the object
    var P = Vec3.vec_add(ray.origin, Vec3.scalar_mul(ray.closestHit, ray.direction)); 
                    
    // Calculate the normal for the closest point
    var N = ray.objectHit.getNormal(P);

    // Calculate the viewer direction
    var V = Vec3.vec_normalize(Vec3.vec_sub(camera.position, P)); 

    lights.forEach(light => {
        switch (light.type) {
            case LightType.POINT:
                // Save biggest ambient
                if (light.ambient.r > Ia.r) {
                    Ia.r = light.ambient.r;
                }
                if (light.ambient.g > Ia.g) {
                    Ia.g = light.ambient.g;
                }
                if (light.ambient.b > Ia.b) {
                    Ia.b = light.ambient.b;
                }

                // First calculate a vector between the point, and the light
                var L = Vec3.vec_normalize(Vec3.vec_sub(light.position, P));
                // Then calculate the angle between the surface normal, and the light vector
                // If the angle < 0, then we don't add this light since it affects the back of the object
                var LN = Math.max(Vec3.vec_dot(N, L), 0.0);

                // Calculate reflection vector
                var R = Vec3.vec_normalize(Vec3.vec_sub(Vec3.scalar_mul(2.0 * LN, N), L));
                var RV = Math.max(Vec3.vec_dot(R, V), 0.0);

                // Calculate diffuse and specular for each color channel red, green and blue
                var diffuseR = ray.objectHit.material.diffuse.r * LN * light.diffuse.r;
                var diffuseG = ray.objectHit.material.diffuse.g * LN * light.diffuse.g;
                var diffuseB = ray.objectHit.material.diffuse.b * LN * light.diffuse.b;

                var specularR = ray.objectHit.material.specular.r * Math.pow(RV, ray.objectHit.material.shininess) * light.specular.r;
                var specularG = ray.objectHit.material.specular.g * Math.pow(RV, ray.objectHit.material.shininess) * light.specular.g; 
                var specularB = ray.objectHit.material.specular.b * Math.pow(RV, ray.objectHit.material.shininess) * light.specular.b; 
                
                Ip.r += diffuseR + specularR;
                Ip.g += diffuseG + specularG;
                Ip.b += diffuseB + specularB;
                
                break;
            default:
                break;
        }
    });

    Ip.r += ray.objectHit.material.ambient.r * Ia.r;
    Ip.g += ray.objectHit.material.ambient.g * Ia.g;
    Ip.b += ray.objectHit.material.ambient.b * Ia.b;

    return Ip;
}