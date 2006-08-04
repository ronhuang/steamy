///////////////////////////////////////////////////////////////////////////////
// Constants.
///////////////////////////////////////////////////////////////////////////////
var OPTION_SIZE = 13;
var OPTION_MARGIN = 1;
var OPTION_COUNT = 10;
var OPTION_WIDTH = OPTION_SIZE + OPTION_MARGIN * 2;

var PROFILE_URL = "http://services.hotornot.com/rest/?app_key=485WGPUUQSJ&method=Rate.getRandomProfile&get_rate_info=true&retrieve_num=1&gender=%s&min_age=%s&max_age=%s";
var VOTE_URL = "http://services.hotornot.com/rest/?app_key=485WGPUUQSJ&method=Rate.submitVote&eid=%s&vote=%s";

var GENDERS = [strWomenAndMen, strWomenOnly, strMenOnly];
var STR_GENDERS = ["both", "female", "male"];
var AGES = [strAnyAge, strAge18To25, strAge26To32, strAge33To40, strOver40];
var STR_AGES = [[0, 255], [18, 25], [26, 32], [33, 40], [41, 255]];
var OPTION_IMG = ["option.png", "option_over.png", "option_down.png"];
var OPTION_SEL_IMG = ["optionSel.png", "optionSel_over.png", "optionSel_down.png"];

var SLIDESHOW_INTERVAL = 15000;
var MAX_QUEUE_LENGTH = 10;

///////////////////////////////////////////////////////////////////////////////
// Config default properties.
///////////////////////////////////////////////////////////////////////////////
for (var i in GENDERS) {
    options.defaultValue(GENDERS[i]) = 0;
}
options.defaultValue(strWomenOnly) = gddMenuItemFlagChecked;

for (var i in AGES) {
    options.defaultValue(AGES[i]) = 0;
}
options.defaultValue(strAge18To25) = gddMenuItemFlagChecked;

options.defaultValue(strSlideshow) = gddMenuItemFlagChecked;
options.defaultValue("slideshow_interval") = SLIDESHOW_INTERVAL;

///////////////////////////////////////////////////////////////////////////////
// Global variables.
///////////////////////////////////////////////////////////////////////////////
var profileQueue = new Queue(MAX_QUEUE_LENGTH);
var gProfile = undefined;

var slideshow_timer_token = null;
var slideshow_previous_value = options(strSlideshow);

///////////////////////////////////////////////////////////////////////////////
// Handler for populate option menu.
///////////////////////////////////////////////////////////////////////////////
plugin.onAddCustomMenuItems = addCustomMenuItems;

///////////////////////////////////////////////////////////////////////////////
// Functions related to fetch content from the Internet.
///////////////////////////////////////////////////////////////////////////////
function prepareNewProfiles() {
    if (profileQueue.full()) {
        setTimeout(prepareNewProfiles, options("slideshow_interval"));
        return;
    }

    var profileDom = new ActiveXObject("Microsoft.XMLDOM");
    profileDom.onreadystatechange = function () {
        if (4 == profileDom.readyState) {
            var lProfile = new Profile();
            lProfile.parseDom(profileDom);

            if (lProfile.isValid())
                prepareProfilePicture(lProfile);
            else {
                delete lProfile;
                // Something might be wrong with the connection.
                // To avoid 100% CPU usage when connection down, use timer instead.
                // XXX: Use the slideshow timer interval?
                setTimeout(prepareNewProfiles, options("slideshow_interval"));
            }
        }
    };

    profileDom.load(genProfileUrl());
}

function prepareProfilePicture(lProfile) {
    var profileReq = new XMLHttpRequest();
    profileReq.onreadystatechange = function () {
        if (4 == profileReq.readyState) {
            if (200 == profileReq.status) {
                lProfile.image = profileReq.responseStream;
                profileQueue.enqueue(lProfile);
            } else
                delete lProfile;

            prepareNewProfiles();
        }
    };

    profileReq.open("GET", lProfile.url, true);
    profileReq.send();
}

function switchProfile() {
    if (undefined != gProfile && null != gProfile &&
        undefined != gProfile.image && null != gProfile.image) {
        delete gProfile.image;
        delete gProfile;
    }

    gProfile = profileQueue.dequeue();
    if (undefined == gProfile) {
        setTimeout(switchProfile, options("slideshow_interval"));
        return;
    }

    // Profile picture
    theimage.src = gProfile.image;
    resizeTheImage(view);
    moveTheImage(view);

    // Profile rating
    rating.innerText = strRating + gProfile.rating;
    moveRating();

    // Because there are not radio widget, emulate with button.
    for (var i = 0; i < OPTION_COUNT; i++) {
        var btnOption = eval("vote" + (i + 1));
        btnOption.image = OPTION_IMG[0];
        btnOption.overImage = OPTION_IMG[1];
        btnOption.downImage = OPTION_IMG[2];
    }

    // Slideshow
    configSlideshow();
}

///////////////////////////////////////////////////////////////////////////////
// Functions related to user interface.
///////////////////////////////////////////////////////////////////////////////
function view_onopen() {
    prepareNewProfiles();
    setTimeout(switchProfile, options("slideshow_interval"));
}

function view_onsizing() {
    moveVoteOptions();
    resizeTheImage(event);
    moveTheImage(event);
    moveRating();
}

function view_onmouseover() {
    // Temporarily disable slideshow.
    slideshow_previous_value = options(strSlideshow);
    options(strSlideshow) = 0;

    disableSlideshow();
}

function view_onmouseout() {
    // Return slideshow option to previous value.
    options(strSlideshow) = slideshow_previous_value;

    configSlideshow();
}

function addCustomMenuItems(menu) {
    for (var i in GENDERS) {
        menu.AddItem(GENDERS[i], options(GENDERS[i]), genderMenuHandler);
    }
    menu.AddItem("", 0, menuHandler);

    for (var i in AGES) {
        menu.AddItem(AGES[i], options(AGES[i]), ageMenuHandler);
    }
    menu.AddItem("", 0, null);

    menu.AddItem(strSlideshow, options(strSlideshow), menuHandler);
}

function menuHandler(item) {
    if (strSlideshow == item) {
        options(strSlideshow) = options(strSlideshow) ? 0 : gddMenuItemFlagChecked;

        configSlideshow();
    }
}

function genderMenuHandler(item) {
    if (options(item) == gddMenuItemFlagChecked)
        return;

    for (var i in GENDERS) {
        options(GENDERS[i]) = 0;
    }
    options(item) = gddMenuItemFlagChecked;

    profileQueue.empty();
}

function ageMenuHandler(item) {
    if (options(item) == gddMenuItemFlagChecked)
        return;

    for (var i in AGES) {
        options(AGES[i]) = 0;
    }
    options(item) = gddMenuItemFlagChecked;

    profileQueue.empty();
}

function moveVoteOptions() {
    var startPos = Math.round((event.width - OPTION_WIDTH * OPTION_COUNT) / 2);
    if (startPos < 0) startPos = 0;

    for (var i = 0; i < OPTION_COUNT; i++) {
        var btnOption = eval("vote" + (i + 1));
        btnOption.x = startPos + OPTION_WIDTH * i + OPTION_MARGIN;
        btnOption.y = OPTION_MARGIN;
    }
}

function resizeTheImage(current) {
    if (theimage.srcWidth < current.width) {
        theimage.width = theimage.srcWidth;
        theimage.height = theimage.srcHeight;
    } else {
        theimage.width = current.width;
        theimage.height = theimage.srcHeight * current.width / theimage.srcWidth;
    }
}

function moveTheImage(current) {
    var startPos = Math.round((current.width - theimage.width) / 2);
    if (startPos < 0) startPos = 0;
    theimage.x = startPos;
}

function moveRating() {
    rating.y = theimage.y + theimage.height + 5;
    rating.visible = true;
}

function vote_onmouseover(idx) {
    myvote.innerText = "" + idx;

    myvote.x = theimage.x;
    myvote.width = theimage.width;
    myvote.visible = true;
}

function vote_onmouseout(idx) {
    myvote.visible = false;
}

function vote_onclick(vote) {
    if (undefined == gProfile || null == gProfile || 0 == gProfile.emid.length)
        return;

    var voteReq = new XMLHttpRequest();
    voteReq.onreadystatechange = function () {
        if (4 == voteReq.readyState) {
            if (voteReq.status == 200 || voteReq.status == 304) {
                switchProfile();
                prepareNewProfiles();
            }
        }
    };

    var url = sprintf(VOTE_URL, gProfile.emid, vote);
    voteReq.open("GET", url, true);
    voteReq.send();

    // Because there are not radio widget, emulate with button.
    var btnOption = eval("vote" + vote);
    btnOption.image = OPTION_SEL_IMG[0];
    btnOption.overImage = OPTION_SEL_IMG[1];
    btnOption.downImage = OPTION_SEL_IMG[2];
}

///////////////////////////////////////////////////////////////////////////////
// Utility functions.
///////////////////////////////////////////////////////////////////////////////
function genProfileUrl() {
    var gender = "female";
    var age_min = "20";
    var age_max = "30";

    for (var i in GENDERS) {
        if (gddMenuItemFlagChecked == options(GENDERS[i])) {
            gender = STR_GENDERS[i];
            break;
        }
    }

    for (var i in AGES) {
        if (gddMenuItemFlagChecked == options(AGES[i])) {
            age_min = STR_AGES[i][0];
            age_max = STR_AGES[i][1];
            break;
        }
    }

    return sprintf(PROFILE_URL, gender, age_min, age_max);
}

function disableSlideshow() {
    if (null != slideshow_timer_token) {
        clearInterval(slideshow_timer_token);
        slideshow_timer_token = null;
    }
}

function configSlideshow() {
    disableSlideshow();
    if (options(strSlideshow)) {
        slideshow_timer_token = setTimeout(switchProfile, options("slideshow_interval"));
    }
}

function sprintf() {
    if (!arguments || arguments.length < 1 || !RegExp) {
        return;
    }
    var str = arguments[0];
    var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
    var a = b = [], numSubstitutions = 0, numMatches = 0;

    while (a = re.exec(str)) {
        var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
        var pPrecision = a[5], pType = a[6], rightPart = a[7];

        numMatches++;
        if (pType == '%') {
            subst = '%';
        } else {
            numSubstitutions++;
            if (numSubstitutions >= arguments.length) {
                alert('Error! Not enough function arguments (' + (arguments.length - 1) + ', excluding the string)\nfor the number of substitution parameters in string (' + numSubstitutions + ' so far).');
            }
            var param = arguments[numSubstitutions];
            var pad = '';
            if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
            else if (pPad) pad = pPad;
            var justifyRight = true;
            if (pJustify && pJustify === "-") justifyRight = false;
            var minLength = -1;
            if (pMinLength) minLength = parseInt(pMinLength);
            var precision = -1;
            if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
            var subst = param;
            if (pType == 'b') subst = parseInt(param).toString(2);
            else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
            else if (pType == 'd') subst = parseInt(param) ? parseInt(param) : 0;
            else if (pType == 'u') subst = Math.abs(param);
            else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(param);
            else if (pType == 'o') subst = parseInt(param).toString(8);
            else if (pType == 's') subst = param;
            else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
            else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
        }
        str = leftpart + subst + rightPart;
    }
    return str;
}
