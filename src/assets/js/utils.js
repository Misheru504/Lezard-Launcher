import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
import status from './utils/serverstatus.js';

const md5 = require('md5');

var username = "";

export {
    config as config,
    database as database,
    logger as logger,
    changePanel as changePanel,
    addAccount as addAccount,
    slider as Slider,
    accountSelect as accountSelect,
    status as status,
    setActivity as setActivity,
    delay as delay
}

function changePanel(id) {
    let panel = document.querySelector(`.${id}`);
    let active = document.querySelector(`.active`)
    if (active) active.classList.toggle("active");
    panel.classList.add("active");
}

function addAccount(data) {
    let div = document.createElement("div");
    div.classList.add("account");
    div.id = data.uuid;
    div.innerHTML = `
        <img class="account-image" src="https://minotar.net/helm/${data.name}/100">
        <div class="account-name">${data.name}</div>
        <div class="account-uuid">${data.uuid}</div>
        <div class="account-delete"><div class="icon-account-delete icon-account-delete-btn"></div></div>
    `
    document.querySelector('.accounts').appendChild(div);
}

function accountSelect(uuid) {
    let account = document.getElementById(uuid);
    let pseudo = account.querySelector('.account-name').innerText;
    let activeAccount = document.querySelector('.active-account')

    username = pseudo;

    if (activeAccount) activeAccount.classList.toggle('active-account');
    account.classList.add('active-account');
    headplayer(pseudo);
}

function headplayer(pseudo) {
    document.querySelector(".player-head").style.backgroundImage = `url(https://minotar.net/helm/${pseudo}/100)`;
}

const time = Math.round(new Date().getTime()+5e3);

function setActivity(rpc) {
    if (!rpc || rpc === null || rpc === undefined) {
      return;
    }

    let hash = md5(username);

    getJSON('http://lezard-client.com/api/getGame?hwid=dev-hwid', function(err, data){
        if(err) throw err;

        var title = "In game";
        var desc = "Singleplayer";
        var indicator = "red_indicator";
        var com = "Client not launched";
        
        if(data.game_launched == false){
            title="In the launcher";
            desc="Idle";
            indicator = "red_indicator";
            com = "Client not launched";
        }else if(data.idle == true && data.game_launched == true){
            indicator = "green_indicator";
            com = "Client launched";
            title = "Idle";
            desc = `In ${data.menu_name}`;
        }else if(data.idle == false && data.online == true && data.game_launched == true){
            indicator = "green_indicator";
            com = "Client launched";
            title = "In Game";
            desc = "Online";
        }else if(data.idle == false && data.online == false && data.game_launched == true){
            indicator = "green_indicator";
            com = "Client launched";
            title = "In Game";
            desc = "Singleplayer";
        }

        rpc.setActivity({
            details: title, // Title
            state: desc, // Description
            startTimestamp: time, // First timestamp
            largeImageKey: 'lezard-rounded', // Big img
            largeImageText: `Version: ${data.version}`, // Get version here
            smallImageKey: indicator,
            smallImageText: com,
            instance: false, // Dont change
        });
    })
}

var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}