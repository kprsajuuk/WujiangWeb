function dbconnect() {
  var mysql      = require('mysql');
  var data = "fuck some shit";

  var connection = mysql.createConnection({
    host     : 'old.mysql.anvilnode.com',
    user     : 'mc_4930',
    password : '0ca3a5cd9f',
    database : 'mc_4930'
  });
  
  connection.connect();
  
  connection.query('SELECT * FROM `playerBet` WHERE betID = 0', function (error, results, fields) {
    if (error) throw error;
    var firstResult = results[0];
    data += 'player1: ' + firstResult['player1'] + ' player2: ' + firstResult['player2'];
    
  });
  return 2;
};
module.exports = dbconnect;