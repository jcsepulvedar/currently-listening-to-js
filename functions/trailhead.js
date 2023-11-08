/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const functions = require('firebase-functions');
const puppeteer = require('puppeteer');

const utilities = require('./utilities');

const profileUrl = 'https://trailblazer.me/id/jsepulvedar';

const admin = require('firebase-admin');

const fireStorePost = async (data) => {
    await admin.firestore()
        .collection('trailheadAPI')
        .doc('stats')
        .set(data, {merge: true});
};

const fetchStats = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(profileUrl, {
        waitUntil: 'networkidle2',
    });

    // Is there any way to factorize this?
    const getStats = await page.evaluate(() => {
        const lwcTbuiTally = (index) => document.querySelector('tbme-rank')
            .shadowRoot.querySelector('lwc-tds-theme-provider')
            .querySelector('lwc-tbui-card>.stats-container')
            .querySelectorAll('lwc-tbui-tally')[index].shadowRoot.querySelector('.tally__count.tally__count_success').innerText;
        return {
            badgeCount: lwcTbuiTally(0),
            pointCount: lwcTbuiTally(1),
            trailCount: lwcTbuiTally(2),
        };
    });
    // const profilePictureUrl = await page.evaluate(() => {
    //     const cssStyle = document.querySelector('.slds-button.avatar-img.avatar-img_expandable').getAttribute('style');
    //     return cssStyle.substring(cssStyle.indexOf('(') + 1, cssStyle.indexOf(')'));
    // });

    const rankPictureUrl = await page.evaluate(() => {
        return document.querySelector('tbme-rank').shadowRoot.querySelector('lwc-tbui-card>div>img').getAttribute('src');
    });
    await browser.close();
    const rankPictureUrlBase64 = (await utilities.convertToBase64(rankPictureUrl)).data.toString('base64');
    return {...getStats, rankPictureUrlBase64};
};


module.exports.updateStats = functions.runWith({memory: '512MB'}).https.onRequest(async (req, res) => {
    const stats = await fetchStats();
    await fireStorePost(stats);
    res.send('Update finished');
});

module.exports.trailheadStats = functions.runWith({memory: '128MB'}).https.onRequest(async (req, res) => {
    try {
        res.send((await admin.firestore().collection('trailheadAPI').doc('stats').get()).data());
    } catch (error) {
        res.send({});
        console.error(error);
    }
});

module.exports.trailheadCard = functions.runWith({memory: '128MB'}).https.onRequest(async (req, res) => {
    try {
        const stats = (await admin.firestore().collection('trailheadAPI').doc('stats').get()).data();
        res.setHeader('Cache-Control', 's-maxage=1');
        res.setHeader('content-type', 'image/svg+xml');
        res.send(`
        <svg width="300" height="131" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <foreignObject width="300" height="131">
            <div xmlns="http://www.w3.org/1999/xhtml" class="container">
                <style>
                    .main {
                        display: flex;
                    }
      
                    .container {
                        border-radius: 5px;
                        background-color: white;
                        animation: borderBottomAnimation 1.5s infinite alternate;
                    }
                    @keyframes borderBottomAnimation {
                        0% {border-bottom: 5px solid white;}
                        100% {border-bottom: 5px solid #009EDB;}
                    }
                    @@-moz-keyframes borderBottomAnimation {
                        0% {border-bottom: 5px solid white;}
                        100% {border-bottom: 5px solid #009EDB;}
                    }
                    @-webkit-keyframes borderBottomAnimation {
                        0% {border-bottom: 5px solid white;}
                        100% {border-bottom: 5px solid #009EDB;}
                    }
      
                    .ranking {
                        width: 27%;
                        float: left;
                        margin-left: -5px;
                    }
      
                    .content {
                        width: 100%;
                        padding-top: 10px;
                        padding-left: 40px;
                    }
      
                    .stat {
                        width: 100px;
                        color: #048149;
                        overflow: hidden;
                        margin-top: 3px;
                        font-size: 24px;
                        text-align: center;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }

                    .label {
                        width: 80px;
                        color: #1e1e1e;
                        overflow: hidden;
                        margin-top: 3px;
                        font-size: 18px;
                        text-align: center;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
      
                    .artist {
                        width: 220px;
                        color: #9f9f9f;
                        font-size: 20px;
                        margin-top: 4px;
                        text-align: center;
                        margin-bottom: 5px;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
      
                    .cover {
                        width: 120px;
                        height: 120px;
                        border-radius: 20px;
                    }
                    
                    a {
                        text-decoration: none;
                    }
      
                    div {
                        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
                    }
                </style>
                <a href="${profileUrl}" target="_blank">
                    <div class="main">
                        <center>
                            <img src="data:image/png;base64, ${stats.rankPictureUrlBase64}" class="cover" />
                        </center>
                        <div class="content">
                            <div>
                                <span class="label">
                                    Points
                                </span>
                                <span class="stat">
                                    ${stats.pointCount}
                                </span>
                            </div>
                            <div>
                                <span class="label">
                                    Badges
                                </span>
                                <span class="stat">
                                    ${stats.badgeCount}
                                </span>
                            </div>
                            <div>
                                <span class="label">
                                    Trails
                                </span>
                                <span class="stat">
                                    ${stats.trailCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        </foreignObject>
      </svg>
        `);
    } catch (error) {
        res.send({});
        console.error(error);
    }
});
