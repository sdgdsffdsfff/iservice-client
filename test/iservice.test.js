/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var fs      = require('fs');
var should  = require('should');

/* {{{ mocked iservice server */

var __mockeddata = {
  '/test/key1'  : {
    'data'  : 1234,
    'meta'  : 1,
  },
  '/test/key2'  : {
    'data'  : 5678,
    'meta'  : 2,
  },
  '/test/key1/aa'   : {
    'data'  : '{"a" : "abcd"}',
    'meta'  : 2,
  },
  '/test'   : {
    'data'  : '周华健',
    'meta'  : 1,
  },
};

var http = require('http').createServer(function (req, res) {
  var url = [];
  req.url.split('?').shift().split('/').forEach(function (item) {
    item = item.trim();
    if ('' !== item) {
      url.push(decodeURIComponent(item));
    }
  });

  var ctl = url.shift();
  if ('api' === ctl) {
    var key = url.join('/');
    switch (url.shift()) {
      case 'get':
        res.write(JSON.stringify({
          'error'   : null,
          'data'    : __mockeddata[key],
        }));
        break;

      case 'watch':
        return setTimeout(function () {
          res.end(JSON.stringify({
            'error' : null,
            'data'  : Date.now(),
          }));
        }, (req.headers.timeout || 1000) - 5);
        break;

      case 'tree':
        res.write(JSON.stringify({
          'error'   : null,
          'data'    : __mockeddata,
        }));
        break;

      case 'feedback':
        break;

      default:
        res.write('undefined action.');
        break;
    }
  }

  res.end();
}).listen(33750);

/* }}} */

describe('iservice connect interface', function () {

  /* {{{ client object */
  var client = require(__dirname + '/../lib/iservice.js').create({
    'hosts' : '127.0.0.1:33750',
      'root'    : 'test',
      'user'    : 'unittest',
      'pass'    : '123456',
      'cache'   : __dirname + '/../run/cache',
      'uuid'    : '{PID}',
  });
  /* }}} */

  /* {{{ should_client_dump_and_get_works_fine() */
  it('should_client_dump_and_get_works_fine', function (done) {
    client.sync('/', function (error) {
      should.ok(!error);
      client.get('/test/key1', function (error, data, meta) {
        should.ok(!error);
        data.should.eql(1234);
        meta.should.eql(1);
        done();
      });
    });
  });
  /* }}} */

  /* {{{ should_client_watch_works_fine() */
  it('should_client_watch_works_fine', function (done) {
    client.watch('/aa', 10, function (error, data) {
      should.ok(!error);
      done();
    });
  });
  /* }}} */

});

after(function () {
  http.close();
  http = null;
});
