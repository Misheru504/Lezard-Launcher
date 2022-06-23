const pkg = nw.global.manifest.__nwjs_manifest;
const fetch = require("node-fetch")
let url = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url

let config = `${url}/launcher/config.json`;
let news = `${url}/launcher/tempNews.json`;
let servers = `${url}/launcher/serverList.json`

class Config {
    GetConfig() {
        return new Promise((resolve, reject) => {
            fetch(config).then(config => {
                return resolve(config.json());
            }).catch(error => {
                return reject(error);
            })
        })
    }

    async GetNews() {
        let rss = await fetch(news);
        if (rss.status === 200) {
            try {
                let news = await rss.json();
                return news;
            } catch (error) {
                return false;
            }
        } else {
            return false;
        }
    }

    async GetServers() {
        let rss = await fetch(servers);
        if (rss.status === 200) {
            try {
                let servers = await rss.json();
                return servers;
            } catch (error) {
                return false;
            }
        } else {
            return false;
        }
    }
}

export default new Config;