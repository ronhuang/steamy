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
// Profile class.
///////////////////////////////////////////////////////////////////////////////
function Profile() {
    this.url = "";
    this.rating = "";
    this.age = "";
    this.eid = "";
    this.link = "";
    this.image = undefined;
}

Profile.prototype.isValid = function() {
    return (this.url.length &&
            this.age.length &&
            this.eid.length &&
            this.link.length) ? true : false;
};

///////////////////////////////////////////////////////////////////////////////
// Utility for Profile class.
///////////////////////////////////////////////////////////////////////////////
function freeProfile(profile) {
    if (undefined != profile && null != profile) {
        var image = profile.image;
        if (undefined != image && null != image)
            delete image;

        delete profile;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Profiles class.
///////////////////////////////////////////////////////////////////////////////
function Profiles() {
    this._profiles = [];
}

Profiles.prototype.length = function() {
    return this._profiles.length;
};

Profiles.prototype.parseDom = function(dom) {
    var profiles = dom.getElementsByTagName("rate_profile");

    for (var i = 0; i < profiles.length; i++) {
        var eP = profiles[i].getElementsByTagName("pic_url");
        var eR = profiles[i].getElementsByTagName("rating");
        var eA = profiles[i].getElementsByTagName("age");
        var eE = profiles[i].getElementsByTagName("eid");
        var eL = profiles[i].getElementsByTagName("rate_link");

        if (eP == null || eP.length <= 0 ||
            eR == null || eR.length <= 0 ||
            eA == null || eA.length <= 0 ||
            eE == null || eE.length <= 0 ||
            eL == null || eL.length <= 0)
            continue;

        if (eP.item(0) == null || eR.item(0) == null ||
            eA.item(0) == null || eE.item(0) == null ||
            eL.item(0) == null)
            continue;

        var profile = new Profile();
        profile.url  = eP.item(0).text;
        profile.rating = eR.item(0).text;
        profile.age = eA.item(0).text;
        profile.eid = eE.item(0).text;
        profile.link = eL.item(0).text;

        if (profile.isValid()) {
            this._profiles.push(profile);
        } else {
            delete profile;
        }
    }
};

Profiles.prototype.pop = function() {
    return this._profiles.pop();
}
