/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
||  Main module.
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

function isLowerCase(str) {
   return str == str.toLowerCase() && str != str.toUpperCase();
}

function isUpperCase(str) {
   return str == str.toUpperCase() && str != str.toLowerCase();
}

function swapCase(char) {
   // Swap to upper or lower char.
   res = isLowerCase(char) ? char.toUpperCase() : char.toLowerCase()
   return res;
}  // swapCase()

String.prototype.lpad = function(padString, length) {
   // pads left
   var str = this.slice(0,length);
   while (str.length < length)
      str = padString + str;
   return str;
}  // lpad
 
String.prototype.rpad = function(padString, length) {
   // pads right
   var str = this.slice(0,length);
   while (str.length < length)
      str = str + padString;
   return str;
}  // rpad()

function numberToRowCol(m) {
   // Convert square number to row/column values depending on board dimension.
   // Numbering and row/col of board from top-left to bottom-right.
   if (C.BOARD_DIM == 8) {  // 8x8 board
      var col = ( (m-1) % 4 ) * 2  + ( ( Math.floor((m-1) / 4) ) + 1) % 2;
      var row = Math.floor( (m-1) / 4 );
   }
   else if (C.BOARD_DIM == 10) {     // 10x10 board
      var col = ( (m-1) % 5 ) * 2  + ( ( Math.floor((m-1) / 5) ) + 1) % 2;
      var row = Math.floor( (m-1) / 5 );
   }
   else if (C.BOARD_DIM == 12) {     // 12x12 board
      var col = ( (m-1) % 6 ) * 2  + ( ( Math.floor((m-1) / 6) ) + 1) % 2;
      var row = Math.floor( (m-1) / 6 );
   }
   else {
      var col = row = 0;  // unknown dim
   }
   return {row: row, col: col};
}  // numberToRowCol()

function rowcolToNumber(row, col) {
   // Converts row/col values to the square number depending on board dimension.
   // Numbering and row/col of board from top-left to bottom-right.
   if (C.BOARD_DIM == 8) {           // 8x8 board
      var m = (row * 4) + Math.ceil( (col + 1) / 2 );
   }
   else if (C.BOARD_DIM == 10) {     // 10x10 board
      var m = (row * 5) + Math.ceil( (col + 1) / 2 );
   }
   else if (C.BOARD_DIM == 12) {     // 12x12 board
      var m = (row * 6) + Math.ceil( (col + 1) / 2 );
   }
   else {
      var m = 0; // unknown dim
   }
   return m;
} // rowcolToNumber()


function arraysEqual(a1,a2, doSort) {
   // If sorted: equality as sets. Not sorted: equality as arrays.
   // Default doSort: true.
   // WARNING: arrays must NOT contain {objects} or behavior may be undefined.
   if (doSort) {
      a1_sorted = a1.slice(0).sort();  // clone and sort
      a2_sorted = a2.slice(0).sort();  // clone and sort
      return JSON.stringify(a1_sorted) == JSON.stringify(a2_sorted);
   }
   return JSON.stringify(a1) == JSON.stringify(a2);
}  // arraysEqual

function isSuperset(arr1, arr2) {
   // Returns true if the elements of array arr1 is a superset of arr2.
   // Example 1: [1, 'a', 2, 'b', 3]  is superset of [1, 2, 3]
   // Example 2: ['a', 2, 'b', 3] is NOT superset of [1, 2, 3]
   var bool = arr2.every(function (val) { return arr1.indexOf(val) >= 0; });
   return bool;
}  // isSuperset

window.StopWatch = function() {
   this.startMilliSec = 0;
   this.elapsedMilliSec = 0;
   this.start = function() {
      this.startMilliSec = new Date().getTime();
   }
   this.stop = function() {
      this.elapsedMilliSec = new Date().getTime() - this.startMilliSec;
   }
   return this;
}  // StopWatch()

window.CanvasHandler = function() {
   this.canvas = document.getElementById('myCanvas'); 
   this.canvas.width = C.CANVAS_SIZE.w;
   this.canvas.height = C.CANVAS_SIZE.h;

   this.ctx = this.canvas.getContext('2d'); 
   var this2 = this;  // Increase scope of this

   // === METHODS ===
   this.initEventListener = function() {
      // Init by pages who needs mouseclick-events on a square of the canvas board.
      function getX(evt) {
         return evt.offsetX ? evt.offsetX : evt.layerX;
      }  // getX

      function getY(evt) {
         return evt.offsetY ? evt.offsetY : evt.layerY;
      }  // getY

      function onMousedown(evt) {
         // Executes function 'onSquareClick' with argument square position.
         // Square position is (row,col) object.
         // Does nothing if no square selected.
         var button = {left: 0, middle: 1, right: 2};
         if (evt.button === button.right) { return null; }    // skip right mouse click
         if (evt.button === button.middle) { return null; }   // skip middle mouse click

         var mousePos = {x: getX(evt), y: getY(evt)};
         if (mousePos == null) { return null; }   // No data

         var bx = C.BOARD_RECT.x;
         var by = C.BOARD_RECT.y;
         var origin = { x: bx, y: by };         // origin of board

         var col = Math.floor( (mousePos.x - origin.x) / C.SQUARESIZE );  // 0..9
         var row = Math.floor( (mousePos.y - origin.y) / C.SQUARESIZE );  // 0..9
         if ((col < 0) || (col > (C.BOARD_DIM - 1) )) return null;
         if ((row < 0) || (row > (C.BOARD_DIM - 1) )) return null;

         if (isEven(row + col) == true) return null;     // remove for chess
         var pos = {row: row, col: col};   // coordinates of clicked square

         // Process 'mousedown' on a square; give mouse-position and which keys are pressed.
         if (typeof game.onSquareClick === 'function') { game.onSquareClick(pos, keysPressed); }
         return 0;
      }  // onMousedown

      var isEven = function(someNumber) { return (someNumber%2 == 0) ? true : false; };

      var keysPressed = {};   // remember which keys are pressed
      document.addEventListener('keydown', function(e) { keysPressed[e.keyCode] = true; }, false);
      document.addEventListener('keyup', function(e) { keysPressed[e.keyCode] = false;  }, false);
      this.canvas.addEventListener('mousedown', onMousedown, false);
      return 0;
   }  // initEventListener

   return this;
}  // CanvasHandler()

window.Game = function() {
   // Game logic. "Two-Color" Logic (moves and position).

   this.color = C.WHITE;        // Current color to move (turn).
   this.setup = C.SETUP_START;  // Current position. Array of char (p P k K .). Length 52.
   this.clicks = {};            // Store square clicks
   this.his = [];               // Store history: last item is previous position
   this.started = false;
   this.myColor = C.WHITE;  // Color of player where opponent is server.
   this.engine = "";        // Name of engine
   this.stopwatch = new StopWatch();  // To measure thinking time of a move
   this.stopwatch.start();
   this.setupmode = false;  // If true, manual setup by mouse clicks

   // === METHODS ===
   this.init = function(iSetup, iColor) {
      // Parameter iSetup has two appearances: list of char or string of char.
      // The string can differ in that it has also spaces to visualize the board.
      this.color = iColor;  // 0,1
      // If needed convert iSetup to array.
      if (iSetup.length == 52) {
         // No spaces in setup (string, maybe list)
         this.setup = Array.from(iSetup);  // make clone
      }
      else {
         // Remove spaces from setup (string, maybe list)
         var setup = Array.from(iSetup);  // make clone
         this.setup = setup.filter(function(item) { return item !== " " }); // Filter spaces.
      }
      this.clicks = {};
      this.his = [];
      this.stopwatch.start();
      this.xprint();
      updateFooter();
      return 0;
   }  // init()

   this.update = function(iSetup, iColor) {
      // Updates game setup and color. History unchanged.
      this.setup = iSetup;
      this.color = iColor;
      this.clicks = {};
      this.stopwatch.start();  // start count for next move
      this.xprint();
      updateFooter();
      return 0;
   }  // update()

   this.initFromFen = function(iFen) {
      // Set position with given fen string.
      var rlist = this.parseFEN(iFen);
      var sideToMove = rlist[0];

      // prepare output
      var pcode = {'w': 'P', 'W': 'K', 'b': 'p', 'B': 'k', '0': '.'};
      var board = ["0"];
      for (var i=1; i < rlist.length; i++) {
         board.push(pcode[ rlist[i] ]);
      }
      board.push("0");

      ///this.color = (sideToMove == "W") ? C.WHITE : C.BLACK; // alternatively
      var color = {W: C.WHITE, B: C.BLACK}[sideToMove];
      this.init(board, color);
      return 0;
   }  // initFromFen()

   this.newPosition = function() {
      // Get "one-color" position object of current position.
      if (this.color == C.WHITE) { 
         var pos = new Position(this.setup);
      }
      else {
         var rotSetup = this.setup.map(swapCase).reverse();  // clone
         var pos = new Position( rotSetup );
      }
      return pos;
   }  // newPosition()

   this.toFEN = function() {
      // Returns FEN string of current setup with colorToMove indication.
      var sideToMove = ['W', 'B'][this.color];
      var whitePieces = "";
      var first = true;
      for (var num=1; num < 51; num++) {
          var pieceCode = this.setup[num];
          if (pieceCode == 'P' && first == false)  whitePieces += ",";
          if (pieceCode == 'K' && first == false)  whitePieces += ",";
          if (pieceCode == 'P') { whitePieces += num.toString(); first = false; }
          if (pieceCode == 'K') { whitePieces += 'K' + num.toString(); first = false; }
      }
      var blackPieces = "";
      var first = true;
      for (var num=1; num < 51; num++) {
          var pieceCode = this.setup[num];
          if (pieceCode == 'p' && first == false)  blackPieces += ",";
          if (pieceCode == 'k' && first == false)  blackPieces += ",";
          if (pieceCode == 'p') { blackPieces += num.toString(); first = false; }
          if (pieceCode == 'k') { blackPieces += 'K' + num.toString(); first = false; }
      }
      var fenString = sideToMove + ":W" + whitePieces + ":B" + blackPieces + ".";
      return fenString;
   }  // toFEN()

   this.onSquareClick = function(mousePos, keysPressed) {
      // Called by mousedown on the canvas. Executes only if dark square selected.
      // Argument 'mousePos' is selected row/col
      if (game.setupmode == true)   this.tryToSetup(mousePos);
      else  this.tryToMove(mousePos);
      return 0;
   }  // onSquareClick()

   this.tryToMove = function(mousePos) {
      // Called by onSquareClick. Executes only if setupmode is false (movemode).
      // Argument 'mousePos' is selected row/col

      if (this.started == true && this.color != this.myColor) {
         alert("Wait for move from server.");
         return 0;
      }

      if (!this.clicks[mousePos.row])   this.clicks[mousePos.row] = {};  // init row
      if (this.clicks[mousePos.row][mousePos.col]) {
         // remove property if already present
         delete this.clicks[mousePos.row][mousePos.col];
      }
      else {
         // store property
         this.clicks[mousePos.row][mousePos.col] = true;
      }
      this.xprint();  // color clicked squares

      //this.testClicks();
      // Try to match a move with clicked squares.
      var numbers = this.clickedNumbers();
      var matchedMoves = this.matchMoves(numbers);

      //console.log("matchedMoves: ");
      //for (j in matchedMoves) {
      //    console.log("       " + matchedMoves[j].steps + " " + matchedMoves[j].takes);
      //}

      if (matchedMoves.length == 0) {
         var player = ["white","black"][this.color];
         alert("No move found: " + player + " must play.");
         this.clicks = {};
         return 0;
      }

      if (matchedMoves.length > 1) return 0;  // do nothing

      if (matchedMoves.length == 1) {
         // move if unique match found
         var move = matchedMoves[0];
         this.domove(move);
      }

      return 0;
   }  // tryToMove()

   this.tryToSetup = function(mousePos) {
      // Called by onSquareClick. Executes only if setupmode is true.
      // Argument 'mousePos' is selected row/col
      var number = rowcolToNumber(mousePos.row, mousePos.col);
      var pcode = {'w': 'P', 'W': 'K', 'b': 'p', 'B': 'k', '0': '.'};
      this.setup[number] = pcode[window.pieceSelector];
      this.xprint();
      return 0;
   }  // tryToSetup()

   this.clickedNumbers = function() {
      // Convert clicked row/col to square numbers.
      var numbers = [];      // clicked numbers
      for (var row in this.clicks) {
         for (var col in this.clicks[row]) {
            var nrow = parseInt(row);
            var ncol = parseInt(col);
            var number = rowcolToNumber(nrow, ncol);
            numbers.push(number);
         }
      }
      return numbers;
   }  // clickedNumbers()

   this.testClicks = function() {
      // retrieve clicks and report
      var str = "";
      for (var row in this.clicks) {
         for (var col in this.clicks[row]) {
            str += "[" + row + "," + col + "] ";
         }
      }
      console.log("CLICKS: " + str);
      return 0;
   }  // testClicks()

   this.legalMoves = function() {
      // Returns  "two-color" legal moves of position.
      var pos = this.newPosition();      // current "one-color" position
      var legalMoves = pos.legalMoves(); // "one-color" legal moves
      if (this.color == C.WHITE)  return legalMoves;

      // For C.BLACK: convert "one-color" moves to "two-color" moves
      var legalMoves2 = [];
      for (var i=0; i < legalMoves.length; i++) {
         var move = legalMoves[i];
         var steps2 = move.steps.map( function(el) { return (51-parseInt(el)) } );
         var takes2 = move.takes.map( function(el) { return (51-parseInt(el)) } );
         var move2 = new Move( {steps: steps2, takes: takes2} );
         legalMoves2.push(move2);
      }
      return legalMoves2;
   }  // legalMoves()

   this.matchMoves = function(iNumbers) {
      // iNumbers: "two-color" square numbers
      // Returns "two-color" moves which matches the given square numbers.
      var pos = this.newPosition();  // current "one-color" position

      var numbers = [];  // "one-color" square numbers
      for (var i=0; i < iNumbers.length; i++) {
         if (this.color == C.WHITE) numbers.push(iNumbers[i]);
         else numbers.push(51 - iNumbers[i]);
      }

      var matchedMoves = pos.matchMoves(numbers);  // "one-color" match moves
      if (this.color == C.WHITE)  return matchedMoves;

      // For C.BLACK: convert "one-color" moves to "two-color" moves
      var matchedMoves2 = [];
      for (var i=0; i < matchedMoves.length; i++) {
         var move = matchedMoves[i];
         var steps2 = move.steps.map( function(el) { return (51-parseInt(el)) } );
         var takes2 = move.takes.map( function(el) { return (51-parseInt(el)) } );
         var move2 = new Move( {steps: steps2, takes: takes2} );
         matchedMoves2.push(move2);
      }
      return matchedMoves2;
   }  // matchMoves()

   this.domove = function(iMove) {
      // "Two-color" counterpart of pos.domove; parameter iMove is a "two-color" move.
      // Called by user or used to move the engine.
      var pos = this.newPosition();  // current "one-color" position

      // Convert move to "one-color"  version
      if (this.color == C.WHITE) {
         var move = iMove;
      }
      else {
         var steps = iMove.steps.map( function(el) { return (51-parseInt(el)) } );
         var takes = iMove.takes.map( function(el) { return (51-parseInt(el)) } );
         var move = new Move( {steps: steps, takes: takes} );
      }

      var newpos = pos.domove(move);


      this.info("Last move: " + moveToString(iMove) );

      // add old position to history
      this.addHis(this.color, this.setup);

      this.stopwatch.stop();
      var timeSpend = Math.round(this.stopwatch.elapsedMilliSec/1000);  // seconds
      //console.log("Time spend sec: " + timeSpend);

      if (this.started == true && this.color == this.myColor) {
         sendDxpMove(iMove, timeSpend);
      }

      // Update new position
      if (this.color == C.WHITE)  var newSetup = newpos.setup;
      else  var newSetup = newpos.setup.map(swapCase).reverse();
      var newColor = 1 - this.color;   // switch to other color
      this.update(newSetup, newColor);
      return 0;
   }  // domove()

   this.backToMove = function(moveId, color) {
      // Set position from history back to given moveId (number) and color.
      var found = false;
      for (var idx=0; idx < this.his.length; idx++) {
         if (this.his[idx].moveId == moveId && this.his[idx].color == color) {
            found = true;
            break;
         }
      }
      //console.log("backToMove: ", moveId, color );
      if (!found) return 0;   // Cannot move back
      var newSetup = this.his[idx].setup;
      var newColor = this.his[idx].color;
      this.update(newSetup, newColor);     // Update new position
      this.his = this.his.slice(0, idx);   // Remove history from idx..end
      return 0;
   }  // backToMove()

   this.addHis = function(iColor, iSetup) {
      if (this.his.length == 0) {
         var nextMoveId = 1;
      }
      else {
         var last = this.his[this.his.length-1];
         if (last.color == C.WHITE) var nextMoveId = last.moveId;
         else  var nextMoveId = last.moveId + 1;
      }
      this.his.push({moveId: nextMoveId, color: iColor, setup: iSetup});
      return 0;
   }  // addHis()

   this.parseFEN = function(iFen) {
      // Parses a string in Forsyth-Edwards Notation into a Position
      var fen = iFen;                   // working copy
      fen = fen.replace(/\s+/, "");     // remove all spaces
      fen = fen.split(".")[0];          // cut off info (.xxx) at the end
      if (fen == "") fen = "W:B:W";     // empty FEN Position
      if (fen == "W::") fen = "W:B:W";
      if (fen == "B::") fen = "B:B:W";
      if (/^.::$/.test(fen)) fen = "W:B:W";
      var parts = fen.split(":");

      var rlist = Array(52).join("0").split("");  // init temp return list 0..50
      var sideToMove = (parts[0][0] == "B") ? "B" : "W";
      rlist[0] = sideToMove;

      for (i in { 1:0, 2:0 } ) { 
         // process the two sides
         var side = parts[i];
         var color = side[0];
         side = side.substring(1);  // strip color char
         if (side.length == 0) continue;

         var numSquares = side.split(",")   // list of numbers or range of numbers with/without king flag
         for (var i=0; i < numSquares.length; i++) {
            var num = numSquares[i];
            var isKing = (num[0] == "K") ? true : false;
            num = isKing ? num.substring(1) : num;    // strip 'K'
            var range = num.split("-");
            switch (range.length) {
               case 1:  // no range
                  rlist[parseInt(num)] = isKing ? color.toUpperCase() : color.toLowerCase();
                  break;
               case 2:  // range n-m
                  var from = parseInt(range[0]);
                  var to = parseInt(range[1]);
                  for (var j=from; j < (to + 1); j++ ) {
                     rlist[j] = isKing ? color.toUpperCase() : color.toLowerCase();
                  }
                  break;
               default:
                  continue;  // error; do nothing
            }
         }  // for num
      }  // for sides
      return rlist;
   }  // parseFEN()

   this.info = function(str) {
      var infoElement = document.getElementById("iPlayInfo");
      var escaped = str.
        replace(/&/, "&amp;").
        replace(/</, "&lt;").
        replace(/>/, "&gt;").
        replace(/"/, "&quot;");
      infoElement.value = escaped;
   }  // info()

   this.xprint = function() {
      //var canvas = document.getElementById('myCanvas'); 
      //var ctx = canvas.getContext('2d'); 
      var canvas = window.myCanvas.canvas;
      var ctx = window.myCanvas.ctx;

      var bw = C.BOARD_RECT.w;
      var bh = C.BOARD_RECT.h;
      var bx = C.BOARD_RECT.x;
      var by = C.BOARD_RECT.y;

      ctx.save();   // =====================================

      // Background color canvas
      ctx.fillStyle = C.BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw light squares as one rect
      ctx.fillStyle = C.SQR_COLORLIGHT;
      ctx.fillRect(bx, by, bw, bh);

      // Draw dark squares
      for (var row = 0; row < 10; row++) {
         for (var col = 0; col < 10; col++) {
            if ((row + col) % 2 != 0) {
               var dx = bx + col * C.SQUARESIZE;
               var dy = by + row * C.SQUARESIZE;
               if (this.clicks[row]) {
                  ctx.fillStyle = this.clicks[row][col] ? "red" : C.SQR_COLORDARK; 
               }
               else {
                  ctx.fillStyle = C.SQR_COLORDARK; 
               }
               ctx.fillRect(dx, dy, C.SQUARESIZE, C.SQUARESIZE);
            }
         }
      }

      // Setup pieces
      for (var i = 1; i < this.setup.length; i++) {
         var piececode = this.setup[i];
         if (piececode != '0' && piececode != '.') {
            var piece = {number: i, code: piececode};
            this.drawPiece(ctx, piece);
         }
      }

      // Draw setup mode indication
      if (this.setupmode == true) {
         ctx.fillStyle = "red";
         ctx.globalAlpha = 0.2;   // 0.0 .. 1.0    (from transparent to opaque)
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.globalAlpha = 1.0;
      }

      ctx.restore();   // =====================================
      return 0;
   }  // xprint

   this.drawPiece = function(ctx, piece) {
      var origin = {x: C.BOARD_RECT.x, y: C.BOARD_RECT.y};
      var loc = numberToRowCol(piece.number);       
      var dx = origin.x + (loc.col * C.SQUARESIZE);
      var dy = origin.y + (loc.row * C.SQUARESIZE);
      var dw = C.SQUARESIZE; 
      var dh = C.SQUARESIZE;
      var sx = C.VIEWS[piece.code].sx;
      var sy = C.VIEWS[piece.code].sy;
      var sw = C.VIEWS[piece.code].sw;
      var sh = C.VIEWS[piece.code].sh;
      ctx.drawImage(C.PIECE_IMAGE, sx, sy, sw, sh, dx, dy, dw, dh);
      return 0;
   }  // drawPiece

   return this; // =================
}  // Game()

// ====================================================================================

