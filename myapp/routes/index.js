var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const token = req.session.access_token ? req.session.access_token : "not login"
  res.render('index', { title: 'Express',token: token });
});

module.exports = router;
