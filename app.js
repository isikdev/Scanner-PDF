const scanner = new Sane("test");

const progressBar = document.querySelector("#progressBar");
const scanButton = document.querySelector("#scanButton");
const saveButton = document.querySelector("#saveButton");
const outputDiv = document.querySelector("#output");

let pdfDocument, pdfPage, pdfCanvas, pdfContext;

async function scanDocument() {
    try {
        const devices = await scanner.getDevices();
        const device = devices[0];
        await scanner.open(device);
        await scanner.setOption(device, "resolution", 200);
        await scanner.start();

        let data;
        while ((data = await scanner.scan())) {
            if (data.length > 0) {
                const imageData = new ImageData(
                    new Uint8ClampedArray(data),
                    device.geometry.width,
                    device.geometry.height
                );
                pdfPage = await pdfDocument.addPage(device.geometry);
                pdfCanvas = document.createElement("canvas");
                pdfContext = pdfCanvas.getContext("2d");
                pdfCanvas.width = device.geometry.width;
                pdfCanvas.height = device.geometry.height;
                pdfContext.putImageData(imageData, 0, 0);
                const pdfDataUrl = pdfCanvas.toDataURL("image/png");
                const pdfImage = await pdfjsLib.getDocument(pdfDataUrl).promise;
                const pdfPageObject = await pdfImage.getPage(1);
                const viewport = pdfPageObject.getViewport();
                pdfPage.setMediaBox([0, 0, viewport.width, viewport.height]);
                pdfPage.setRotation(0);
                const renderContext = {
                    canvasContext: pdfContext,
                    viewport: viewport,
                };
                await pdfPageObject.render(renderContext).promise;
            }
        }

        await scanner.close();
        alert("Документы успешно просканированы!");
    } catch (error) {
        console.error(error);
    }
}

function savePdf() {
    pdfDocument.save("document.pdf");
    alert("Документ успешно сохранен!");
}

scanButton.addEventListener("click", scanDocument);
saveButton.addEventListener("click", savePdf);

pdfjsLib.getDocument().promise.then(function (pdfDoc_) {
    pdfDocument = pdfDoc_;
});

scanner.on("progress", (progress) => {
    progressBar.value = progress;
    outputDiv.innerText = `Прогресс: ${progress}%`;
});