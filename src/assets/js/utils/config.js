const pkg = nw.global.manifest.__nwjs_manifest;
const fetch = require("node-fetch")
let url = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url

let config = `${url}/web/config-launcher/config.json`;
let news = `${url}/web/news-launcher/news.json`;

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
}

export default new Config;