'use strict';

import { logger, database, changePanel, status } from '../utils.js';

const { launch } = require('minecraft-java-core');
const pkg = nw.global.manifest.__nwjs_manifest;
const win = nw.Window.get();

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Home {
    static id = "home";
    async init(config, news, servers) {
        this.config = config
        this.news = await news
        this.database = await new database().init();
        this.servers = await servers;
        this.initNews();
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
    }

    initNews() {
        let news = document.querySelector('.news-list');
        if (this.news) {
            if (!this.news.length) {
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-block', 'opacity-1');
                blockNews.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title">Aucun news n'ai actuellement disponible.</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>Vous pourrez suivre ici toutes les news relative au serveur.</p>
                        </div>
                    </div>`
                news.appendChild(blockNews);
            } else {
                for (let News of this.news) {
                    let date = this.getdate(News.publish_date)
                    let blockNews = document.createElement('div');
                    blockNews.classList.add('news-block');
                    blockNews.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content.replace(/\n/g, '</br>')}</p>
                                <p class="news-end">Link : <span><a href="${News.link}" target="_blank">${News.link}</a></span>, Author : <span>${News.author}</span></p>
                            </div>
                        </div>`
                    news.appendChild(blockNews);
                }
            }
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-block', 'opacity-1');
            blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title">Error.</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>Cannot connect to the server</br>Please check your internet connexion</p>
                    </div>
                </div>`
            news.appendChild(blockNews);
        }
    }

    async initLaunch() {
        document.querySelector('.play-btn').addEventListener('click', async() => {
            let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
            let uuid = (await this.database.get('1234', 'accounts-selected')).value;
            let account = (await this.database.get(uuid.selected, 'accounts')).value;
            let ram = (await this.database.get('1234', 'ram')).value;
            let javaPath = (await this.database.get('1234', 'java-path')).value;
            let javaArgs = (await this.database.get('1234', 'java-args')).value;
            let Resolution = (await this.database.get('1234', 'screen')).value;
            let launcherSettings = (await this.database.get('1234', 'launcher')).value;
            let screen;

            let playBtn = document.querySelector('.play-btn');
            let info = document.querySelector(".text-download")
            let progressBar = document.querySelector(".progress-bar")
            let logcontent = document.querySelector(".log-content")

            if (Resolution.screen.width == '<auto>') {
                screen = false
            } else {
                screen = {
                    width: Resolution.screen.width,
                    height: Resolution.screen.height
                }
            }

            let opts = {
                url: this.config.game_url === "" || this.config.game_url === undefined ? `${urlpkg}/files/` : this.config.game_url,
                authenticator: account,
                path: `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
                version: this.config.game_version,
                detached: launcherSettings.launcher.close === 'close-all' ? false : true,
                java: this.config.java,
                javapath: javaPath.path,
                args: [...javaArgs.args, ...this.config.game_args],
                screen,
                custom: this.config.custom,
                verify: false,
                ignored: this.config.ignored,
                memory: {
                    min: `${ram.ramMin * 1024}M`,
                    max: `${ram.ramMax * 1024}M`
                }
            }

            playBtn.style.display = "none"
            info.style.display = "block"
            launch.launch(opts);

            launch.on('progress', (DL, totDL) => {
                progressBar.style.display = "block"
                document.querySelector(".text-download").innerHTML = `Downloading ${((DL / totDL) * 100).toFixed(0)}%`
                win.setProgressBar(DL / totDL);
                progressBar.value = DL;
                progressBar.max = totDL;
            })

            launch.on('speed', (speed) => {
                console.log(`${(speed / 1067008).toFixed(2)} MB/s`)
            })

            launch.on('check', (e) => {
                progressBar.style.display = "block"
                document.querySelector(".text-download").innerHTML = `Validating ${((DL / totDL) * 100).toFixed(0)}%`
                progressBar.value = DL;
                progressBar.max = totDL;

            })

            launch.on('data', (e) => {
                new logger('Minecraft', '#3036b0', logcontent);
                if(launcherSettings.launcher.close === 'close-launcher') win.hide();
                progressBar.style.display = "none"
                win.setProgressBar(0);
                info.innerHTML = `Starting...`
                console.log(e);
            })

            launch.on('close', () => {
                if(launcherSettings.launcher.close === 'close-launcher') {
                    win.show();
                    win.focus();
                    win.setShowInTaskbar(true);
                }
                progressBar.style.display = "none"
                info.style.display = "none"
                playBtn.style.display = "block"
                info.innerHTML = `Validating`
                new logger('Launcher', '#7289da', logcontent);
                console.log('Close');
            })
        })
    }

    async initStatusServer() {
        let servers = document.querySelector('.server-list');
        var gap = 0;

        if (this.servers) {
            if (!this.servers.length) {
                let listServer = document.createElement('div');
                listServer.classList.add('server');
                listServer.innerHTML = `
                    <img class="server-img" src="https://www.pngmart.com/files/17/Wrong-Symbol-PNG-Image.png"/>
                    <div class="server-text">
                        <div class="name">No servers</div>
                        <div class="desc"><span class="red">Closed</span> - 0ms</div>
                    </div>
                    <div class="etat-text">
                        <div class="text">0</div>
                        <div class="online off"></div>
                    </div>`
                servers.appendChild(listServer);
            } else {
                for (let Server of this.servers) {
                    // console.log(`Server: ${Server.name}, ip: ${Server.ip}:${Server.port}, image link: ${Server.img}`);
                    let listServer = document.createElement('div');
                    listServer.classList.add('server');
                    listServer.style.top = gap + "px";

                    let serverPing = await new status(Server.ip, Server.port).getStatus();

                    if(!serverPing.error){
                        listServer.innerHTML = `
                            <img class="server-img" src="${Server.img}"/>
                            <div class="server-text">
                                <div class="name">${Server.name}</div>
                                <div class="desc"><span class="green">Online</span> - ${serverPing.ms}ms</div>
                            </div>
                            <div class="etat-text">
                                <div class="text">${serverPing.players}</div>
                                <div class="online"></div>
                            </div>`
                    }else {
                        listServer.innerHTML = `
                            <img class="server-img" src="${Server.img}"/>
                            <div class="server-text">
                                <div class="name">${Server.name}</div>
                                <div class="desc"><span class="red">Closed</span> - 0ms</div>
                            </div>
                            <div class="etat-text">
                                <div class="text">0</div>
                                <div class="online off"></div>
                            </div>`
                    }
                    gap = gap+7;
                    servers.appendChild(listServer);
                }
            }
            servers.appendChild(document.createElement('br'));
        } else {
            let listServer = document.createElement('div');
            listServer.classList.add('server');
            listServer.innerHTML = `
                <img class="server-img" src="https://www.pngmart.com/files/17/Wrong-Symbol-PNG-Image.png"/>
                    <div class="server-text">
                        <div class="name">No servers</div>
                        <div class="desc"><span class="red">Closed</span> - 0ms</div>
                    </div>
                <div class="etat-text">
                    <div class="text">0</div>
                    <div class="online off"></div>
                </div>`
            servers.appendChild(listServer);
        }
    }

    initBtn() {
        document.querySelector('.settings-btn').addEventListener('click', () => {
            changePanel('settings');
        });
    }

    getdate(e) {
        let date = new Date(e)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let allMonth = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
        return { year: year, month: allMonth[month - 1], day: day }
    }
}
export default Home;