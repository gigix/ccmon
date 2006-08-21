﻿function StubConfig() {
    this.resultPageUrl = "http://10.6.4.146/cruisecontrol/buildresults/selenium";
    // check per minute
    this.checkInterval = 60000;
    this.buildFailedIndicate = "FAILED";
}

function FileBasedConfig(filename) {
    //        Set objFile = objFSO.OpenTextFile("C:\FSO\ScriptLog.txt", ForReading)
    //        strContents = objFile.ReadAll
    var file = framework.system.filesystem.OpenTextFile(filename, 1);
    this.rawText = file.ReadAll();
}

var config = new StubConfig();

function initGadget() {
    myGadget = new CCMonitor(new WebPage(config.resultPageUrl), config.buildFailedIndicate);
    myGadget.init();
    setInterval("myGadget.checkBuildStatus()", config.checkInterval);
}

function WebPage(url) {
    this.url = url;

    this.content = function() {
        var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        // is there any other way to disable cache?
        var actualUrl = this.url + "?" + new Date().toTimeString();
        xmlhttp.open("GET", actualUrl, false);
        xmlhttp.send();

        if (xmlhttp.status != 200) { // what if redirecting exists?
            throw "Cannot get page content : " + actualUrl;
        }

        return xmlhttp.responseText;
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
    }

    this.saveOptions = function() {
        // not implemented yet
        alert("Hello");
    }

    this.checkBuildStatus = function() {
        try {
            var content = this.webPage.content();
        } catch (e) { // cannot retrieve build result page?
            this.refreshDisplay(this.buildStatusUnknownMessage);
            return;
        }
        gadget.debug.trace(content);
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