# RaytracerJS
Simple raytracer written in javascript

## TODO
- Reflection
- Shadows
- Ray-plane intersection
- Refraction
- And more.. 
#### Debug in VScode with Firefox developer edition: 
1. Install [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug)
2. Either create your own `launch.json` or use mine (`.vscode/launch.json`)
3. Configure Firefox to allow remote debugging, or use Firefox Developer Edition
4. Run Firefox with remote debugging:
###### Powershell
```powershell
Start-Process "C:\Program Files\Firefox Developer Edition\firefox.exe" -ArgumentList "-start-debugger-server"
```

## Math
* [Ray calculation](https://en.wikipedia.org/wiki/Ray_tracing_(graphics)#Calculate_rays_for_rectangular_viewport)
* [Ray-sphere inersection](https://en.wikipedia.org/wiki/Ray_tracing_(graphics)#Example)
* [Phong reflection model](https://en.wikipedia.org/wiki/Phong_reflection_model)