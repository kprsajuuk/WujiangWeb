var socket = io.connect();
var room = '';
var user;
var watchUserName = '';
var monitor = false;
var order = 0;
var testMod = 0;

$(document).ready(function() {
  loadComplete();
});

$("#chatInputArea").keypress(function(e) {
  if (e.which == 13){
    sendMessage();
  }
});

socket.on('loginSuccess', function(userName) {
  $("#loginMesh").fadeOut("slow");
  user = userName;
  $("#playerName").html(user);
})

socket.on('userExist', function() {
  $("#loginMessage").html("用户名已存在");
})

socket.on('createSuccess', function(data) {
	postInfo("已创建房间: " + data);
})

socket.on('roomNotExist', function() {
  alert("房间不存在");
})

socket.on('battleStart', function(data, user, tmod) {
  $("#testBtn").fadeOut();
  $("#testBtn").attr("disabled", true);
	if ($("#joinPanel").css('display') != 'none' ){
		$("#joinPanel").slideUp("slow");
		$("#startPanel").slideDown("slow");
    postInfo("加入房间: " + data);
	}
	if ($("#showRoom").css('display') != 'none' ){
		$("#showRoom").slideUp("slow");
		$("#startPanel").slideDown("slow");
    postInfo(user + "加入了房间");
	}
    room = data;
    testMod = 0;
    if (tmod == 1){
      testMod = tmod;
    }
})

socket.on('shogunAdd', function(shogun, id, name, tShogun) {
  if (!monitor){
    if(user == name) {
      if (tShogun != 1){
        $("#shogunShow .tleft").append("<div onclick='showDetail(this)' class='shogunName info " + id + "'>" + shogun + "</div>")
      }else {
        $("#shogunShow .tleft").append("<div onclick='showTestDetail(this)' class='testShogun shogunName info " + id + "'>" + shogun + "</div>")
      }
    }else {
      if (tShogun != 1){
        $("#shogunShow .tright").append("<div onclick='showDetail(this)' class='shogunName info " + id + "'>" + shogun + "</div>")
      }else {
        $("#shogunShow .tright").append("<div onclick='showTestDetail(this)' class='testShogun shogunName info " + id + "'>" + shogun + "</div>")
      }
    }
  } else {
    watchUpdate(shogun, id, name, tShogun);
  }
})

socket.on('shogunRemove', function(id, name) {
  if(!monitor) {
    if (user == name) {
      $("#shogunShow .tleft ."+id).remove();
    }else {
      $("#shogunShow .tright ."+id).remove();
    }
  }else {
    if (watchUserName == name) {
      $("#shogunShow .tleft ."+id).remove();
    }else {
      $("#shogunShow .tright ."+id).remove();
    }
  }
})

socket.on('endThisTurn', function() {
  if (!monitor){
    socket.emit("notDone");
    $("#nextRound").slideDown("slow");
    $("#nextRound").removeAttr("disabled");
  }
})

socket.on('startNextTurn', function() {
  if (!monitor){
    $("#roundStart").slideDown("slow");
    $("#roundStart").removeAttr("disabled");
    socket.emit("notDone");
  }
})

socket.on('cleanBegin', function(id, msg) {
  cleanPt(id, msg);
})

socket.on('newMessage', function(name, msg) {
  postMessage(name, msg);
})

socket.on('watchMod', function(r) {
  monitor = true;
  $("#joinPanel").slideUp();
  $("#showTable").slideDown("slow");
  $("#testBtn").attr("disabled", true);
  $("#testBtn").fadeOut();
  $("#shogunDelete").attr("disabled", true);
  $("#shogunDelete").fadeOut();
})

function userLogin(){
  var userName = $('#loginInput').val();
  if (userName.trim().length != 0) {
      socket.emit('login', userName);
  } else {
    $("#loginMessage").html("咋就你那么特殊呢");
  }
}

function createSession() {
	var num=""; 
	for(var i=0;i<6;i++) { 
		num+=Math.floor(Math.random()*10); 
	} 
  $("#roomBtn").attr("disabled", true);
	$("#showRoomID").html(num);
	$("#roomPanel").slideUp("slow");
  $("#showRoom").slideDown("slow");
	socket.emit('createSession', num, testMod);
}

function sessionInput() {
	$("#roomPanel").slideUp("slow");
  $("#joinPanel").slideDown("slow");
}

function joinSessionID() {
  $("#joinBtn").attr("disabled", true);
  setTimeout("$('#joinBtn').removeAttr('disabled')",1000);
	var roomID = $("#roomID").val();
  room = roomID;
  socket.emit('joinSession', roomID, user);
}

function returnMain() {
  $("#joinPanel").slideUp("slow");
  $("#roomPanel").slideDown("slow");
}

function sendMessage() {
  var msg = $("#chatInputArea").val();
  $("#chatInputArea").val("");
  $("#chatInputArea").focus();
  if (msg.length != 0) {
    socket.emit('sendMessage', msg, room)
  }
}

function startRound(){
  $("#roundStart").attr("disabled", true);
  $("#startBtn").attr("disabled", true);
  $("#shogunDelete").removeAttr("disabled");
  $("#roundStart").slideUp("slow");
  var Nmax = 6
  var Nmin = 1
  $.ajax({
      url : "/round/begin?max="+Nmax+"&min="+Nmin+"&user="+user,
      type : 'GET',
      success : function(data) {
      	user = data.user;
        $("#currentPt").html(data.points)
        postInfo("获得了" + data.randNum + "个金币")
      }
  });

  $("#startPanel").slideUp("slow");
  $("#preparePanel").slideUp("slow");
  $("#ptInput").slideDown("slow");
  $("#roundEnd").removeAttr("disabled");
  if (testMod == 1){
    $("#testButton").removeAttr("disabled");
    $("#testButton").fadeIn();
  }
  $("#shogunList #shogunForm .testShogun").remove();
}

function nextTurn() {
  $("#nextRound").attr("disabled", true);
  $("#nextRound").slideUp("slow");
  $("#showTable").slideUp("slow");
  $("#preparePanel").slideDown("slow");
  socket.emit('prepared', room);
  $("#shogunShow .tleft .testShogun").remove();
  $("#shogunShow .tright .testShogun").remove();
}

function usePt() {
  var pt = $("#ptUse").val();
  $("#ptUse").val("");
  if (pt > 0){
  $.ajax({
          url : "/round/use?pt="+pt+"&user="+user,
          type : 'GET',
          success : function(data) {
          	if (data.enough == false){
              $("#alertMsg").slideDown()
              setTimeout("$('#alertMsg').slideUp()",4000);
          	} else {
          		user = data.user
          		$("#currentPt").html(data.diff)
              postInfo("你获得了武将: " + data.名称)
              $("#shogunForm").append("<div class='info'><span onclick='showDetail(this)'>" + data.名称 + 
                                      "</span><input type='radio' name=shogun value=" + data.shogunID + 
                                      " class= " + data.shogunID + "></div>")
              socket.emit('newShogun', data.名称, data.shogunID, room, user, 0);
          	}
          }
      });
    }else {
      alert("请输入大于0的数字");
    }
}

function sellShogun(){
  var sellData = $('#shogunForm').serializeArray();
  if (sellData.length > 0){
    var json2 = {name:"user", value:user};
    var datas = sellData.concat(json2);
    $.ajax({
            url : "/round/sell",
            type : 'POST',
            data : datas,
            success : function(data) {
              for (var i=0; i<datas.length-1; i++){
                $("#shogunForm ."+(datas[i].value)).parent("div").remove();
                socket.emit('removeShogun', datas[i].value, room, user);
              }
              var current = parseInt($("#currentPt").html());
              $("#currentPt").html(current + parseInt(data.refound));
              var ptGet = parseInt(data.refound);
              if (ptGet <= 2){
                postInfo("只卖了" + ptGet + "个金币，Zen~~~~~~的垃圾")
              } else {
                postInfo("卖了" + ptGet + "个金币")
              }
            }
        });
  } else {
    $("#sellAlert").slideDown();
    setTimeout("$('#sellAlert').slideUp()",4000);
  }
}

function cleanAlert() {
  var msg = clearText();
  socket.emit('cleanAll', room, msg);
  $("#cleanBtn").attr("disabled", true);
  setTimeout("$('#cleanBtn').removeAttr('disabled');", 2000);
}

function cleanPt(id, msg) {
  $.ajax({
          url : "/round/clean",
          type : 'GET',
          success : function(data) {
            console.log(data)
            var str = id + msg;
            $("#promptInfo").append("<div class='info clear'>" + str + "</div>");
            var box = document.getElementById("promptInfo");
            box.scrollTop = box.scrollHeight;
          }
      });
  $("#currentPt").html(0)
  $("#shogunForm div").remove();
  $("#shogunShow .tleft .shogunName").remove();
  $("#shogunShow .tright .shogunName").remove();
}

function endTurn(){
  $("#roundEnd").attr("disabled", true);
  $("#shogunDelete").attr("disabled", true);
  $("#ptInput").slideUp("slow");
  $("#showTable").slideDown("slow");
  socket.emit('endTurn', room);
}

function showDetail(name){
  Sname = name.innerHTML;
  $.ajax({
          url : "/round/detail?sName="+Sname,
          type : 'GET',
          success : function(data) {
            detailTable(data);
          }
      });
}

function showTestDetail(name){
  Sname = name.innerHTML;
  $.ajax({
          url : "/round/testdetail?sName="+Sname,
          type : 'GET',
          success : function(data) {
            detailTable(data);
          }
      });
}

function detailTable(data) {
  $("#detailWrapper").fadeIn();
  $("#level").html(data.等级);
  $("#shogunName").html(data.名称);
  $("#attack").html(data.攻);
  $("#defense").html(data.守);
  $("#speed").html(data.速);
  $("#range").html(data.范);
  $("#mana").html(data.魔);
  $("#spell").html(data.技能);
  $("#attribute").html(data.特性);
  $("#aghanim").html(data.神杖加强);
  $("#copyArea").html(data.等级+"&#09;"+data.职业+"&#09;"+data.名称+"&#09;"+data.攻+"&#09;"+data.受+"&#09;"+
                      data.速+"&#09;"+data.范+"&#09;"+data.魔+"&#09;"+data.技能+"&#09;"+data.特性+"&#09;"+
                      data.神杖加强);
}

function hideDetail(){
  $("#detailWrapper").fadeOut();
}

function copyDetail(){
  $("#copyArea").show();
  var detailData = document.getElementById("copyArea");
  detailData.select();
  document.execCommand("Copy");
  $("#copyArea").hide();
}

function postInfo(message){
  $("#promptInfo").append("<div class='info'>" + message + "</div>");
  var box = document.getElementById("promptInfo");
  box.scrollTop = box.scrollHeight;
}

function postMessage(name, msg){
  $("#chatMsg").append("<div><span>" + name + ": </span>" + msg + "</div>")
  var box = document.getElementById("chatMsg");
  box.scrollTop = box.scrollHeight;
}










function activateTest(){
  //testMod = 1;
  //$("#testBtn").attr("disabled", true);
  $("#testBtn p").html("暂时关闭");
}

function getTestShogun(){
  $("#testButton").attr("disabled", true);
  $("#testButton").fadeOut();
  var datas = {name:"user", value:user};
  if (testMod == 1){
    $.ajax({
            url : "/round/testShogun",
            type : 'POST',
            data : datas,
            success : function(data) {
              postInfo("你获得了武将: " + data.名称)
              $("#shogunForm").append("<div class='info testShogun'><span onclick='showTestDetail(this)'>" + data.名称 + 
                                      "</span></div>")
              socket.emit('newShogun', data.名称, data.shogunID, room, user, 1);
            }
        });
  }
}

function watchUpdate(shogun, id, name, tShogun){
  if (watchUserName == ''){
    watchUserName = name;
  }
  if(watchUserName == name) {
    $("#p1").html(name);
      if (tShogun != 1){
        $("#shogunShow .tleft").append("<div onclick='showDetail(this)' class='shogunName info " + id + "'>" + shogun + "</div>")
      }else {
        $("#shogunShow .tleft").append("<div onclick='showTestDetail(this)' class='testShogun shogunName info " + id + "'>" + shogun + "</div>")
      }
    }else {
      $("#p2").html(name);
      if (tShogun != 1){
        $("#shogunShow .tright").append("<div onclick='showDetail(this)' class='shogunName info " + id + "'>" + shogun + "</div>")
      }else {
        $("#shogunShow .tright").append("<div onclick='showTestDetail(this)' class='testShogun shogunName info " + id + "'>" + shogun + "</div>")
      }
    }
}

function showBattleField(){
  if ($("#battleField").css('display') == 'none' ){
    $("#battleRequestBtn").html("收起战场");
    $("#headTitle").slideUp();
  } else {
    $("#battleRequestBtn").html("打嘛，来打嘛");
    $("#headTitle").slideDown();
  }
  $("#battleField").slideToggle("slow");

  $("#battleRequestBtn").attr("disabled", true);
  setTimeout("$('#battleRequestBtn').removeAttr('disabled')",1000);
}

function loadComplete(){
  setTimeout("$('#loadingPage').fadeOut('slow');",1500)
  $('body').css('overflowY', 'scroll');
}

function clearText(){
  i = Math.floor(Math.random() * 21);
  str = "";
  switch(i) {
    case 1:
      str = "居然使用了Clear all,真可恶!";
      break;
    case 2:
      str = "觉得打不过居然Clear all了，Zen~~垃圾";
      break;
    case 3:
      str = "太弱了不得不Clear all";
      break;
    case 4:
      str = "技不如人甘拜下风打出GG单击Clear all了";
      break;
    case 5:
      str = "试图用Clear all掩盖真相，但是真想永远只有一个!";
      break;
    case 6:
      str = "觉得优势很大，A了上去，然后点击了Clear all";
      break;
    case 7:
      str = "把Clear all当成岀售按钮给点了";
      break;
    case 8:
      str = "不想被原谅因此点击了Clear all";
      break;
    case 9:
      str = "试图作弊，但是不小心点到了Clear all";
      break;
    case 10:
      str = "笑容逐渐消失，并点击了Clear all";
      break;
    case 11:
      str = "刀法第一流，光枪扫浮游，李O破立场，Clear all灭自由!";
      break;
    case 12:
      str = "差点儿就赢了，要不是不小心点到Clear all...";
      break;
    case 13:
      str = "觉得一屋不扫何以扫天下，于是点击了Clear all";
      break;
    case 14:
      str = "点击了Clear all，并且同意在下次打dota的时候包鸡包眼";
      break;
    case 15:
      str = "凑不要脸的点了Clear all";
      break;
    case 16:
      str = "想要认输但又不好意思说出来，只能悄悄点一下Clear all";
      break;
    case 17:
      str = "嘴上说着打嘛来打嘛，其实特别怂还偷偷点了Clear all";
      break;
    case 18:
      str = "点击了Clear all，他在失去了所有武将的同时，也失去了梦想";
      break;
    case 19:
      str = "这个Clear all点的真是精髓";
      break;
    case 20:
      str = "很后悔自己点击了Clear all，但是这一切都晚了";
      break;
    default:
      str = "终于点击了Clear all";
  }
  return str;
}