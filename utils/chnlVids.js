const cheerio = require('cheerio');
const request = require('request');

function retriveJson(chnlUrl, callback){
    request({
        method: 'GET',
        url: chnlUrl,
    }, (err, res, body) => {
        if (err) return callback(false, err);
    
        let $ = cheerio.load(body);
    
        let item = '';
    
        $('script').each((i, el) => {
            item = $(el).html();
            if (item.indexOf('responseContext') !== -1) return false;
        });

        callback(true, JSON.parse(item.slice(20, -1)));
    });
}

function getVids(chnlJson, callback) {
    let chnlVid = chnlJson.videoId;
    let chnlVidThumb = `https://i.ytimg.com/vi/${chnlVid}/maxresdefault.jpg`;
    chnlVid = `https://www/youtube.com/watch?v=${chnlVid}`;
    let chnlVidTitle = chnlJson.title.runs[0].text;
    let chnlVidType = chnlJson.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.style;
    let chnlVidDate = ''; 
    let chnlVidViews = '';
    let chnlVidLength = '';
    if (chnlJson.publishedTimeText === undefined) {
        chnlVidViews = "0";
        chnlVidViews = "watching";
        if (chnlVidType === "LIVE") {
            chnlVidDate = chnlJson.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.style;
            if (chnlJson.viewCountText !== undefined) {
                chnlVidViews = chnlJson.viewCountText.runs[0].text;
                chnlVidLength = chnlJson.viewCountText.runs[1].text.trim();
            }
        } else if (chnlJson.upcomingEventData !== undefined) {
            chnlVidTimestamp = chnlJson.upcomingEventData.startTime;
            //convert timestamp to date 
            chnlVidDate = new Date(chnlVidTimestamp * 1000);
            chnlVidDate = new Date(chnlVidDate.toLocaleString("en-US", {timeZone: "Japan"}));
            if (chnlJson.shortViewCountText !== undefined) {
                chnlVidViews = chnlJson.shortViewCountText.runs[0].text;
                chnlVidLength = chnlJson.shortViewCountText.runs[1].text.trim();
            }
        } else {
            chnlVidDate = "Unspecified";
            chnlVidViews = chnlJson.viewCountText.simpleText;
            chnlVidLength = chnlJson.lengthText.simpleText;
        }
    } else {
        chnlVidDate = chnlJson.publishedTimeText.simpleText;
        chnlVidViews = chnlJson.viewCountText.simpleText;
        chnlVidLength = chnlJson.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.text.simpleText;
    }
    const returnJson = { [chnlVid] : [ chnlVidTitle, chnlVidDate, chnlVidViews, chnlVidLength, chnlVidThumb, chnlVidType ]};
    callback(chnlVidType, returnJson);
}

function main(url, method, callback) {
    retriveJson(url, (err, results) => {
        if (!err) return null;
        let listVids = results.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].gridRenderer.items;
        let chnlName = results.header.c4TabbedHeaderRenderer.title;
        let chnlAvatar = results.header.c4TabbedHeaderRenderer.avatar.thumbnails;
        chnlAvatar = chnlAvatar[chnlAvatar.length - 1].url;
    
        let returnResults = {};
        for (let i = 0; i <= listVids.length - 1; i++) {
            if (listVids[i].gridVideoRenderer != undefined) {
                getVids(listVids[i].gridVideoRenderer, (vidType, callback) => {
                    if (vidType === method) returnResults = Object.assign(returnResults, callback);
                })

            }
        }
        callback(returnResults);
    })
}

function checkUrl(url, callback){
    if (url.indexOf("youtube.com/channel/") == -1 && url.indexOf('youtube.com/c/') == -1) callback(null);
    if (url.slice(-1) === '/') url = url.slice(0, -1);
    if (url.slice(0,8) != 'https://' && url.slice(0,8) != 'http://') url = `https://${url}`;
    callback(url);
}

module.exports = {
    videos: (url, callback) => {
        checkUrl(url, (fixedUrl) => {
            fixedUrl = `${fixedUrl}/videos`;
            main(fixedUrl, "DEFAULT", (jsonLivestreams) => {
               callback(jsonLivestreams);
            })
        })
    },
    upcoming: (url, callback) => {
        checkUrl(url, (fixedUrl) => {
            fixedUrl = `${fixedUrl}/videos?view=2&live_view=502`;
            main(fixedUrl, "UPCOMING", (jsonLivestreams) => {
                callback(jsonLivestreams);
            })
        })
    },
    livestream: (url, callback) => {
        checkUrl(url, (fixedUrl) => {
            fixedUrl = `${fixedUrl}/videos?view=2&live_view=501`;
            main(fixedUrl, "LIVE", (jsonLivestreams) => {
               callback(jsonLivestreams); 
            })
        })
    }
}
