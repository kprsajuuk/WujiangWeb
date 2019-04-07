const { Pool, Client } = require('pg');
const connection = new Pool({
  user: 'cyibztybunzywg',
  host: 'ec2-54-163-230-178.compute-1.amazonaws.com',
  database: 'dcari1a4h2g3ln',
  password: '1607597e15bf0d358ab7089639d28f5667306327dfedb36210cd284824a5cc39',
  port: 5432,
})

exports.randGen = function(user, callback) {

  var rand = Math.floor(Math.random() * 10) + 1//This formula will not work for large number generation
  connection.query("SELECT * FROM player_pt WHERE playerID = '" + user + "'", function (error, results, fields) {
    var result;
    var rows = results.rows
    if(error) throw error

    if (rows && rows.length){
      var modSql = "UPDATE player_pt SET points = ($1) WHERE playerID = '" + user + "'";
      var newPt = rows[0]["points"] + rand;
      var modSqlParams = [newPt];
      result = {"randNum":rand, "points":newPt,"user":user};
    } else{
      var modSql = "INSERT INTO player_pt(playerID, points) VALUES ('" + user + "', " + rand + ")";
      var modSqlParams = "";
      result = {"randNum":rand, "points":rand,"user":user};
    }

    connection.query(modSql,modSqlParams,function (err, result) {
       if(err){
             console.log('[UPDATE ERROR in randGen] - ',err.message);
             return;
       }        
    });
    console.log("当前金币:" + result.points)
    return callback(null, result);

  });

};

exports.usePoint = function(pt, user, ratio, callback) {
  var lv = Math.floor(pt/(1+ratio));
  var diff;
  if (lv >= 1){
    connection.query("SELECT * FROM player_pt WHERE playerID = '" + user + "'", function (error, results, fields) {
      if(error) throw error
      var result;
      var rows = results.rows
      
      if (rows && rows.length){
        diff = rows[0]["points"] - pt;
        if (diff >= 0){
          var modSql = "UPDATE player_pt SET points = ($1) WHERE playerID = '" + user + "'";
          var modSqlParams = [diff];
          result = {"diff":diff,"user":user};
          connection.query(modSql,modSqlParams,function (err, result) {
             if(err){
                   console.log('[UPDATE ERROR in usePoint] - ',err.message);
                   return;
             }        
          });
        } else {
          return callback(null, {"enough":false});
        }
        return callback(null, result);
      } else {
        console.log("database.js未能获取玩家信息")
        return callback(null, {"enough":false});
      }
    });
  }
};

exports.cleanData = function() {
  connection.query("TRUNCATE TABLE player_pt", function (error, results, fields) {
    if(error) throw error
  })
}
