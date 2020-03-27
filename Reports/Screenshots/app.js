var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "It should open main web page|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "007300b8-00f8-0019-00bd-00a900f50076.png",
        "timestamp": 1585315392290,
        "duration": 7678
    },
    {
        "description": "It should click on profile|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005800cd-0013-00f9-00f3-002d00d00099.png",
        "timestamp": 1585315400599,
        "duration": 866
    },
    {
        "description": "It should change frame|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0057000d-0007-001c-009d-0095000c009d.png",
        "timestamp": 1585315402611,
        "duration": 2263
    },
    {
        "description": "It should click login button without enter email and password|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00be0071-00b3-0075-0084-0003004600ea.png",
        "timestamp": 1585315405397,
        "duration": 2500
    },
    {
        "description": "It should enter valid email and wrong password|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000400ff-00b4-00ac-0061-0009009a00e3.png",
        "timestamp": 1585315408325,
        "duration": 3406
    },
    {
        "description": "It should enter invalid email|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008a00be-00cf-00ce-0021-002000210072.png",
        "timestamp": 1585315412264,
        "duration": 2669
    },
    {
        "description": "It should enter valid email and password|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://demo.clickdoc.de/cd-de/scripts.5908aaef1db3a113210a.js 0 Invalid asm.js: Unexpected token",
                "timestamp": 1585315426607,
                "type": ""
            }
        ],
        "screenShotFile": "007e005b-0014-0034-00ff-00e200a5006e.png",
        "timestamp": 1585315415429,
        "duration": 13188
    },
    {
        "description": "It should click on profil and select|Login test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00f800b5-0077-005d-00b2-0080008e0077.png",
        "timestamp": 1585315429056,
        "duration": 3446
    },
    {
        "description": "It should open main web page|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ca0058-00a0-0032-00ca-00a600f60014.png",
        "timestamp": 1585315433092,
        "duration": 5758
    },
    {
        "description": "It should check the search section|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004b0020-002d-0006-00b4-008800a700f2.png",
        "timestamp": 1585315439292,
        "duration": 1847
    },
    {
        "description": "It should verify result section|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ee00e8-0053-00d7-001d-00bc00950063.png",
        "timestamp": 1585315441590,
        "duration": 72
    },
    {
        "description": "It should check the sorting-section|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008600a8-00d2-00b5-00c0-004b005300a9.png",
        "timestamp": 1585315442086,
        "duration": 7837
    },
    {
        "description": "It should select the Name Inputfield in the search section and enter any input|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js 0:411583 \"ERROR\" TypeError: window.Stripe is not a function\n    at e.ngOnInit (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:1819370)\n    at https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:498248\n    at https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:498291\n    at T_ (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:499614)\n    at iv (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:507604)\n    at Object.updateDirectives (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:1939621)\n    at Object.updateDirectives (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:504426)\n    at Object.x_ [as checkAndUpdateView] (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:496195)\n    at e.detectChanges (https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:477588)\n    at https://demo.clickdoc.de/cd-de/main.c2ecff71235e5593a3bd.js:1:434012",
                "timestamp": 1585315451318,
                "type": ""
            }
        ],
        "screenShotFile": "0083000b-003f-00c9-00b6-00d500b500c7.png",
        "timestamp": 1585315450392,
        "duration": 6401
    },
    {
        "description": "It should Enter further input to refine the search|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00200056-00bf-00b7-00c8-00cc00250063.png",
        "timestamp": 1585315457256,
        "duration": 1338
    },
    {
        "description": "It should enter further input for which no results exist|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00f40031-0012-00af-00dc-004d00780095.png",
        "timestamp": 1585315459029,
        "duration": 1138
    },
    {
        "description": "It should enter valid input into „Name“ Inputfield again, and press the „Search“-Button|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008800bb-0098-0006-006c-000900c60002.png",
        "timestamp": 1585315460595,
        "duration": 4768
    },
    {
        "description": "It should check a search-result object|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009000fa-001d-0029-0061-00b300d0005c.png",
        "timestamp": 1585315465818,
        "duration": 2
    },
    {
        "description": "It should scroll to the bottom of the page|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c600b9-00b3-0087-00ea-003200ad0075.png",
        "timestamp": 1585315466286,
        "duration": 2053
    },
    {
        "description": "It should click the Show more Button|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00510095-004a-0066-00be-0042004a00d5.png",
        "timestamp": 1585315468843,
        "duration": 2165
    },
    {
        "description": "It should croll back to the top and enter valid data into the Location-Inputfield|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00620089-00e2-00ee-0043-00f800b500db.png",
        "timestamp": 1585315471463,
        "duration": 1409
    },
    {
        "description": "It select from Scroll suggestion|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00db00e0-00cd-009a-007a-00e1002200cd.png",
        "timestamp": 1585315473338,
        "duration": 7603
    },
    {
        "description": "It should check the Online Bookable Checkbox|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004e00a4-001e-0075-0087-007b00e70057.png",
        "timestamp": 1585315481397,
        "duration": 1217
    },
    {
        "description": "It should click the Search-Button again|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004f006a-00f3-0037-00c9-005b000d0004.png",
        "timestamp": 1585315483058,
        "duration": 3271
    },
    {
        "description": "It should check Video-Conference Checkbox, empty the \"Name\" inputfield and click the Search Button again|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e20006-00a9-00d9-00c9-003e00280015.png",
        "timestamp": 1585315486780,
        "duration": 3564
    },
    {
        "description": "It should uncheck Video-Conference Checkbox again, check Barrier-Free Checkbox and click search again|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005d000a-00cc-004d-002c-005000e000a2.png",
        "timestamp": 1585315490773,
        "duration": 3509
    },
    {
        "description": "It should check the „Alphabetical-Sort“ option in the sorting section|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c90050-00b5-0013-008c-001800a800f6.png",
        "timestamp": 1585315494702,
        "duration": 11459
    },
    {
        "description": "It should check the Distance-Sort option in the sorting section|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001e0008-00d7-00ee-005c-003700540093.png",
        "timestamp": 1585315506606,
        "duration": 13702
    },
    {
        "description": "It should drag range slider without releasing it|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009300d8-00fa-00f3-0030-000e006000a4.png",
        "timestamp": 1585315520757,
        "duration": 5589
    },
    {
        "description": "Release dragging of slider|PhysicianSearch test",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ac0e773a5c63d4c8df6fee6c6858415b",
        "instanceId": 13837,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002a0004-00dd-0042-009e-004f007e005c.png",
        "timestamp": 1585315526806,
        "duration": 10202
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
