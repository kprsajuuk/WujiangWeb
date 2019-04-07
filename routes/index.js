var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());

var db = require('./database');
var shogunDB = require('./shogunDB');
var ratio = Math.random() * 2;

router.get('/begin', function(req, res) {
	var max = req.query.max;
	var min = req.query.min;
	var user = req.query.user;
	var r = db.randGen(user, function(err, results) {
		if (err) return console.error(err);
		res.send(results);
	});

})

router.get('/use', function(req, res) {
	var pt = req.query.pt;
	var user = req.query.user;
	var output = {};
	
	console.log("购买汇率:" + ratio);

	db.usePoint(pt,user, ratio, function(err,results) {
		if (err) return console.error(err);
		if (results.enough == false) {
			res.send(results);
		} else {
			output = Object.assign(output,results);
			shogunDB.getShogun(pt, user, ratio, function(err,results) {
				if (err) return console.error(err);
				if (results.enough == false) {
					res.send(results);
				} else {
					output = Object.assign(output,results);
					res.send(output);
					ratio = Math.random() * 2;
				}
			});
		}
	});
})

router.post('/sell', function(req, res) {
	var user = req.body.user;
	var shoguns = req.body.shogun;
	ratio = Math.random() * 2;

	console.log("卖出汇率:" + ratio);

	shogunDB.sellShogun(shoguns, user, ratio, function(err, results) {
		res.send(results);
	});
})

router.post('/testShogun', function(req, res) {
	var user = req.query.user;
	shogunDB.getTestShogun(user, function(err, results) {
		res.send(results);
	});
})

router.get('/detail', function(req, res) {
	var name = req.query.sName;
	shogunDB.getDetail(name, function(err, results) {
		res.send(results);
	})
})

router.get('/testdetail', function(req, res) {
	var name = req.query.sName;
	shogunDB.getTestDetail(name, function(err, results) {
		res.send(results);
	})
})

router.get('/clean', function(req, res) {
	console.log("Clear database")
	shogunDB.cleanData();
	db.cleanData();
	res.send("clean success");
})

module.exports = router;
