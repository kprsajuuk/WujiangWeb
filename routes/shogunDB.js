const { Pool, Client } = require('pg');
const connection = new Pool({
  user: 'cyibztybunzywg',
  host: 'ec2-54-163-230-178.compute-1.amazonaws.com',
  database: 'dcari1a4h2g3ln',
  password: '1607597e15bf0d358ab7089639d28f5667306327dfedb36210cd284824a5cc39',
  port: 5432,
})

exports.getShogun = function(pt, user, ratio, callback) {
  var lv = Math.floor(pt/(1+ratio));
  if (lv > 10) {
    console.log("购买的点数超过10，然而依然当10计算");
    lv = 10;
  }
  console.log("购买的武将等级: " + lv)
  if (lv >= 1){
    connection.query("SELECT 名称 FROM wujiang WHERE 等级 = " + lv, function (error, results, fields) {
      var rows = results.rows
      if (rows && rows.length){
        var r = Math.floor(Math.random() * rows.length);
        if (r == rows.length){
          r -= 1;
        }
        var resultShogun = rows[r];
        
        var shogunNum;
        connection.query("SELECT * FROM player_unit WHERE playerID = '" + user + "'", function (error, results, fields) {
          var rows = results.rows
          if (rows && rows.length){
            var max = 0
            for (var i = 0; i<rows.length; i++){
              if (parseInt(rows[i]["shogunid"]) > max)
                max = parseInt(rows[i]["shogunid"])
            }
            shogunNum = max + 1
          } else {
            shogunNum = 0
          }
          console.log(shogunNum)
          var modSql = "INSERT INTO player_unit(playerID, shogunID, 名称) VALUES ('" + user + "', " + shogunNum + ", '" + resultShogun.名称 + "')";
          connection.query(modSql, function (error, results, fields) {
            if(error) throw error;
          })
          var output = Object.assign(resultShogun,{"shogunID" : shogunNum});
          return callback(null, output);
        })
      }
    });
  } else {
    return callback(null, {"enough":false});
  }
};

exports.sellShogun = function(shoguns, user, ratio, callback) {
  var refound = 0;
  var sum;
  console.log("卖出的武将: " + shoguns)
  connection.query("SELECT 名称 as nameid FROM player_unit WHERE playerID = '" + user + "' AND shogunID = " + shoguns, function (error, results, fields) {
      var rows = results.rows
      if(error) throw error;

      if (rows && rows.length){
        var shogunName = rows[0].nameid;
        connection.query("SELECT 等级 as level FROM wujiang WHERE 名称 = '" + shogunName + "'", function (error, results, fields) {
          var rows = results.rows
          if(error) throw error;
          refound = Math.floor(rows[0].level + (rows[0].level * ratio));
          connection.query("SELECT * FROM player_pt WHERE playerID = '" + user + "'", function (error, results, fields) {
            var rows = results.rows
            if(error) throw error
            sum = rows[0]["points"] + refound;
            console.log("当前金币: " + sum)
            var modSql = "UPDATE player_pt SET points = ($1) WHERE playerID = '" + user + "'";
            var modSqlParams = [sum];

            connection.query(modSql,modSqlParams, function (error, results, fields) {
              if(error) throw error
            })
          })
          

          console.log("卖出得到的金币为: " + refound);
          var modSql = "DELETE FROM player_unit WHERE playerID = '" + user + "' AND shogunID = " + shoguns;
          connection.query(modSql, function (error, results, fields) {
            if(error) throw error
          })
          return callback(null, {"refound":refound});
        });
      }
    })
}

exports.getDetail = function(name, callback) {
  if (name.length != 0){
  connection.query("SELECT * FROM wujiang WHERE 名称 = '" + name + "'", function (error, results, fields) {
    var rows = results.rows
    if (rows && rows.length){
      var result = rows[0];
      return callback(null, result);
     }
    });
  }
}

exports.getTestDetail = function(name, callback) {
  if (name.length != 0){
  connection.query("SELECT * FROM twujiang WHERE 名称 = '" + name + "'", function (error, results, fields) {
    var rows = results.rows
    if (rows && rows.length){
      var result = rows[0];
      return callback(null, result);
     }
    });
  }
}

exports.cleanData = function() {
  connection.query("TRUNCATE TABLE player_unit", function (error, results, fields) {
    if(error) throw error
  })
}

exports.getTestShogun = function(user, callback) {
  connection.query("SELECT 名称 FROM twujiang", function (error, results, fields) {
    var rows = results.rows
    if(error) throw error
    if (rows && rows.length){
      var r = Math.floor(Math.random() * rows.length);
      if (r == rows.length){
        r -= 1;
      }
      var resultShogun = rows[r];
      var shogunNum;

      connection.query("SELECT MAX(shogunID) as maxid FROM player_unit WHERE playerID = '" + user + "'", function (error, results, fields) {
          var rows = results.rows
          if(error) throw error
          shogunNum = rows[0].maxid + 1;

          var output = Object.assign(resultShogun,{"shogunID" : shogunNum});
          return callback(null, output);
        })
    }
  });
}