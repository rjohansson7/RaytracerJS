//import gauss from './gauss';

Math.clamp = function(min, max, num){
    //return Math.max(b,Math.min(c,a));
    return Math.min(Math.max(num, min), max);
}

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

    static scalar_add(scalar, vector)
    {
        return new Vec3(vector.x + scalar, vector.y + scalar, vector.z + scalar);
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
      this.objectHitX = NaN;
      this.objectHitY = NaN;
      //this.objectHitZ = NaN;
    }

    calculateClosestHit(entities, avoid = null)
    {
        // Reset hit variables
        this.closestHit = Infinity;
        this.farthestHit = -Infinity;
        this.objectHit = null;
        this.objectHitX = NaN;
        this.objectHitY = NaN;

        // Test intersection against each entity
        entities.forEach(entity => 
        {
            if (entity != avoid)
            {
                var test = entity.intersect(this);
                if (isNaN(test.min) == false)
                {
                    // Since a ray may hit a sphere twice i save both the close and the far hit
                    if (test.min < this.closestHit && test.min > 0)
                    {
                        this.closestHit = test.min;
                        this.farthestHit = test.max;
                        this.objectHit = entity;
                        this.objectHitX = test.px;
                        this.objectHitY = test.py;
                        //this.objectHitZ = test.pz;
                    }
                    else if (test.max > 0) // for skysphere i want to use the farthest hit if test.min < 0 since we always will hit the sphere twice (because we are inside it)
                    {
                        // TODO: THIS MAKES IT FUCKED SOMETIMES FOR OBJECTS IN FRONT OF OTHERS (other than skysphere)
                        // MAYBE REVERSE SPHERE INTERSECTION?
                        this.closestHit = test.max;
                        this.farthestHit = test.min;
                        this.objectHit = entity;
                        this.objectHitX = test.px;
                        this.objectHitY = test.py;
                    }
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

    // Calculates if any hit, faster for shadows than calculating closest hit
    calculateIfHit(maxDistance, entities, avoid)
    {
        // Test intersection against each entity
        let hit = false;
        entities.forEach(entity => 
        {
            if (entity != avoid && entity.material.affectedByLight == true) //avoid itself and skybox entities
            {
                var test = entity.intersect(this);
                if (isNaN(test.min) == false)
                {
                    if (test.min < maxDistance && test.min > 0.0)
                    {
                        hit = true;
                        return;
                    }
                }
            }
        });

        if (hit)
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

const Texture_Types= {
    NONE: 0, 
    IMAGE: 1, 
    PROCEDURAL: 2 
}

class Texture
{
    constructor(type)
    {
        this.type = type;
    }
}

class TextureProcedural extends Texture
{
    constructor(scale, color1, color2)
    {
        super(Texture_Types.PROCEDURAL);
        this.scale = scale;
        this.color1 = color1;
        this.color2 = color2;
    }
}

class TextureImage extends Texture
{
    constructor()
    {
        super(Texture_Types.IMAGE);
        this.data = null;
        this.width = 0;
        this.height = 0;
    }

    async LoadTexture(filepath)
    {
        // Load image
        let img = new Image();
        img.src = filepath;

        // This is bad... this function now HAS to be async         
        await this.LoadImage(img);

        let can = document.createElement("canvas");
        can.width = img.width;
        can.height = img.height;
        let context = can.getContext("2d");
        context.drawImage(img, 0, 0);

        console.log(img.width);
        console.log(img.height);

        this.data = context.getImageData(0, 0, can.width, can.height).data;
        this.width = img.width;
        this.height = img.height;
    }

    // Yes... I did...
    async LoadImage(img)  
    {
        return new Promise((resolve, reject) => {
            img.onload = async () => {
                console.log("Image Loaded");
                resolve(true);
            };
        });
    };
}

class Material 
{
    constructor(ambient, diffuse, specular, shininess, reflectionAmount, refractionIndex, affectedByLight)
    {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
        this.reflectionAmount = reflectionAmount;
        this.refractionIndex = refractionIndex;
        this.affectedByLight = affectedByLight;
    }
}

const Materials= {
    NEUTRAL: new Material(new Color(0.2, 0.2, 0.2, 1.0), new Color(0.8, 0.8, 0.8, 1.0), new Color(0.0225, 0.0225, 0.0225, 1.0), 12.8, 0.0, 0.0, true), 
    PLASTIC: new Material(new Color(0.0, 0.1, 0.06, 1.0), new Color(0.0, 0.50980392, 0.50980392, 1.0), new Color(0.50196078, 0.50196078, 0.50196078, 1.0), 128.0, 0.4, 0.0, true),
    CHROME: new Material(new Color(0.25, 0.25, 0.25, 1.0), new Color(0.4, 0.4, 0.4, 1.0), new Color(0.774597, 0.774597, 0.774597, 1.0), 0.6 * 128.0, 0.8, 0.0, true),
    GLASS: new Material(new Color(0.0, 0.0, 0.0, 1.0), new Color(0.0, 0.0, 0.0, 1.0), new Color(0.9, 0.9, 0.9, 1.0), 128.0, 1.0, 1.5, true),
    MIRROR: new Material(new Color(0.0, 0.0, 0.0, 1.0), new Color(0.0, 0.0, 0.0, 1.0), new Color(0.9, 0.9, 0.9, 1.0), 128.0, 1.0, 0.0, true),
    SKYBOX: new Material(new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0), 0.6 * 128.0, 0.0, 0.0, false)
} // TODO: FIX GLASS MATERIAL..

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
    constructor(center, radius, color, material, texture = null, reverse = false)
    {
        super(center, color, material);
        this.radius = radius;
        this.reverse = reverse;
        this.texture = texture;
    }

    intersect(ray)
    {
        // Check if there is an intersection at all
        var intersect = Math.pow(Vec3.vec_dot(ray.direction, (Vec3.vec_sub(ray.origin, this.center))), 2.0) - (Math.pow(Vec3.vec_length(Vec3.vec_sub(ray.origin, this.center)), 2.0) - Math.pow(this.radius, 2.0));
        if (intersect < 0)
        {
            // No intersection
            return {min: NaN, max: NaN, px: NaN, py: NaN};
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
        return {min: NaN, max: NaN, px: NaN, py: NaN};
    }

    getNormal(P)
    {
        let normal = Vec3.vec_normalize(Vec3.vec_sub(P, this.center));
        if (this.reverse)
        {
            return Vec3.vec_sub(new Vec3(0.0, 0.0, 0.0), normal);
        }

        return normal;
    }

    getPixelColor(x= null, y = null, P = null)
    {
        if (this.texture != null && P != null)
        {
            let normal = this.getNormal(P);

            let u = 0.5 + Math.atan2(normal.z, normal.x) / (2*Math.PI);
            let v = 0.5 - Math.asin(normal.y) / Math.PI;

            //let width = u * this.texture.width;
            //let height = v * this.texture.height;        

            //let offset = height + (width * this.texture.width);

            // KÖR MINA GREJER
            let xx = Math.round(u * (this.texture.width - 1)) % (this.texture.width - 1); // p är koordinaten i modelSpace
            let yy = Math.round(v * (this.texture.height - 1)) % (this.texture.height - 1);

            let offset = ((xx * 4) + (yy * (this.texture.width * 4)));

            let texCol = new Color(this.texture.data[offset], this.texture.data[offset+1], this.texture.data[offset+2], this.texture.data[offset+3]);
            return new Color(texCol.r / 255, texCol.g / 255, texCol.b / 255, texCol.a / 255);
        }
        else
        {
            return this.color;
        }
    }
}

class Plane extends Entity
{
    constructor(center, normal, up, width, height, color, material, texture = null) // (botLeft, topRight, color, material)
    {
        super(center, color, material);
        this.normal = Vec3.vec_normalize(normal);
        this.up = Vec3.vec_normalize(up);
        this.width = width;
        this.height = height;
        this.texture = texture;
        
        // Make sure normal and up are perpendicular
        if (Vec3.vec_dot(normal, up) != 0.0)
        {
            throw "[ERROR][PLANE] The two vectors normal and up must be perpendicular!";
        }
        
        // Calculate right vector
        this.right = Vec3.vec_normalize(Vec3.vec_cross(normal, up));
        
        // Move (this.height/2) in the -right direction from the center
        let midLeft = Vec3.vec_sub(this.center, Vec3.scalar_mul((this.width / 2), this.right));
        // Move in the direction of up to calculate the topLeft corner
        this.topLeft = Vec3.vec_add(Vec3.scalar_mul((this.height / 2), this.up), midLeft);
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
                        // Which pixel on the plane is it...                                        
                        // Seems like i'm an idiot. Why not just calculate a vector to the          
                        // top-left corner of the plane, then caluclate the boundaries from there...
                        // I do this here now, replace the other calculations with this later!! TODO

                        // Räkna med pixelsize på något sätt :S
                        // Img.width är hur många pixlar texturen har
                        let pX = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.topLeft), this.up)) / crossMag;
                        let pY = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.topLeft), this.right)) / crossMag;
                        //let pZ = Vec3.vec_length(Vec3.vec_cross(Vec3.vec_sub(P, this.topLeft), this.normal)) / crossMag;

                        return {min: t, max: NaN, px: pX, py: pY};
                    }  
                }
            }
        }

        return {min: NaN, max: NaN, px: NaN, py: NaN};
    }

    getNormal(P)
    {
        return Vec3.vec_normalize(this.normal);
    }

    getPixelColor(x, y, P = null)
    {
        if (this.texture && isNaN(x) == false && isNaN(y) == false)
        {
            if (this.texture.type == Texture_Types.IMAGE)
            {
                // Load pixel from texture at image coordinate x,y
                let w = this.width; 
                let h = this.height;
                // x and y is the distances from the top-left corner. I divide this distance with the width/height of the plane
                // to get a value between 0 and 1, where 0 is the top-left corner, and 1 is the top right. Then i multiply this value with
                // the texture width to get the point in this percentage of the image size 
                let xx = Math.round((x / w) * (this.texture.width - 1)) % (this.texture.width - 1); // p är koordinaten i modelSpace
                let yy = Math.round((y / h) * (this.texture.height - 1)) % (this.texture.height - 1);

                let offset = ((xx * 4) + (yy * (this.texture.width * 4)));

                if (offset > (this.texture.width * this.texture.height *  4))
                {
                    offset = (this.texture.width * this.texture.height *  4) - 4;
                }

                let texCol = new Color(this.texture.data[offset], this.texture.data[offset+1], this.texture.data[offset+2], this.texture.data[offset+3]);
                return new Color(texCol.r / 255, texCol.g / 255, texCol.b / 255, texCol.a / 255);
            }
            else if (this.texture.type == Texture_Types.PROCEDURAL)
            {
                let sines = Math.sin(this.texture.scale * x) * Math.sin(this.texture.scale * y);  // * Math.sin(scale * z);
                if (sines < 0)
                {
                    return this.texture.color1;
                }
                else
                {
                    return this.texture.color2;
                }
            }
        }
        else
        {
            // No texture for this obj, return color only
            return this.color;
        }
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
                        return {min: t, max: NaN, px: Pheight, py: pwidth};
                    }  
                }
            }
        }

        
        return {min: NaN, max: NaN, px: NaN, py: NaN};
    }

    getNormal(P)
    {
        // Ax + BX + Cx + d = 0 is my equation setup (where d=1).
        // In this case A, B and C is a normal to this plane
        return Vec3.vec_normalize(this.normal);
    }

    getPixelColor(x, y, P = null)
    {
        return this.color;
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
c.width = window.innerWidth - 20;
c.height = window.innerHeight - 25;
Main();

// FUNCTIONS
async function Main()
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

    // Init textures
    let textures = new Map()
    textures["apple"] = new TextureImage();
    await textures["apple"].LoadTexture("./textures/apple.jpg");

    // Sky textures
    textures["top"] = new TextureImage();
    await textures["top"].LoadTexture("./textures/space2/top.jpg");
    textures["bot"] = new TextureImage();
    await textures["bot"].LoadTexture("./textures/space2/bot.jpg");
    textures["front"] = new TextureImage();
    await textures["front"].LoadTexture("./textures/space2/front.jpg");
    textures["back"] = new TextureImage();
    await textures["back"].LoadTexture("./textures/space2/back.jpg");
    textures["left"] = new TextureImage();
    await textures["left"].LoadTexture("./textures/space2/left.jpg");
    textures["right"] = new TextureImage();
    await textures["right"].LoadTexture("./textures/space2/right.jpg");

    textures["world"] = new TextureImage();
    await textures["world"].LoadTexture("./textures/world.png");

    textures["checkerboard"] = new TextureProcedural(20, new Color(1.0, 1.0, 1.0, 1.0), new Color(0.0, 0.0, 0.0, 1.0));

    
    // Add entities
    var entities = [];
    CreateSkybox(100, 100, entities, textures);
    //CreateSkysphere(9, entities, textures);
    // Floor
    entities.push(new Plane(new Vec3(0.0, 0.0, 0.0), new Vec3(0.0, 1.0, 0.0), new Vec3(0.0, 0.0, 1.0), 6, 4, new Color(1.0, 1.0, 1.0, 1.0), Materials.CHROME, textures["checkerboard"]));
    // Other 
    //entities.push(new Sphere(new Vec3(1.0, 0.5, 0.0), 0.5, new Color(0.0, 1.0, 0.0, 1.0), Materials.PLASTIC));
    //entities.push(new Sphere(new Vec3(-1.0, 0.5, 0.0), 0.5, new Color(1.0, 1.0, 0.0, 1.0), Materials.CHROME));
    //entities.push(new Sphere(new Vec3(0.0, 2.5, 0.5), 0.5, new Color(1.0, 1.0, 1.0, 1.0), Materials.NEUTRAL, textures["world"]));
    //entities.push(new Sphere(new Vec3(0.0, 1.0, -1.5), 0.5, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));

    entities.push(new Sphere(new Vec3(-1.0, 0.5, 0.0), 0.5, new Color(1.0, 1.0, 0.0, 1.0), Materials.CHROME));
    entities.push(new Sphere(new Vec3(-1.0, 1.7, 5.0), 0.5, new Color(1.0, 0.0, 0.0, 1.0), Materials.CHROME));
    entities.push(new Sphere(new Vec3(0.6, 2.5, 2.5), 0.5, new Color(1.0, 1.0, 1.0, 1.0), Materials.NEUTRAL, textures["world"]));
    entities.push(new Sphere(new Vec3(2.0, 0.5, 0.0), 0.5, new Color(0.0, 1.0, 0.0, 1.0), Materials.PLASTIC));
    
    // R begin
    entities.push(new Sphere(new Vec3(0.0, 0.2, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 0.6, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 1.0, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 1.4, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 1.8, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 2.2, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.0, 2.6, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    
    entities.push(new Sphere(new Vec3(0.4, 2.6, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.8, 2.6, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    
    entities.push(new Sphere(new Vec3(1.1, 2.4, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(1.1, 2.0, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));

    entities.push(new Sphere(new Vec3(0.8, 1.8, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.4, 1.8, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));

    entities.push(new Sphere(new Vec3(0.4, 1.34, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.58, 0.96, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.76, 0.58, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    entities.push(new Sphere(new Vec3(0.94, 0.2, 0.0), 0.2, new Color(1.0, 1.0, 1.0, 1.0), Materials.GLASS));
    // R end

    // Add lights
    var lights = [];
    //lights.push(new PointLight(new Vec3(10.0, 4.0, -10.0), new Color(0.0215, 0.0215, 0.0215, 1.0), new Color(0.85, 0.85, 0.85, 1.0), new Color(0.8, 0.8, 0.8, 1.0)));
    lights.push(new PointLight(new Vec3(10.0, 5.0, -10.0), new Color(0.1, 0.1, 0.1, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0)));
    
    // Setup the camera
    var camera = new Camera(new Vec3(0.0, 2.0, -5.0), new Vec3(0.0, 0.0, 4.0), new Vec3(0.0, 1.0, 0.0), 90, c.width, c.height); //fov ? Math.PI / 2
    
    // Start Ray tracing
    ComputeImage(imageData, entities, lights, camera);

    // Draw
    ctx.putImageData(imageData, 0, 0);
}

function CreateSkysphere(radius, entities, textures)
{
    entities.push(new Sphere(new Vec3(0.0, 0.0, 0.0), radius, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["world"]));
}

function CreateSkybox(width, height, entities, textures)
{
    // Floor
    entities.push(new Plane(new Vec3(0.0, -(height / 2), 0.0), new Vec3(0.0, 1.0, 0.0), new Vec3(0.0, 0.0, 1.0), width, width, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["bot"]));
    // Front
    entities.push(new Plane(new Vec3(0.0, 0.0, width / 2), new Vec3(0.0, 0.0, -1.0), new Vec3(0.0, 1.0, 0.0), width, height, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["front"]));
    // Back
    entities.push(new Plane(new Vec3(0.0, 0.0, -(width / 2)), new Vec3(0.0, 0.0, 1.0), new Vec3(0.0, 1.0, 0.0), width, height, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["back"]));
    // Left
    entities.push(new Plane(new Vec3(width / 2, 0.0, 0.0), new Vec3(-1.0, 0.0, 0.0), new Vec3(0.0, 1.0, 0.0), width, height, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["left"]));
    // Right
    entities.push(new Plane(new Vec3(-(width / 2), 0.0, 0.0), new Vec3(1.0, 0.0, 0.0), new Vec3(0.0, 1.0, 0.0), width, height, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["right"]));
    // Roof
    entities.push(new Plane(new Vec3(0.0, height / 2, 0.0), new Vec3(0.0, -1.0, 0.0), new Vec3(0.0, 0.0, -1.0), width, width, new Color(1.0, 1.0, 1.0, 1.0), Materials.SKYBOX, textures["top"]));
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

function ComputeImage(imageBuffer, entities, lights, camera)
{
    // Run the ray tracing calculations for every pixel
    for (let y = 0; y < camera.windowHeight; y++) 
    {
        for (let x = 0; x < camera.windowWidth; x++) 
        {
            // Get a ray for this pixel
            var ray = camera.GetPixelRay(x, y);
            var color = Raytrace(ray, entities, lights, camera, 10); //3
            
            SetPixel(x, y, imageBuffer.data, color.r, color.g, color.b, color.a);
        }           
    }
}

function Raytrace(ray, entities, lights, camera, depth, avoid = null)
{
    if (depth <= 0)
    {
        return new Color(0.0, 0.0, 0.0, 1.0);
    }

    // Test intersection against each entity
    if (ray.calculateClosestHit(entities, avoid))
    {
        // Backgrpund wont be affected by light
        if (ray.objectHit.material.affectedByLight)
        {
            // Calculate the point of the hit on the object
            var P = Vec3.vec_add(ray.origin, Vec3.scalar_mul(ray.closestHit, ray.direction)); 
            
            // Calculate the normal for the closest point
            var N = ray.objectHit.getNormal(P);
            
            // Calculate the viewer direction
            var V = Vec3.vec_normalize(Vec3.vec_sub(camera.position, P));
            
            // Get object color for this pixel, from texture or static color
            var objectColor = ray.objectHit.getPixelColor(ray.objectHitX, ray.objectHitY, P);

            // Default colors for light and reflection TODO: Should add all light ambients or something
            var lightColor = new Color(0.0, 0.0, 0.0, 1.0);
            lightColor.r += lights[0].ambient.r * ray.objectHit.material.ambient.r;
            lightColor.g += lights[0].ambient.g * ray.objectHit.material.ambient.g;
            lightColor.b += lights[0].ambient.b * ray.objectHit.material.ambient.b;
            var reflectionColor = new Color(0.0, 0.0, 0.0, 1.0);

            // Only calculate light and reflection if point isn't in shadow
            if (CheckShadow(P, lights[0], entities, ray.objectHit) == false)
            {
                lightColor = ComputeLighting(ray, P, N, V, lights, entities);  
                reflectionColor = ComputeReflection(P, ray, entities, lights, camera, depth - 1);
            }
            
            // Refraction (only if material has a positive refractionIndex)
            if (ray.objectHit.material.refractionIndex > 0.0)
            {
                var fresnel = ComputeFresnel(ray.direction, N, ray.objectHit.material.refractionIndex);
                //xconsole.log(fresnel);
                if (fresnel < 1)
                {
                    var refractionColor = ComputeRefraction(P, ray.direction, N, ray.objectHit.material.refractionIndex, entities, lights, camera, depth - 1, ray.objectHit);
                    //console.log(refractionColor);
                    // refract and reflect 
                    reflectionColor.r = reflectionColor.r * fresnel + refractionColor.r * (1 - fresnel);
                    reflectionColor.g = reflectionColor.g * fresnel + refractionColor.g * (1 - fresnel);
                    reflectionColor.b = reflectionColor.b * fresnel + refractionColor.b * (1 - fresnel);
                }
            }
            
            var outColor = new Color(0.0, 0.0, 0.0, 1.0);
            //outColor.r += (objectColor.r * lightColor.r) + reflectionColor.r;
            //outColor.g += (objectColor.g * lightColor.g) + reflectionColor.g;
            //outColor.b += (objectColor.b * lightColor.b) + reflectionColor.b;
            
            outColor.r += objectColor.r * (lightColor.r + reflectionColor.r);
            outColor.g += objectColor.g * (lightColor.g + reflectionColor.g);
            outColor.b += objectColor.b * (lightColor.b + reflectionColor.b);
            
            return outColor; 
        }
        else
        {
            // object color
            var P = Vec3.vec_add(ray.origin, Vec3.scalar_mul(ray.closestHit, ray.direction)); 
            return ray.objectHit.getPixelColor(ray.objectHitX, ray.objectHitY, P);
        }
    }
    else
    {
        return new Color(0.0, 0.0, 0.0, 1.0);
    }
}

function ComputeLighting(ray, P, N, V, lights, entities)
{
    var Ip = new Color(0.0, 0.0, 0.0, 1.0);
    var Ia = new Color(0.0, 0.0, 0.0, 1.0);

    lights.forEach(light => {
        switch (light.type) 
        {
            case LightType.POINT:
                // Is this point visible by this light source?
                if (CheckShadow(P, light, entities, ray.objectHit) == false)
                {
                    // TODO: CHANGE THIS....
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
                }
                else
                {
                    // Some light should hit // 0.05
                    Ip.r += Math.max(light.ambient.r - 0.05, 0.0);
                    Ip.g += Math.max(light.ambient.g - 0.05, 0.0);
                    Ip.b += Math.max(light.ambient.b - 0.05, 0.0);
                }
                break;
            default:
                break;
        }
    });
    
    // Without object ambient (added in the raytrace function)
    //Ip.r += Ia.r;
    //Ip.g += Ia.g;
    //Ip.b += Ia.b;

    // With ambient
    Ip.r += ray.objectHit.material.ambient.r * Ia.r;
    Ip.g += ray.objectHit.material.ambient.g * Ia.g;
    Ip.b += ray.objectHit.material.ambient.b * Ia.b;

    return Ip;
}

function CheckShadow(point, light, entities, avoid)
{
    let pointToLight = Vec3.vec_sub(light.position, point);
    // Calculate the direction from this point, towards the light
    let dir = Vec3.vec_normalize(pointToLight);
    // Distance between light and point
    let distance = Vec3.vec_length(pointToLight);
    // Send a ray from this point, towards the light source
    let shadowRay = new Ray(point, dir);


    // Does the ray hit something?
    if (shadowRay.calculateIfHit(distance, entities, avoid) == true)
    {
        // In this case the point is not visible for this light source
        return true;
    }
    
    // The ray didn't hit anything, and is therefore visible for the light
    return false;
}

function ComputeReflection(point, incidentRay, entities, lights, camera, depth)
{
    // R = I - 2 * dot(N, I) * N
    let normal = incidentRay.objectHit.getNormal(point);
    let reflectionDir = Vec3.vec_normalize(Vec3.vec_sub(incidentRay.direction, Vec3.scalar_mul(2.0 * Vec3.vec_dot(normal, incidentRay.direction), normal)));
    let reflectionRay = new Ray(point, reflectionDir);
    let col = Raytrace(reflectionRay, entities, lights, camera, depth, incidentRay.objectHit);

    let reflAmount = incidentRay.objectHit.material.reflectionAmount;
    return new Color(col.r * reflAmount, col.g * reflAmount, col.b * reflAmount, 1.0);
}

function ComputeRefraction(P, I, N, ior, entities, lights, camera, depth, avoid)
{
    let cosi = Math.clamp(-1, 1, Vec3.vec_dot(I, N)); 
    let etai = 1, etat = ior; 
    let n = N;

    if (cosi < 0) 
    { 
        cosi = -cosi; 
    } 
    else 
    { 
        [etai, etat] = [etat, etai];
        n = Vec3.vec_sub(new Vec3(0.0, 0.0, 0.0), N); 
    } 
    
    let eta = etai / etat; 
    let k = 1 - eta * eta * (1 - cosi * cosi); 
    
    if (k < 0)
    {
        return new Color(0.0, 0.0, 0.0, 1.0);
    }
    else
    {

        let outside = Vec3.vec_dot(I, N) < 0;
        let bias = Vec3.scalar_mul(1e-4, N);
        //let refractionDirection =  Vec3.vec_normalize(Vec3.scalar_add((eta * cosi - Math.sqrt(k)) * n, Vec3.scalar_mul(eta, I)));
        let refractionDirection =  Vec3.vec_normalize(Vec3.vec_add(Vec3.scalar_mul(eta * cosi - Math.sqrt(k), n), Vec3.scalar_mul(eta, I)));
        //let refractionOrigin = (outside ? Vec3.vec_add(bias, P) : Vec3.vec_sub(P, bias));
        let refractionRay = new Ray(P, refractionDirection);
        //console.log(Vec3.vec_add(Vec3.scalar_mul(eta * cosi - Math.sqrt(k), n), Vec3.scalar_mul(eta, I)));

        return Raytrace(refractionRay, entities, lights, camera, depth, avoid);
    }
}

function ComputeFresnel(I, N, ior) 
{ 
    let cosi = Math.clamp(-1, 1, Vec3.vec_dot(I, N)); 
    let etai = 1, etat = ior; 
    if (cosi > 0) 
    { 
        [etai, etat] = [etat, etai];
    }

    
    // Compute sini using Snell's law
    let sint = etai / etat * Math.sqrt(Math.max(0, 1 - cosi * cosi)); 
    // Total internal reflection
    if (sint >= 1) 
    { 
        return 1; 
    } 
    else 
    { 
        let cost = Math.sqrt(Math.max(0, 1 - sint * sint)); 
        cosi = Math.abs(cosi);
        let Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost)); 
        let Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost)); 
        
        return (Rs * Rs + Rp * Rp) / 2; 
    } 
} 