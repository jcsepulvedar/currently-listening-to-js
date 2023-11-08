/* eslint-disable camelcase */
/* eslint-disable max-len */
const functions = require('firebase-functions');
const fetch = require('node-fetch');
const axios = require('axios');

const utilities = require('./utilities');

const defaultCover = 'https://community.spotify.com/t5/image/serverpage/image-id/55829iC2AD64ADB887E2A5/image-size/large';

module.exports.getCurrentlyPlaying = functions.runWith({memory: '128MB'}).https.onRequest(async (req, res) => {
    res.setHeader('Cache-Control', 's-maxage=1');
    res.setHeader('content-type', 'image/svg+xml');
    console.log(res);
    console.log('header?');

    const response = await getNowPlaying();

    let songName = 'Everything seems quiet...';
    let artistName = 'Awfuly quiet...';
    let songUrl = '';
    let albumImageUrl;

    if (response.status === 204 || response.status > 400) {
        albumImageUrl = (await utilities.convertToBase64(defaultCover)).data.toString('base64');
        return res.status(200).send(buildSVG(songName, artistName, songUrl, albumImageUrl));
    }
    const song = response.data;

    const isPlaying = song.is_playing;

    // const album = song.item.album.name;
    if (isPlaying) {
        songName = song.item.name || 'Everything seems quiet...';
        artistName = song.item.artists.map((_artist) => _artist.name).join(', ') || 'Very unusally quiet...';
        songUrl = song.item.external_urls.spotify || '';
        albumImageUrl = song.item.album.images.length > 0 ? (await utilities.convertToBase64(song.item.album.images[0].url)).data.toString('base64') : (await utilities.convertToBase64(defaultCover)).data.toString('base64');
    } else {
        albumImageUrl = (await utilities.convertToBase64(defaultCover)).data.toString('base64');
    }
    return res.status(200).send(buildSVG(songName, artistName, songUrl, albumImageUrl));
});

// TODO: WHY DOES THIS AXIOS REQUEST NOT WORK??
const getAccessToken = async () => {
    // const headers = {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic ${process.env.BASE64}`,
    // };
    // const resp = await axios.post(`${process.env.TOKEN_ENDPOINT}?grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}`, {}, {
    //     headers,
    // });
    // return resp;
    return (await fetch(`${process.env.TOKEN_ENDPOINT}?grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${process.env.BASE64}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}`,
    })).json();
};

const getNowPlaying = async () => {
    const {access_token} = await getAccessToken();
    return axios.get(process.env.NOW_PLAYING_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
};

const buildSVG = (songTitle, artistName, songUrl, albumImageUrl) => {
    return `
    <svg width="480" height="131" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Adapted from https://github.com/novatorem -->    
    <foreignObject width="480" height="131">
        <div xmlns="http://www.w3.org/1999/xhtml" class="container">
            <style>
                .main {
                    display: flex;
                }
  
                .container {
                    border-radius: 5px;
                    background-color: #444;
                    animation: borderBottomAnimation 1.5s infinite alternate;
                }
                @keyframes borderBottomAnimation {
                    0% {border-bottom: 5px solid #1DB954;}
                    100% {border-bottom: 5px solid #4444;}
                }
                @@-moz-keyframes borderBottomAnimation {
                    0% {border-bottom: 5px solid #1DB954;}
                    100% {border-bottom: 5px solid #4444;}
                }
                @-webkit-keyframes borderBottomAnimation {
                    0% {border-bottom: 5px solid #1DB954;}
                    100% {border-bottom: 5px solid #4444;}
                }
  
                .art {
                    width: 27%;
                    float: left;
                    margin-left: -5px;
                }
  
                .content {
                    width: 100%;
                    padding-top: 10px;
                }
  
                .song {
                    width: 330px;
                    color: #f7f7f7;
                    overflow: hidden;
                    margin-top: 3px;
                    font-size: 24px;
                    text-align: center;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
  
                .artist {
                    width: 330px;
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
                    width: 100px;
                    height: 100px;
                    border-radius: 5px;
                }
                
                a {
                    text-decoration: none;
                }
  
                div {
                    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
                }
            </style>
  
            <div class="main">
              <a class="art" target="_blank">
                  <center>
                      <img src="data:image/png;base64, ${albumImageUrl}" class="cover" />
                  </center>
              </a>
                <div class="content">
                    <a href="${songUrl}" target="_blank">
                        <div class="song">${songTitle}</div>
                    </a>
                    <a href="${songUrl}" target="_blank">
                        <div class="artist">${artistName}</div>
                    </a>
              </div>
            </div>
  
        </div>
    </foreignObject>
  </svg>
    `;
};
