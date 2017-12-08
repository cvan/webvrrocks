# Debugging


## Android

### Samsung Gear VR

With an existing Unity project:

1. [**Download this ZIP file**](https://github.com/caseyyee/unity-webvr-export/archive/master.zip) containing the contents of this repository. Or you can clone the Git repository locally to your machine:
    ```sh
    git clone https://github.com/caseyyee/unity-webvr-export.git && cd unity-webvr-export
    ```
2. Launch **Unity**.
3. Open your existing Unity project: `File > Open Project`.
3. Open `File > Build Settings`, and select the `WebGL` platform.

    <img src="https://raw.githubusercontent.com/caseyyee/unity-webvr-export/master/img/build-settings.png" width="550">

4. From `Player Settings` (`Edit > Project Settings > Player`), select the **`WebGL settings`** tab (HTML5 icon), toggle the **`Resolution and Presentation`** view, and select **`WebVR`** for the `WebGL Template`.

    <img src="https://raw.githubusercontent.com/caseyyee/unity-webvr-export/master/img/webgl-template.png" width="250">

5. Select **`File > Build & Run`**.
    > Or select `File > Build Settings …`, and choose a location for your build.
