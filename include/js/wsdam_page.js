/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
||  Module with functions for page interaction.
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

function onOpenClick() {
   // Called by user.
   var host = document.getElementById("iHost").value.trim();
   var port = document.getElementById("iPort").value.trim();
   ws.url = "ws://" + host + ":" + port + "/";
   ws.open();
   return 0;
}  // onOpenClick()
    
function onSendInput() {
   // Called by user.
   var inputElement = document.getElementById("iSendMessage");
   ws.send(inputElement.value);
   inputElement.value = "";
   inputElement.focus();
   return 0;
}  // onSendInput()
    
function onCloseClick() {
   // Called by user.
   ws.close();
   return 0;
}  // onCloseClick()

function onClearClick() {
   // Called by user.
   var log = document.getElementById("divLogLeft");
   log.innerHTML = '';
   var log = document.getElementById("divLogRight");
   log.innerHTML = '';
}  // onClearClick()

function setupFen() {
   // Called by user
   if (game.started == true) {
      game.info("Game already started; setup fen not allowed");
      return 0;
   }
   var fen = document.getElementById("iFenString").value;
   game.initFromFen(fen);
   return 0;
}  // setupFen()

function printFen() {
   // Called by user
   var fen = game.toFEN();
   game.info(fen);
   return 0;
}  // printFen()

function switchTurn() {
   // Called by user. Switch player to move.
   if (game.started == true) {
      game.info("Game already started; switch turn not allowed");
      return 0;
   }
   var newSetup = game.setup;
   var newColor = 1 - game.color;
   game.init(newSetup, newColor);     // Init new position. Clear his.
   return 0;
}  // switchTurn()

function backOneMove() {
   // Called by user. Set position from history one move back.
   if (game.started == true) {
      game.info("Game already started; move back not allowed (try back request)");
      return 0;
   }
   var prev = game.his.pop();
   if (!prev) { game.info("End of history"); return 0; }
   var newSetup = prev.setup;
   var newColor = prev.color;
   game.update(newSetup, newColor);   // Update new position
   return 0;
}  // backOneMove()

function moveToString(iMove) {
   // Convert move to string in user readable format.
   // Parameter iMove is a "two-color" move object.
   var d = (iMove.takes.length == 0) ? "-" : "x";
   var moveString = iMove.steps[0] + d + iMove.steps[iMove.steps.length -1];
   return moveString;
}  // moveToString()


function sendDxpChat() {
   // Called by user.
   if (ws.conn == null) {
      dxp.info("No connection.");
      return 0;
   }
   var txt = document.getElementById("iChat").value;
   txt = txt.trim();
   if (txt == "") return 0;    // empty chat
   var msg = dxp.newMsg_Chat(txt);
   dxp.info("CHAT: " + msg);
   ws.send(msg);
   return 0;
}  // sendDxpChat()

function sendDxpGamereq() {
   // Called by user.
   if (ws.conn == null) {
      dxp.info("No connection.");
      return 0;
   }
   if (game.started == true) {
      dxp.info("Game already started; gamereq not allowed");
      return 0;
   }
   initMovemode();
   var myColor = parseInt(document.getElementById("selMyColor").value);  // 0 or 1
   game.myColor = myColor;     // My color to play against server

   var numMoves = parseInt(document.getElementById("iNumMoves").value);
   var gameTime = parseInt(document.getElementById("iGameTime").value);
   if (isNaN(numMoves) || isNaN(gameTime)) {
      dxp.info("Not a number: numMoves or gameTime. Request cancelled.");
      return 0;
   }

   var msg = dxp.newMsg_Gamereq(myColor, gameTime, numMoves, game.setup, game.color);
   dxp.info("GAMEREQ: " + msg);
   ws.send(msg);
   return 0;
}  // sendDXPGamereq()

function sendDxpMove(move, timeSpend) {
   // Send move message. Parm move is a "two-color" move object.
   // Called to inform the engine if user does a move.
   if (ws.conn == null) {
      dxp.info("No connection.");
      return 0;
   }
   if (game.started == false) {
      alert("Game not started; move not allowed");
      return 0;
   }
   if (game.started == true && game.myColor != game.color) {
      alert("Move not allowed; server has to move");
      return 0;
   }

   var msg = dxp.newMsg_Move(move, timeSpend);
   dxp.info("MOVE: " + msg);
   ws.send(msg);
   return 0;
}  // sendDxpMove()

function sendDxpGameend() {
   // Called by user.
   if (ws.conn == null) {
      dxp.info("No connection.");
      return 0;
   }
   if (game.started == false) {
      dxp.info("Game already finished; gameend not allowed");
      return 0;
   }
   if (game.started == true && game.myColor != game.color) {
      dxp.info("Message gameend not allowed; wait until your turn");
      return 0;
   }

   var reason = document.getElementById("selGameendReason").value;  // dropdown 0,1,2,3
   var msg = dxp.newMsg_Gameend(reason);
   game.started = false;  // stop game
   game.result = reason;
   dxp.info("GAMEEND: " + msg);
   ws.send(msg);
   return 0;
}  // sendDxpGameend()

function sendDxpBackreq() {
   // Called by user.
   if (ws.conn == null) {
      dxp.info("No connection.");
      return 0;
   }
   if (game.started == false) {
      dxp.info("Game not started; backreq not allowed");
      return 0;
   }

   if (game.started == true && game.myColor != game.color) {
      // NOT according to damexchange protocol but necessary
      dxp.info("Message backreq not allowed; wait until your turn");
      return 0;
   }

   var numMovesBack = parseInt(document.getElementById("iNumMovesBack").value);
   if (isNaN(numMovesBack)) {
      dxp.info("Not a number: numMovesBack. Back request cancelled.");
      return 0;
   }

   if (numMovesBack > game.his.length || numMovesBack <= 0) {
      dxp.info("No history for this back request; cancelled");
      return 0;
   }

   // Convert numMovesBack to pair (moveId, colorBack)
   var lastIndex = game.his.length-1;
   var backItem = game.his[lastIndex-numMovesBack+1];  // last item of his is prev position
   var moveId = backItem.moveId;
   var colorBack = backItem.color;
   game.backreq = {moveId: moveId, color: colorBack};  // store to actually move back later

   // Wait for confirmation by the engine to actually move back
   var msg = dxp.newMsg_Backreq(moveId, colorBack);
   dxp.info("BACKREQ: " + msg);
   ws.send(msg);
   return 0;
}  // sendDxpBackreq()

function updateFooter() {
   // Called if footer text changes.
   if (game.started == true) 
      if (game.color == game.myColor) var player = "You";
      else  var player = "Engine";
   else var player = "You";

   var txt = {};
   txt.engine =  game.engine == "" ? "Engine: -" : "Engine: " + game.engine.slice(0,24);
   txt.connected = ws.conn == null ? "No connection" : "Connected";
   txt.gamestatus = game.started == true ? "Game started" : "No game";
   txt.turn =  game.color == C.WHITE ? "Turn: " + player + " (white)" :  "Turn: " + player + " (black)" ;
   var footer = "";
   footer += "<span>" + txt.engine + "</span>";
   footer += "<span>" + txt.connected + "</span>";
   footer += "<span>" + txt.gamestatus + "</span>";
   footer += "<span>" + txt.turn + "</span>";
   document.getElementById("div_content5").innerHTML = footer;

   return 0;
}  // updateFooter()

function initPieceIcons() {
   // Called at start after init game. Init select box of pieces for setup.
   if (game.setupmode == true)  initSetupmode();
   else initMovemode();

   window.pieceSelector = 'w';   // values [b, B, w, W, 0]
   switch(window.pieceSelector) {
     case 'b':
       document.getElementById("div_pieceIcon_bm").className = "pieceIcons  active";
       break;   
     case 'B':
       document.getElementById("div_pieceIcon_bk").className = "pieceIcons   active";
       break;   
     case 'w':
       document.getElementById("div_pieceIcon_wm").className = "pieceIcons   active";
       break;   
     case 'W':
       document.getElementById("div_pieceIcon_wk").className = "pieceIcons   active";
       break;   
   }
   return 0;
}  // initPieceIcons()

function selectPieceIcon(iElement, iPiece) {
   // Called by clicking piece in select box. Makes piece active for setup on mouse click.
   // iPiece: one of [b,B,w,W,0]
   window.pieceSelector = iPiece;
   document.getElementById("div_pieceIcon_bm").className = 'pieceIcons';
   document.getElementById("div_pieceIcon_bk").className = 'pieceIcons';
   document.getElementById("div_pieceIcon_wm").className = 'pieceIcons';
   document.getElementById("div_pieceIcon_wk").className = 'pieceIcons';
   document.getElementById("div_pieceIcon_cl").className = 'pieceIcons';
   iElement.className = "pieceIcons   active";   // current onclick element; css will treat it
   return 0;
}  // selectPieceIcon()

function switchSetupmode() {
   // Called by button
   if (game.started == true) {
      game.info("Game started. Toggle setup mode not allowed.");
      return 0;
   }
   var newSetupmode = !game.setupmode;  // switch mode
   if (newSetupmode == true) initSetupmode();
   else initMovemode();
   return 0;
}  // switchSetupmode()

function initSetupmode() {
   // Init setupmode to setup pieces by mouse clicking.
   game.setupmode = true;
   game.clicks = {};
   game.his = [];
   game.stopwatch.stop();
   game.xprint();
   document.getElementById("divPieceSelection").style.display = "inline";
   return 0;
}  // initSetupmode()

function initMovemode() {
   // Init movemode to move pieces by mouse clicking.
   game.setupmode = false;
   game.clicks = {};
   game.his = [];
   game.stopwatch.start();
   game.xprint();
   document.getElementById("divPieceSelection").style.display = "none";  // hide
   return 0;
}  // initMovemode()

function unhide(elementID) {
   // Hide/unhide element with given id.
   var item = document.getElementById(elementID);
   if (item) {
      item.className=(item.className=='isHidden') ? 'isVisible' : 'isHidden';
   }
   return 0;
}  // unhide()

// ================================================================================================






