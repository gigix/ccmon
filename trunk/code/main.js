options.defaultValue("resultPageUrl") = "http://localhost/MockTestResult";
options.defaultValue("checkInterval") = 3000;
options.defaultValue("buildFailedIndicate") = "FAILED";

function saveOptions(wnd) {
    options.PutValue("resultPageUrl", txtUrl.value);
    options.PutValue("buildFailedIndicate", txtPattern.value);
    options.PutValue("checkInterval", parseInt(txtInterval.value));
}

function displayOptions() {
    txtUrl.value = options("resultPageUrl");
    txtPattern.value = options("buildFailedIndicate");
    txtInterval.value = options("checkInterval").toString();
}

function initGadget() {
    myGadget = new CCMonitor(new WebPage(options("resultPageUrl")), options("buildFailedIndicate"));
    myGadget.init();
    setInterval("myGadget.checkBuildStatus()", options("checkInterval"));
}

function WebPage(url) {
    this.url = url;
    pageText = "";

    this.content = function() {
        // should use async mode of xmlhttp
        var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        // is there any other way to disable cache?
        var actualUrl = this.url + "?" + new Date().toTimeString();
        xmlhttp.open("GET", actualUrl, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status != 200) { // doesn't work if redirecting exists
                    pageText = "";
                } else {
                    pageText = xmlhttp.responseText;
                }
            }
        }
        xmlhttp.send(null);

        if (pageText == "") {
            throw "Build status unknown yet";
        }
        return pageText;
    }
}

function CCMonitor(webPage, buildFailedIndicate) {
    this.webPage = webPage;
    this.buildFailedIndicate = buildFailedIndicate;

    this.buildFailedMessage = "FAILED";
    this.buildSuccessfulMessage = "SUCCESSFUL";
    this.buildStatusUnknownMessage = "UNKNOWN";

    this.currentStatus = "";

    this.init = function() {
        this.refreshDisplay(this.buildStatusUnknownMessage);
        this.checkBuildStatus();
    }

    this.refreshDisplay = function(status) {
        if (this.currentStatus == status) {
            return;
        }
        this.currentStatus = status;
        lblStatus.innerText = this.currentStatus;
        iconStatus.src = "resources/" + this.currentStatus + ".ico";
        lnkPage.href = options("resultPageUrl");
    }

    this.checkBuildStatus = function() {
        try {
            var content = this.webPage.content();
        } catch (e) { // cannot retrieve build result page?
            this.refreshDisplay(this.buildStatusUnknownMessage);
            return;
        }
        this.refreshDisplay(this.getBuildStatus(content));
    }

    this.getBuildStatus = function(pageContent) {
        if (new RegExp(this.buildFailedMessage).test(pageContent)) {
            return this.buildFailedMessage;
        } else {
            return this.buildSuccessfulMessage;
        }
    }
}
