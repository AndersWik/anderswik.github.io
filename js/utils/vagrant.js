const Http = new XMLHttpRequest();

const ui = {
    fileSelect: document.getElementById("vagrant-file-select"),
    file: document.getElementById("vagrant-file"),
    ip: document.getElementById("vagrant-ip"),
    url: document.getElementById("vagrant-url"),
    download: document.getElementById("download"),
    content: document.getElementById("download-content")
}

let currentContent = "";

Http.onreadystatechange = (e) => {
    currentContent = Http.responseText;
    ui.file.value = currentContent
}

function updateVagrantFile() {
    Http.open("Get", ui.fileSelect.value);
    Http.send();
}

function updateUI() {

    let content = currentContent;

    if (ui.ip.value !== "") {
        content = content.replaceAll("vagrantip", ui.ip.value);
    }

    if (ui.url.value !== "") {
        content = content.replaceAll("vagranturl", ui.url.value);
    }

    ui.file.value = content;
}

ui.ip.addEventListener("keyup", function () {
    updateUI();
});

ui.url.addEventListener("keyup", function () {
    updateUI();
});

ui.fileSelect.addEventListener("change", function () {
    updateVagrantFile();
    updateUI();
});

ui.download.addEventListener("click", function () {
    ui.content.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ui.file.value));
    ui.content.click();
});

updateVagrantFile();