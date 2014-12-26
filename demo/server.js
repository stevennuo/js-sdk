var qiniu = require('qiniu');
var express = require('express');
var config = require('./config.js');
var app = express();

app.configure(function() {
    app.use(express.static(__dirname + '/'));
});


app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(express.urlencoded());

// 可以不看
//
//app.post('/downtoken', function(req, res) {
//
//    var key = req.body.key,
//        domain = req.body.domain;
//
//    //trim 'http://'
//    if (domain.indexOf('http://') != -1) {
//        domain = domain.substr(7);
//    }
//    //trim 'https://'
//    if (domain.indexOf('https://') != -1) {
//        domain = domain.substr(8);
//    }
//    //trim '/' if the domain's last char is '/'
//    if (domain.lastIndexOf('/') === domain.length - 1) {
//        domain = domain.substr(0, domain.length - 1);
//    }
//
//    var baseUrl = qiniu.rs.makeBaseUrl(domain, key);
//    var deadline = 3600 + Math.floor(Date.now() / 1000);
//
//    baseUrl += '?e=' + deadline;
//    var signature = qiniu.util.hmacSha1(baseUrl, config.SECRET_KEY);
//    var encodedSign = qiniu.util.base64ToUrlSafe(signature);
//    var downloadToken = config.ACCESS_KEY + ':' + encodedSign;
//
//    if (downloadToken) {
//        res.json({
//            downtoken: downloadToken,
//            url: baseUrl + '&token=' + downloadToken
//        })
//    }
//});

app.get('/', function(req, res) {
    res.render('index.html', {
        // 我们是镜像文件夹，在请求文件的时候传过去太复杂也没必要，可以前端写死，同时后端做安全验证
        domain: '',//config.Domain,
        uptoken_url: ''//config.Uptoken_Url
    });
});

// TODO：以下均需要在matrix后端实现
qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY;

app.get('/qiniu/token', function(req, res, next) {
    // TODO：权限管理，
    // 只有coursebuilder角色才可以

    // TODO:生成新的key(ObjectId)，改为PutPolicy(config.Bucket_Name + ':' + ObjectId.valueOf())
    var uptoken = new qiniu.rs.PutPolicy(config.Bucket_Name);
    var token = uptoken.token();
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (token) {
        res.json({
            uptoken: token
        });
    }
});
app.delete('/qiniu/key/:key', function(req, res, next) {
    // 由于policy均在后台，删除操作均由后端操作

    // TODO：权限管理，
    // 只有coursebuilder角色才可以

    var client = new qiniu.rs.Client();
    client.remove(config.Bucket_Name, req.param('key'), function(err, ret) {
        if (!err) {
            res.json(200);
        } else {
            res.json(500, err);
        }
    })
});

app.listen(config.Port, function() {
    console.log('Listening on port %d', config.Port);
});
