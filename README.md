# RaytracerJS
Simple raytracer written in javascript

## TODO
- Add reflection :D

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
* [Phong reflection model](https://en.wikipedia.org/wiki/Phong_reflection_model)