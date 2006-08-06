function Profile() {
    this.url = "";
    this.rating = "";
    this.age = "";
    this.emid = "";
    this.link = "";
    this.image = undefined;

    this.isValid = function() {
        return (this.url.length &&
                this.rating.length &&
                this.age.length &&
                this.emid.length &&
                this.link.length) ? true : false;
    };

    this.parseDom = function(dom) {
        var eP = dom.getElementsByTagName("pic_url");
        var eR = dom.getElementsByTagName("rating");
        var eA = dom.getElementsByTagName("age");
        var eE = dom.getElementsByTagName("emid");
        var eL = dom.getElementsByTagName("rate_link");

        if (eP == null || eP.length <= 0 ||
            eR == null || eR.length <= 0 ||
            eA == null || eA.length <= 0 ||
            eE == null || eE.length <= 0 ||
            eL == null || eL.length <= 0)
            return;

        if (eP.item(0) == null || eR.item(0) == null ||
            eA.item(0) == null || eE.item(0) == null ||
            eL.item(0) == null)
            return;

        this.url  = eP.item(0).text;
        this.rating = eR.item(0).text;
        this.age = eA.item(0).text;
        this.emid = eE.item(0).text;
        this.link = eL.item(0).text;
    };
}
