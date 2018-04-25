/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
||  Module for websocket connection related stuff.
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

window.ws = {};   // namespace for websocket connection

// WebSocket connection.
ws.port = '27532';                           // default
ws.host = 'localhost';                       // default
ws.url = "ws://" + ws.host + ":" + ws.port + "/";
ws.conn = null;                              // websocket connection variable

ws.open = function() {
   ws.conn = new WebSocket(ws.url); 
   ws.initEventHandlers();
   return 0;
}  // open()

ws.close = function() {
   if (ws.conn != null) {
      ws.conn.close(); 
      ws.conn = null;
   }
   return 0;
}  // close()

ws.send = function(msg) {
   // Establishing a connection is asynchronous and prone to failure.
   // There is no guarantee that calling the send() method immediately after
   // creating a WebSocket object will be successful.
   if (ws.conn != null) {
      ws.conn.send(msg);   // SEND (no need for terminator)
      ws.output('right', msg);
   }
   else {
      ws.output('right', "#Send failed; no connection");     
   }
   return 0;
}  // send()

ws.initEventHandlers = function() {
   // Set event handlers. Called after open connection and qs.conn is set.

   ws.conn.onopen = function() {
      ws.output('left', "#Connection opened for URL " + ws.url);
      updateFooter();
   }  // onopen()
      
   ws.conn.onmessage = function(iEvent) {
      // iEvent.data contains received string.
      dxp.receiveMessage(iEvent.data);
      ws.output('left',  iEvent.data); 
      return 0;
   }  // onmessage()
      
   ws.conn.onclose = function(iEvent) {
      // If an error occurs while attempting to connect, first a simple event with the name "error"
      // is sent to the WebSocket object (thereby invoking its onerror handler).
      // Then the CloseEvent is sent to the WebSocket object (thereby invoking its onclose handler)
      // to indicate the reason for the connection's closing.
      ws.conn = null;
      //console.log("#The connection was closed for reason: ", iEvent.code);
      ws.output('left', "#The connection was closed for reason: " +  iEvent.code);
      updateFooter();
      return 0;
   }  // onclose()

   ws.conn.onerror = function(iEvent) {
      ws.output('left', "#An error occured.");
      console.log('left', "#An error occured. ", iEvent);
      return 0;
   }  // onerror

}  // initEventHandlers

ws.output = function(where, str) {
   var log = document.getElementById("divLogLeft");  // default output
   if (where == 'right') { var log = document.getElementById("divLogRight"); };
   var escaped = str.
     replace(/&/, "&amp;").
     replace(/</, "&lt;").
     replace(/>/, "&gt;").
     replace(/"/, "&quot;");     // "
   log.innerHTML = escaped + "<br>" + log.innerHTML ;
}  // output()


window.dxp = {};   // namespace for damexchange

dxp.parseMessage = function(msg) {
   // Parse incoming DXP message. Returns relevant items depending on mtype.
   var result = {};
   var mtype = msg.slice(0,1);

   switch (mtype) {
      case "C":
         result['type'] = "C";  // CHAT
         result['text'] = msg.slice(1,127);
         break;
      case "R":
         result['type'] = "R";  // GAMEREQ
         result['name'] = msg.slice(3,35).trim();  // initiator
         result['fColor'] = msg.slice(35,36);  // color of follower
         result['gameTime'] = msg.slice(36,40);
         result['numMoves'] = msg.slice(40,44);
         result['posInd'] = msg.slice(44,45);
         if (result['posInd'] != "A") {
            result['mColor'] = msg.slice(45,46);   // color to move for position
            result['pos'] = msg.slice(46,96);
         }
         break;
      case "A":
         result['type'] = "A";  // GAMEACC
         result['engine'] = msg.slice(1,33).trim();  // follower name
         result['accCode'] = msg.slice(33,34);
         break;
      case "M":
         result['type'] = "M";  // MOVE
         result['time'] = msg.slice(1,5);
         result['from'] = msg.slice(5,7);
         result['to'] = msg.slice(7,9);
         result['nCaptured'] = msg.slice(9,11);
         result['captures'] = [];
         for (var i=0; i < parseInt(result['nCaptured']); i++) {
            var s = i * 2;
            result['captures'].push(msg.slice(11+s,13+s));
         }
         break;
      case "E":
         result['type'] = "E";  // GAMEEND
         result['reason'] = msg.slice(1,2);
         result['stop'] = msg.slice(2,3);
         break;
      case "B":
         result['type'] = "B";  // BACKREQ
         result['moveId'] = msg.slice(1,4);
         result['color'] = msg.slice(4,5);
         break;
      case "K":
         result['type'] = "K";  // BACKACC
         result['accCode'] = msg.slice(1,2);
         break;
      default:
         result['type'] = "?";  // UNKNOWN
   }

   return result;
}  // parseMessage()

dxp.receiveMessage = function(msg) {
   var msg = msg.slice(0,127);   // DXP max length
   var dxpData = dxp.parseMessage(msg);

   switch (dxpData["type"]) {
      case "C":  // CHAT
         alert("Chat message: " + dxpData["text"]);
         break;
      case "A":  // GAMEACC
         if (dxpData["accCode"] == "0") {
            game.started = true;
            //game.myColor  as requested
            game.engine = dxpData["engine"];
            game.startingTime = "YYY"   // TODO
            dxp.info("Game request accepted by " + dxpData["engine"]);
         }
         else {
            game.started = false;
            dxp.info("Game request NOT accepted by " + dxpData["engine"] + " Reason: " + dxpData["accCode"]);
         }
         updateFooter();
         break;
      case "E":  // GAMEEND
         //alert("Request end of game received. Reason: " + dxpData["reason"] + " Stop: " + dxpData["stop"]);
         // Confirm game end by sending message back (if not sent by me)
         if (game.started == true) {
            game.started = false;
            game.result = dxpData["reason"];
            var msg = dxp.newMsg_Gameend(dxpData["reason"]);
            ws.send(msg);
            dxp.info("Confirm GAMEEND: " + msg);
            updateFooter();
         }
         break;
      case "M":  // MOVE
         if (game.started == false)  break;   // reject move message
         if (game.color == game.myColor) {
            alert("Player must play. Move message rejected.");
            break;
         }
         var steps = [ dxpData.from, dxpData.to ];
         var nsteps = steps.map(Number);
         var ntakes = dxpData['captures'].map(Number);
         var matchedMoves = game.matchMoves(nsteps.concat(ntakes));
         if (matchedMoves.length == 1) {
            var move = matchedMoves[0];
            game.domove(move);
         }
         else {
            alert("No move found from message. Steps: " + nsteps.toString() + " Takes: " + ntakes.toString());
         }
         break;
      case "B":  // BACKREQ
         // Ask user to confirm request from engine to move back: send message back.
         if (confirm("Confirm back request from engine")) {
            var accCode = "0";   // 0: BACK YES; 1: BACK NO; 2: CONTINUE
            var moveId = parseInt(dxpData["moveId"]);
            var dxpColor = dxpData["color"];
            var color = {W: C.WHITE, Z: C.BLACK}[dxpColor];
            game.backToMove(moveId, color);  // Go back in history
            dxp.info("Back request from engine accepted and done");
         }
         else {
            var accCode = "2";   // 0: BACK YES; 1: BACK NO; 2: CONTINUE
         }
         // Send message back to confirm
         var accCode = "0";   // 0: BACK YES; 1: BACK NO; 2: CONTINUE
         var msg = dxp.newMsg_Backacc(accCode);
         ws.send(msg);
         break;
      case "K":  // BACKACC
         // Received accept message to my request to move back.
         var accCode = dxpData['accCode'];
         switch (accCode) {
            case "0":
               // Actions to go back in history as specified in my request
               if (game.backreq != null) {
                  // Go back in history
                  game.backToMove(game.backreq.moveId, game.backreq.color);
                  game.backreq = null;
                  dxp.info("Engine accepts my back request: move back done");
               }
               else {
                  dxp.info("Received accept message for back request: unknown request");
               }
                  break;
            case "1":
               dxp.info("Received accept message for back request: no support");
               break;
            case "2":
               dxp.info("Received accept message for back request: continue");
               break;
            default:
               dxp.info("Received accept message for back request: unknow code");
         }
         break;
      default:
         alert("Unknown message: " + msg);
   }  // switch

   return 0;
}  // receiveMessage()

dxp.newMsg_Chat = function(str) {
   // Generate CHAT message. Example: CWhat do you think about move 35?
   var msg = "C" + str;
   return msg;
}  // newMsg_Chat()

dxp.newMsg_Gamereq = function(myColor, gameTime, numMoves, pos, colorToMove ) {
   // Generate GAMEREQ message. Example: R01Tornado voor Windows 4.0        W060065A
   var gamereq = [];
   gamereq.push("R");  // header
   gamereq.push("01"); // version

   gamereq.push( C.INITIATOR.rpad(" ", 32) );  // iName: fixed length padding spaces
   gamereq.push(["Z","W"][myColor]);           // fColor: color of follower (server)
   gamereq.push( gameTime.toString().lpad("0", 3) );   // gameTime: time limit of game (ex: 090)
   gamereq.push( numMoves.toString().lpad("0", 3) );   // numMoves: number of moves of time limit (ex: 050)
   if (pos == null && colorToMove == null) {
      gamereq.push("A");   // posInd == A: use starting position
   }
   else {
      gamereq.push("B");   // posInd == B: use parameters pos and colorToMove
      gamereq.push(["W","Z"][colorToMove]);            // mColor
      gamereq.push(dxp.posString(pos, colorToMove));   // board
   }

   var msg = "";
   for (var i=0; i < gamereq.length; i++)  msg = msg + gamereq[i];
   return msg;
}  // newMsg_Gamereq()

dxp.newMsg_Move = function(rmove, timeSpend) {
   // Generate MOVE message. Example: M001205250422122320
   // Parm rmove is a "two-color" move
   move = []
   move.push("M");   // header
   move.push( (timeSpend%10000).toString().lpad("0",4) );   // mTime: 0000 .. 9999
   move.push( (rmove.steps[0]%100).toString().lpad("0",2) ) // mFrom
   move.push( (rmove.steps[rmove.steps.length-1]%100).toString().lpad("0",2) )  // mTo
   move.push( (rmove.takes.length%100).toString().lpad("0",2) )  // mNumCaptured: number of takes (captures)
   for (var i=0; i < rmove.takes.length; i++) {
      move.push( (rmove.takes[i]%100).toString().lpad("0",2) );  // mCaptures
   }

   var msg = "";
   for (var i=0; i < move.length; i++)  msg = msg + move[i];
   return msg;
}  // newMsg_Move

dxp.newMsg_Gameend = function(reason) {
   // Generate GAMEEND message. Example: E00
   var gameend = [];
   gameend.push("E");  // header
   gameend.push(reason.toString());  // reason:  0 > unknown  1 > I lose  2 > draw  3 > I win
   gameend.push("1");                // stop code: 0 > next game preferred  1: > no next game

   var msg = "";
   for (var i=0; i < gameend.length; i++)  msg = msg + gameend[i];
   return msg;
}  // newMsg_Gameend()

dxp.newMsg_Backreq = function(moveId, colorToMove) {
   // Generate BACKREQ message. Example: B005Z
   var backreq = [];
   backreq.push("B");  // header
   backreq.push((moveId%1000).toString().lpad("0",3) );  // moveId
   backreq.push(["W","Z"][colorToMove]);                 // color

   var msg = "";
   for (var i=0; i < backreq.length; i++)  msg = msg + backreq[i];
   return msg;
}  // newMsg_Backreq()

dxp.newMsg_Backacc = function(accCode) {
   // Generate BACKREQ message. Example: K1
   var backacc = [];
   backacc.push("K");
   backacc.push(accCode.toString().slice(0,1));   // accCode

   var msg = "";
   for (var i=0; i < backacc.length; i++)  msg = msg + backacc[i];
   return msg;
}  // newMsg_Backacc()

dxp.posString = function(setup, color) {
   // Parm setup is a game position array.
   var pcode = {'P': 'w', 'K': 'W', 'p': 'z', 'k': 'Z', '.': 'e'};  // dxp spec
   var board = [];
   for (var i=1; i < setup.length-1; i++) {
      board.push(pcode[ setup[i] ]);
   }
   var board_str = board.join("");
   return board_str;
}  // posString()

dxp.info = function(str) {
   var infoElement = document.getElementById("iDxpInfo");
   var escaped = str.
     replace(/&/, "&amp;").
     replace(/</, "&lt;").
     replace(/>/, "&gt;").
     replace(/"/, "&quot;");
   infoElement.value = escaped;
}  // info()

// ====================================================================================

