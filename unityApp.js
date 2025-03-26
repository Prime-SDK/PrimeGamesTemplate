const unityApp = {

    tryLockAspectRatio() {
        const mobileAspectRatioInput = "{{{ MOBILE_ASPECT_RATIO }}}";
        const isMobileLocked = !this.isEmpty(mobileAspectRatioInput);
        const mobileAspectRatio = isMobileLocked ? this.toNumber(mobileAspectRatioInput) : 1.0;
        console.log("Mobile aspect ratio", mobileAspectRatioInput, isMobileLocked, mobileAspectRatio);

        const desktopAspectRatioInput = "{{{ DESKTOP_ASPECT_RATIO }}}";
        const isDesktopLocked = !this.isEmpty(desktopAspectRatioInput);
        const desktopAspectRatio = isDesktopLocked ? this.toNumber(desktopAspectRatioInput) : 1.0;
        console.log("Desktop aspect ratio", desktopAspectRatioInput, isDesktopLocked, desktopAspectRatio);

        const container = document.querySelector("#unity-container");
        const canvas = document.querySelector("#unity-canvas");

        function centerCanvas() {
            canvas.style.margin = "auto";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.bottom = "0";
            canvas.style.right = "0";
        }

        function resetAspectRatio() {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            centerCanvas();
        }

        function recalculateAspectRatio(aspectRatio) {
            let containerWidth = container.clientWidth;
            let containerHeight = container.clientHeight;

            // Apply aspect ratio lock with pixel-perfect size.
            if (containerWidth / containerHeight > aspectRatio) {
                canvas.style.width = Math.floor(containerHeight * aspectRatio) + "px";
                canvas.style.height = "100%";
            }
            else {
                canvas.style.width = "100%";
                canvas.style.height = Math.floor(containerWidth / aspectRatio) + "px";
            }
        }

        function applyAspectRatio(value) {
            resetAspectRatio();
            if (value > 0.0) {
                // Recalculate aspect ratio.
                recalculateAspectRatio(value);
            }
        }

        function updateAspectRatio() {
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                // Mobile
                if (isMobileLocked) {
                    applyAspectRatio(mobileAspectRatio);
                }
            }
            else {
                // Desktop
                if (isDesktopLocked) {
                    applyAspectRatio(desktopAspectRatio);
                }
            }
            centerCanvas();
        }

        // Subscribe to window and document events.
        window.addEventListener("load", updateAspectRatio);
        window.addEventListener("resize", updateAspectRatio);
        document.addEventListener("readystatechange", updateAspectRatio);
        document.addEventListener("DOMContentLoaded", updateAspectRatio);
    },

    startLoading: function () {
        const container = document.querySelector("#unity-container");
        const canvas = document.querySelector("#unity-canvas");
        const loadingBar = document.querySelector("#unity-loading-bar");
        const progressBarFull = document.querySelector("#unity-progress-bar-full");

        const buildUrl = "Build";
        const loaderUrl = buildUrl + "/{{{ LOADER_FILENAME }}}";
        const config = {
            arguments: [],
            dataUrl: buildUrl + "/{{{ DATA_FILENAME }}}",
            frameworkUrl: buildUrl + "/{{{ FRAMEWORK_FILENAME }}}",
            #if USE_THREADS
            workerUrl: buildUrl + "/{{{ WORKER_FILENAME }}}",
            #endif
            #if USE_WASM
            codeUrl: buildUrl + "/{{{ CODE_FILENAME }}}",
            #endif
            #if SYMBOLS_FILENAME
            symbolsUrl: buildUrl + "/{{{ SYMBOLS_FILENAME }}}",
            #endif
            streamingAssetsUrl: "StreamingAssets",
            companyName: "{{{ COMPANY_NAME }}}",
            productName: "{{{ PRODUCT_NAME }}}",
            productVersion: "{{{ PRODUCT_VERSION }}}",
            showBanner: (msg, type) => {
                switch (type) {
                    case 'error': {
                        console.error(msg);
                        break;
                    }
                    default: {
                        console.warn(msg);
                        break;
                    }
                }
            },
        };

        // By default Unity keeps WebGL canvas render target size matched with
        // the DOM size of the canvas element (scaled by window.devicePixelRatio)
        // Set this to false if you want to decouple this synchronization from
        // happening inside the engine, and you would instead like to size up
        // the canvas DOM size and WebGL render target sizes yourself.
        const matchWebGLToCanvasSize = "{{{ MATCH_WEBGL_TO_CANVAS_SIZE }}}";
        if (!this.isEmpty(matchWebGLToCanvasSize)) {
            config.matchWebGLToCanvasSize = this.toBoolean(matchWebGLToCanvasSize);
        }

        // If you would like all file writes inside Unity Application.persistentDataPath
        // directory to automatically persist so that the contents are remembered when
        // the user revisits the site the next time, uncomment the following line:
        const autoSyncPersistentDataPath = "{{{ AUTO_SYNC_PERSISTENT_DATA_PATH }}}";
        if (!this.isEmpty(autoSyncPersistentDataPath)) {
            config.autoSyncPersistentDataPath = this.toBoolean(autoSyncPersistentDataPath);
        }
        // This autosyncing is currently not the default behavior to avoid regressing
        // existing user projects that might rely on the earlier manual
        // JS_FileSystem_Sync() behavior, but in future Unity version, this will be
        // expected to change.

        // To lower canvas resolution on mobile devices to gain some
        // performance, uncomment the following line:
        const devicePixelRatio = this.toNumber("{{{ DEVICE_PIXEL_RATIO }}}");
        if (this.isNumber(devicePixelRatio)) {
            config.devicePixelRatio = devicePixelRatio;
        }

        loadingBar.style.display = "block";
        const script = document.createElement("script");
        script.src = loaderUrl;
        script.onload = () => {
            createUnityInstance(canvas, config, (progress) => {
                progressBarFull.style.width = 100 * progress + "%";
            }).then((unityInstance) => {
                loadingBar.style.display = "none";
            }).catch((message) => {
                alert(message);
            });
        };
        document.body.appendChild(script);

        #if SHOW_DIAGNOSTICS
        // Position the diagnostics icon in the corner on the canvas.
        const diagnostics_icon = document.getElementById("diagnostics-icon");
        diagnostics_icon.onclick = () => {
            unityDiagnostics.openDiagnosticsDiv(unityInstance.GetMetricsInfo);
        };
        diagnostics_icon.style.position = "fixed";
        diagnostics_icon.style.bottom = "10px";
        diagnostics_icon.style.right = "0px";
        canvas.after(diagnostics_icon);
        #endif
    },

    isEmpty: function (value) {
        return value === undefined || value === null || value === "";
    },

    toBoolean: function (value) {
        return value === true || value === "true" || value === 1 || value === "1" || value === "True";
    },

    isNumber: function (value) {
        return typeof value === 'number' && !isNaN(value);
    },

    toNumber: function (value) {
        function handleMathExpression(str) {
            const mathMatch = str.match(/^(\d*\.?\d+)\s*([+\-*/])\s*(\d*\.?\d+)$/);
            if (!mathMatch) return null;

            const a = parseFloat(mathMatch[1]);
            const operator = mathMatch[2];
            const b = parseFloat(mathMatch[3]);

            const operators = {
                '+': function (a, b) { return a + b; },
                '-': function (a, b) { return a - b; },
                '*': function (a, b) { return a * b; },
                '/': function (a, b) { return b !== 0 ? a / b : NaN; }
            };
            return operators[operator](a, b);
        }

        function convertToNumber(str) {
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
        }

        // Handle basic type checks first.
        if (this.isNumber(value)) return value;
        if (this.isEmpty(value)) return 0;

        // Convert to string and handle empty case.
        var str = String(value).trim();
        if (str === '') return 0;

        // Try math expression or simple number conversion.
        return handleMathExpression(str) || convertToNumber(str);
    },

};

// Lock aspect ratio.
unityApp.tryLockAspectRatio();

// Automatically start after script is loaded.
unityApp.startLoading();