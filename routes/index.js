var express = require('express');
var http = require('http');
var fs = require('fs');
var url = require('url');

var router = express.Router();

const NeteaseMusic = require('../lib/simple-netease-cloud-music')
const nm = new NeteaseMusic()

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/buscar', function (req, res, next) {
  nm.search(req.body.artista, 100, 1, 10).then(data => {
    res.render('index', { title: 'Express', artistas: data.result.artists });
  });
});


router.get('/artista/:id', function (req, res, next) {
  nm.artist(req.params.id).then(data => {
    res.render('index', { title: 'Express', musicas: data.hotSongs });
  });
});

router.get('/playlist/:id', function (req, res, next) {
  nm.artist(req.params.id).then(data => {

    const url = req.protocol + '://' + req.get('host');

    const head = '#EXTM3U' + '\n';

    var body = '';
    data.hotSongs.forEach(function (musica) {
      body += '#EXTINF: 0, ' + 'Bob Dylan - ' + musica.name + '\n';
      body += url + '/musica/' + musica.id + '\n';
    })

    res.setHeader('Content-type', "application/octet-stream");
    
    res.setHeader('Content-disposition', 'attachment; filename=file.m3u');

    res.send(head + body);
  });
});


router.get('/musica/:id', function (req, res, next) {
  nm.song(req.params.id).then(data => {
    return { titulo: data.songs[0].name.replace(/[^a-z0-9\s]/gi, ''), artista: data.songs[0].ar[0].name.replace(/[^a-z0-9\s]/gi, '') };
  }).then(info => {

    nm.url([req.params.id]).then(data3 => {
      data3.data.forEach(musica => {
        const link = url.parse(musica.url);
        const externalReq = http.request({
          hostname: link.hostname,
          path: link.pathname
        }, function (externalRes) {
          res.setHeader("content-disposition", "attachment; filename=\"" + info.artista + " - " + info.titulo + ".mp3\"");
          res.setHeader('content-length', musica.size);
          externalRes.pipe(res);
        });

        externalReq.end();
      });
    });
  });
});

/*
router.get('/hotSongs/:id', function (req, res, next) {
  nm.artist(req.params.id).then(data => {
    return data.hotSongs;
  }).then(hotSongs => {
    const arr = hotSongs.map(item => {
      return {
        artist: { id: item.ar[0].id, name: item.ar[0].name },
        album: { id: item.al.id, name: item.al.name },
        music: { id: item.id, name: item.name }
      };
    });

    return arr;
  }).then(json => {
    const ids = json.map(function (item) {
      return item.music.id;
    })

    nm.url(ids).then(musicasUrl => {
      console.log(musicasUrl);
      var tempObj = {};
      for (i = 0; i < json.length; i++) {               //Loop trough first array
        var curID = json[i].music.id;                   //Get ID of current object
        var exists = false;
        for (j = 0; j < musicasUrl.data.length; j++) {  //Loop trough second array
          exists = false;
          if (curID == musicasUrl.data[j].id) {       //If id from array1 exists in array2
            exists = true;
            tempObj = musicasUrl.data[j];           //Get id,object from array 2
            break;
          }
        }
        if (exists) {
          json[i].music.url = tempObj.url;              //If exists add circle from array2 to the record in array1
        }
      }

      return json;
    }).then(musicas => {


      const head = '#EXTM3U' + '<br/>';

      var body = '';
      musicas.forEach(function (item) {
        body += '#EXTINF:' + item.music.id + ', ' + item.artist.name + ' - ' + item.music.name + '<br/>';
        body += item.music.url + '<br/>';
      })

      console.log(head + body);

      res.render('index', { title: 'Express', playlist: (head + body) })
    });
  });
});
*/


module.exports = router;
