const fs       = require('fs');
const util     = require('util');
const express  = require('express');
const request  = require('request-promise-native');
const store    = require('../store');
const router   = express.Router();

const settings = require('../settings');

const readdir = util.promisify(fs.readdir);
const stripe = require("stripe")(
  settings.stripePrivateKey
);

const titles = {
  index: 'Home',
  photos: 'Photos',
  stats: 'Statistics'
};

(async () => {
  let views = await readdir('.viewsMin/pages');

  router.get('/', (req, res, next) => {
    res.render('pages/index', {title: 'Home'});
  });
  
  router.get('/:page?', (req, res, next) => {
    const page = req.params.page;
  
    if (page === 'index') {
      res.redirect(301, '/');
    } else if (views.indexOf(page + '.ejs') !== -1) {
      res.render('pages/' + page, {
        socket: ':' + settings.socket,
        title: titles[page],
        stripePublishKey: settings.stripePublishKey,
        googleCaptchaKey: settings.googleCaptchaKey,
        stats: store.get('stats')['30'].total,
        latestVersion: settings.latestVersion
      });
    } else {
      next();
    }
  });
  
  // Backwards compatibility with old versions of the PS extension
  router.all('/download/version.php', (req, res, next) => {
    res.json({"version": "3.0.1"});
  });
})();

module.exports = router;