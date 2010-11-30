/*
Copyright (C) 2010 Ron Huang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

///////////////////////////////////////////////////////////////////////////////
// Constants.
///////////////////////////////////////////////////////////////////////////////
var OPTION_SIZE = 13;
var OPTION_MARGIN = 1;
var OPTION_COUNT = 10;
var OPTION_WIDTH = OPTION_SIZE + OPTION_MARGIN * 2;

var PROFILE_URL = "http://services.hotornot.com/rest/?app_key=%s&method=Rate.getRandomProfile&get_rate_info=true&gender=%s&min_age=%s&max_age=%s&retrieve_num=%d";
var VOTE_URL = "http://services.hotornot.com/rest/?app_key=%s&method=Rate.submitVote&eid=%s&vote=%s";

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

    var profilesReq = new XMLHttpRequest();
    profilesReq.onreadystatechange = function() {
        if (4 == profilesReq.readyState && 200 == profilesReq.status) {
            var profiles = new Profiles();
            profiles.parseDom(profilesReq.responseXML);

            var i = profiles.length();
            while (i--) {
                prepareProfilePicture(profiles.pop());
            }
        }
    };

    profilesReq.open("GET", getFetchProfilesUrl(), true);
    profilesReq.send();

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
    disableSlideshow();
}

function view_onmouseout() {
    // Return slideshow option to previous value.
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
    // The 28 is for the "rating" label to show.
    var ratio = Math.min(current.width / theimage.srcWidth,
                         (current.height - theimage.y - 28) / theimage.srcHeight);

    theimage.width = theimage.srcWidth * ratio;
    theimage.height = theimage.srcHeight * ratio;
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

function vote_onmouseout() {
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

    var url = sprintf(VOTE_URL, APP_KEY, gProfile.eid, vote);
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

    return sprintf(PROFILE_URL, APP_KEY, gender, age_min, age_max, MAX_QUEUE_LENGTH / 2);
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
