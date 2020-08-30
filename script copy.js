
// CLASSES
class Ray
{
    constructor(origin, direction) 
    {
      this.origin = origin;
      this.direction = direction;
    }
}

class Sphere 
{
    constructor(center, radius) 
    {
      this.center = center;
      this.radius = radius;
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

    static vec_cross(v1, v2)
    {
        return new Vec3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }

    static vec_normalize(v)
    {
        return new Vec3(v.x / v.length(), v.y / v.length(), v.z / v.length());
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
        return new Vec3(this.x - b.x, this.y - b.y, this.z - b.z);
    }

    static vec_add(v1, v2)
    {
        return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    static vec_dot(v1, v2)
    {
        return (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);
    }

    static vec_length(v)
    {
        return Math.sqrt(Math.pow(v.x, 2.0) + Math.pow(v.y, 2.0) + Math.pow(v.z, 2.0));
    }
}

class Camera
{
    constructor(position, target, up, fov, windowWidth, windowHeight)
    {
        this.position = position;
        this.target = target;
        this.spaceUp = up;
        this.fov = fov;

        this.windowWidth = windowWidth; 
        this.windowHeight = windowHeight;

        // Calculate direction, right and up vectors
        this.direction = this.target.sub(this.position);
        this.right = this.spaceUp.cross(this.direction);
        this.direction.normalize();
        this.right.normalize();
        this.up = this.direction.cross(this.right);
        this.up.normalize();

        // Calculate viewport size
        this.cameraToViewDistance = 1;
        //this.xSize = this.cameraToViewDistance * Math.tan(this.fov / 2.0);
        this.xSize = Math.tan((2*Math.PI*this.fov/360)/2);  
        this.ySize = this.xSize * (this.windowHeight / this.windowWidth);   //(this.windowHeight / this.windowWidth) // this.windowWidth / this.windowHeight

        // Calculate the pixel-shifting vectors
        this.psx = Vec3.scalar_mul(((2.0 * this.xSize) / (this.windowWidth - 1.0)), this.right);
        this.psy = Vec3.scalar_mul(((2.0 * this.ySize) / (this.windowHeight - 1.0)), this.up);

        //this.pixelBotLeft = Vec3.vec_sub(Vec3.scalar_mul(this.cameraToViewDistance, this.direction), Vec3.vec_sub(Vec3.scalar_mul(this.xSize, this.right), Vec3.scalar_mul(this.ySize, this.up)));
        var a = Vec3.scalar_mul(this.cameraToViewDistance, this.direction);
        var b = Vec3.scalar_mul(this.xSize, this.right);
        var c = Vec3.scalar_mul(this.ySize, this.up);
        this.pixelBotLeft = Vec3.vec_sub(Vec3.vec_sub(a, b), c);

        console.log(this.pixelBotLeft);
    }

    GetPixelRay(x, y)
    {
        var i = x + 1;
        var j = y + 1;
        
        return new Ray(this.position, Vec3.vec_normalize(Vec3.vec_add(this.pixelBotLeft, Vec3.vec_add(Vec3.scalar_mul(i - 1, this.psx), Vec3.scalar_mul(j - 1, this.psy)))));
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
            SetPixel(x, y, imageBufferData, 0, 0, 0, 255);
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
    // Apply the stride (4 elements per pixel)
    index = ((x * 4) + (y * (c.width * 4)));

    buffer[index]     = newRed;
    buffer[index + 1] = newGreen;
    buffer[index + 2] = newBlue;
    buffer[index + 3] = newAlpha;
}

function Raytrace(windowWidth, windowHeight, imageBuffer)
{
    // TODO
    var camera = new Camera(new Vec3(0.0, 0.0, 0.0), new Vec3(0.0, 0.0, 1.0), new Vec3(0.0, 1.0, 0.0), 90, windowWidth, windowHeight); //fov ? Math.PI / 2
    console.log(camera.GetPixelRay(0, 0));
    console.log(camera.GetPixelRay(windowWidth-1, windowHeight-1));

    var sphere = new Sphere(new Vec3(-10.0, 1.0, 6.0), 1.8);

    // Test sphere
    for (let y = 0; y < camera.windowHeight; y++) 
    {
        for (let x = 0; x < camera.windowWidth; x++) 
        {
            var ray = camera.GetPixelRay(x, y);

            // Test intersection
            var intersect = Math.pow(Vec3.vec_dot(ray.direction, (Vec3.vec_sub(ray.origin, sphere.center))), 2.0) - (Math.pow(Vec3.vec_length(Vec3.vec_sub(ray.origin, sphere.center)), 2.0) - Math.pow(sphere.radius, 2.0));
            if (intersect >= 0)
            {
                SetPixel(x, y, imageBuffer.data, 255, 255, 0, 255);
            }
        }           
    }
}
