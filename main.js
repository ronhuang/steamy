///////////////////////////////////////////////////////////////////////////////
// Constants.
///////////////////////////////////////////////////////////////////////////////
var OPTION_SIZE = 13;
var OPTION_MARGIN = 1;
var OPTION_COUNT = 10;
var OPTION_WIDTH = OPTION_SIZE + OPTION_MARGIN * 2;

var PROFILE_URL = "http://services.hotornot.com/rest/?app_key=485WGPUUQSJ&method=Rate.getRandomProfile&get_rate_info=true&gender=%s&min_age=%s&max_age=%s&retrieve_num=%d";
var VOTE_URL = "http://services.hotornot.com/rest/?app_key=485WGPUUQSJ&method=Rate.submitVote&eid=%s&vote=%s";

var GENDERS = [strWomenAndMen, strWomenOnly, strMenOnly];
var STR_GENDERS = ["both", "female", "male"];
var AGES = [strAnyAge, strAge18To25, strAge26To32, strAge33To40, strOver40];
var STR_AGES = [[0, 255], [18, 25], [26, 32], [33, 40], [41, 255]];
var OPTION_IMG = ["option.png", "option_over.png", "option_down.png"];
var OPTION_SEL_IMG = ["optionSel.png", "optionSel_over.png", "optionSel_down.png"];

var SLIDESHOW_INTERVAL = 15000;
var MAX_QUEUE_LENGTH = 12;

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

var profiles_timer_token = null;
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
    if (profileQueue.moreThanHalf()) {
        if (null != profiles_timer_token)
            clearInterval(profiles_timer_token);
        profiles_timer_token = setTimeout(prepareNewProfiles, options("slideshow_interval"));
        return;
    }

    var profilesDom = new ActiveXObject("Microsoft.XMLDOM");
    profilesDom.onreadystatechange = function () {
        if (4 == profilesDom.readyState) {
            var profiles = new Profiles();
            profiles.parseDom(profilesDom);

            var i = profiles.length();
            while (i--) {
                prepareProfilePicture(profiles.pop());
            }
        }
    };

    profilesDom.load(getFetchProfilesUrl());

    if (null != profiles_timer_token)
        clearInterval(profiles_timer_token);
    profiles_timer_token = setTimeout(prepareNewProfiles, options("slideshow_interval"));
}

function prepareProfilePicture(profile) {
    var profileReq = new XMLHttpRequest();

    profileReq.onreadystatechange = function() {
        if (4 == profileReq.readyState) {
            if (200 == profileReq.status) {
                profile.image = profileReq.responseStream;
                profileQueue.push(profile);

                // Show the first retrieved profile asap.
                if (undefined == gProfile)
                    switchProfile();
            } else {
                freeProfile(profile);
            }
        }
    };

    profileReq.open("GET", profile.url, true);
    profileReq.send();
}

function switchProfile() {
    freeProfile(gProfile);

    gProfile = profileQueue.pop();
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

    // Maintain the Open link
    open.href = gProfile.link;

    // Slideshow
    configSlideshow();
}

///////////////////////////////////////////////////////////////////////////////
// Functions related to user interface.
///////////////////////////////////////////////////////////////////////////////
function view_onopen() {
    prepareNewProfiles();
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
    freeProfile(gProfile);
    gProfile = undefined; // Force showing the first profile asap.
    prepareNewProfiles();
}

function ageMenuHandler(item) {
    if (options(item) == gddMenuItemFlagChecked)
        return;

    for (var i in AGES) {
        options(AGES[i]) = 0;
    }
    options(item) = gddMenuItemFlagChecked;

    profileQueue.empty();
    freeProfile(gProfile);
    gProfile = undefined; // Force showing the first profile asap.
    prepareNewProfiles();
}

function moveVoteOptions() {
    var startPos = Math.round((event.width - OPTION_WIDTH * OPTION_COUNT) / 2);
    if (startPos < 0) startPos = 0;

    for (var i = 0; i < OPTION_COUNT; i++) {
        var btnOption = eval("vote" + (i + 1));
        btnOption.x = startPos + OPTION_WIDTH * i + OPTION_MARGIN;
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
    myvote.visible = true;
}

function vote_onmouseout(idx) {
    myvote.visible = false;
}

function vote_onclick(vote) {
    if (undefined == gProfile || null == gProfile || 0 == gProfile.eid.length)
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

    var url = sprintf(VOTE_URL, gProfile.eid, vote);
    voteReq.open("GET", url, true);
    voteReq.send();

    // Because there are not radio widget, emulate with button.
    var btnOption = eval("vote" + vote);
    btnOption.image = OPTION_SEL_IMG[0];
    btnOption.overImage = OPTION_SEL_IMG[1];
    btnOption.downImage = OPTION_SEL_IMG[2];
}

function share_onclick() {
    if (!friends.visible) {
        populateFriendList();
        friends.visible = true;
    } else {
        friends.visible = false;
    }
}

function populateFriendList() {
    var count = friends.children.count;
    while(count--) {
        var child = friends.children(count);
        friends.removeElement(child);
    }

    var frs = googleTalk.friends.toArray();
    var y = 5;
    for (var i = 0; i < frs.length; i++) {
        var fr = frs[i];

        var el = friends.appendElement('<a x="5" y="' + y + '" width="245" ' +
                                       'onclick="OnClick(\'' + fr.user_id + '\')"/>');

        y += 15;
    }

    friends.width = 245;
    friends.height = y;
}

function friend_onclick(uid) {
}

///////////////////////////////////////////////////////////////////////////////
// Utility functions.
///////////////////////////////////////////////////////////////////////////////
function getFetchProfilesUrl() {
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

    return sprintf(PROFILE_URL, gender, age_min, age_max, MAX_QUEUE_LENGTH / 2);
}

function disableSlideshow() {
    if (null != slideshow_timer_token) {
        clearInterval(slideshow_timer_token);
        slideshow_timer_token = null;
    }
}

function configSlideshow() {
    disableSlideshow();
    if (gddMenuItemFlagChecked == options(strSlideshow)) {
        slideshow_timer_token = setTimeout(switchProfile, options("slideshow_interval"));
    }
}
