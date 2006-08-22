options("resultPageUrl") = "http://localhost/MockTestResult.aspx";
//options("resultPageUrl") = "http://10.6.4.146/cruisecontrol/buildresults/selenium";
// check per minute
options("checkInterval") = 3000;
options("buildFailedIndicate") = "FAILED";

function saveOptions() {
    // not implemented yet
    alert(txtUrl.value);
}

function OptionsConfig() {
    this.resultPageUrl = options("resultPageUrl");
    this.checkInterval = options("checkInterval");
    this.buildFailedIndicate = options("buildFailedIndicate");
}

var config = new OptionsConfig();

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