const fs         = require('fs');
const writeFile  = require('util').promisify(fs.writeFile);
const unlink     = require('util').promisify(fs.unlink);
const qs         = require('qs');
const legRequest = require('request-promise-native');
const express    = require('express');
const router     = express.Router();
const settings   = require('../settings');
const Request    = require('../models/Request');
const store      = require('../store');
const util       = require('../util');

router.use('/portraits', express.static('public/portraits'));

router.get('/:version?', (req, res, next) => {
  genUser(req, res, req.params.version || settings.latestVersion);
}); 

async function genUser(req, res, version) {
  let clients = store.get('clients');
  req.query.fmt = req.query.fmt || req.query.format;

  const ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (process.env.spec !== "true" && clients[ip] >= settings.limit) {
    return res.status(429).json({
      error: `Whoa, ease up there cowboy. You've requested ${clients[ip]} users in the last minute. Help us keep this service free and spare some bandwidth for other users please :)`
    });
  }

  // Version doesn't exist
  if (typeof (store.get('generators'))[version] === 'undefined') {
    res.sendStatus(404);
    return;
  }

  let results = req.query.results || 1;
  if (results > settings.maxResults || results < 1 || isNaN(results) || !Number.isInteger(+results)) {
    results = 1;
  }
  req.query.results = results;

  let dl = typeof req.query.dl !== 'undefined' || typeof req.query.download !== 'undefined' ? true : false;

  if (!(ip in clients)) {
    clients[ip] = Number(results);
  } else {
    clients[ip] += Number(results);
  }

  // PS Extension - only use us & gb nats
  if (req.query.extension === "true") {
    req.query.nat = "us,gb"
  }

  let {output, ext} = await (store.get('generators')[version]).generate(req.query);

  let downloadName = "tmp/" + String(new Date().getTime());

  if (typeof req.query.callback !== 'undefined' && ext === "json") {
    output = String(req.query.callback) + "(" + output + ");";
  }

  // Download - save file and update headers
  if (dl) {
    res.setHeader('Content-disposition', 'attachment; filename=download.' + ext);
    await writeFile(downloadName, output, 'utf8');
  } else {
    if (ext === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else if (ext === 'xml') {
      res.setHeader('Content-Type', 'text/xml');
    } else if (ext === 'yaml') {
      res.setHeader('Content-Type', 'text/x-yaml');
    } else if (ext === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }
  }

  res.setHeader('Cache-Control', 'no-cache');

  let payload = {
    'bandwidth': output.length,
    'total': results
  };
  payload[version.replace(/\./g, '_')] = results;

  let doc = await Request.findOneAndUpdate(
    {date: util.getDateTime()},
    {$setOnInsert: payload},
    {
      returnOriginal: true,
      upsert: true,
    }
  );

  if (doc !== null) {
    await Request.updateOne({date: util.getDateTime()}, {$inc: payload});
  }

  // Download or output file
  if (dl) {
    res.download(downloadName, "download." + ext, async () => {
      await unlink(downloadName);
    });
  } else {
    // Hacky PS extension formatting
    if (req.query.extension === "true") {
      output = JSON.parse(output);
      var extObj = {
        results: [{
          user: {
            picture: output.results[0].picture.large.replace('/api', '').replace('https', 'http'),
            name: {
              first: output.results[0].name.first,
              last: output.results[0].name.last
            }
          }
        }]
      };
      res.send(extObj);
    } else {
      res.send(output);
    }
  }
}

module.exports = router;
