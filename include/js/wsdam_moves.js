/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
|| Move logic for Draughts 100 International Rules
|| Remember:
|| - The internal respresentation of our board is a list (array) of 52 char
|| - Moves are always calculated for white (uppercase letters) at high numbers!!
|| - If black is to move, black and white are swapped and the board is rotated.
|| 
|| New ES6 features can be used (not for older browsers so we did not use them):
|| - array.includes()
|| - generator function, yield statement, for..of
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

window.mv = {};   // namespace for move logic

// Directions: external representation; table gives for each square the next square depending on direction
mv.NE_ext = 
"0 \
       00  00  00  00  00   \
     01  02  03  04  05     \
       07  08  09  10  00   \
     11  12  13  14  15     \
       17  18  19  20  00   \
     21  22  23  24  25     \
       27  28  29  30  00   \
     31  32  33  34  35     \
       37  38  39  40  00   \
     41  42  43  44  45     \
0" // =======================

mv.NW_ext = 
"0 \
       00  00  00  00  00   \
     00  01  02  03  04     \
       06  07  08  09  10   \
     00  11  12  13  14     \
       16  17  18  19  20   \
     00  21  22  23  24     \
       26  27  28  29  30   \
     00  31  32  33  34     \
       36  37  38  39  40   \
     00  41  42  43  44     \
0" // =======================

mv.SE_ext = 
"0 \
       07  08  09  10  00   \
     11  12  13  14  15     \
       17  18  19  20  00   \
     21  22  23  24  25     \
       27  28  29  30  00   \
     31  32  33  34  35     \
       37  38  39  40  00   \
     41  42  43  44  45     \
       47  48  49  50  00   \
     00  00  00  00  00     \
0" // =======================

mv.SW_ext =
"0 \
       06  07  08  09  10   \
     00  11  12  13  14     \
       16  17  18  19  20   \
     00  21  22  23  24     \
       26  27  28  29  30   \
     00  31  32  33  34     \
       36  37  38  39  40   \
     00  41  42  43  44     \
       46  47  48  49  50   \
     00  00  00  00  00     \
0" // =======================

// Directions: for example, first square from i in direction NE is NE[i]
function clear(el) { return (el != "" && el != " "); }  // Filter spaces and empty items.

mv.NE = mv.NE_ext.split(" ").filter(clear).map(Number);
mv.NW = mv.NW_ext.split(" ").filter(clear).map(Number);
mv.SE = mv.SE_ext.split(" ").filter(clear).map(Number);
mv.SW = mv.SW_ext.split(" ").filter(clear).map(Number);

mv.DIRECTIONS = { NE: mv.NE, SE: mv.SE, SW: mv.SW, NW: mv.NW };

var Move = function( iMove ) {
   // steps and takes are arrays of square numbers. Parm move: {steps: [], takes: []}
   this.steps = iMove.steps.slice(0);
   this.takes = iMove.takes.slice(0);

   this.match = function(steps, takes) {
      // Returns true if move.steps is superset of steps AND
      // move.takes is superset of takes.
      var nsteps = steps.map(Number);
      var ntakes = takes.map(Number);
      var isSupersetSteps = isSuperset(this.steps, nsteps);
      var isSupersetTakes = isSuperset(this.takes, ntakes);
      if (isSupersetSteps && isSupersetTakes) return true;
      return false;
   }  // match()

   return this;
}  // Move

function *diagonalGEN(i,d) {
   // Generator function of squares from i in direction d.
   var next = i;
   var stop = ( d[next] == 0 );
   while (!stop) {
      next = d[next];
      stop = ( d[next] == 0 );
      yield next;
   }
   return 0;
}  // *diagonalGEN()

mv.diagonal = function(i,d) {
   // Generates squares from i in direction d.
   // We prefer to use a generator.
   // Available but very new feature in JS. Not supported by older browsers.
   squares = [];
   var next = i;
   var stop = ( d[next] == 0 );
   while (!stop) {
      next = d[next];
      stop = ( d[next] == 0 );
      squares.push(next)
   }
   return squares;
}  // mv.diagonal

//alert("DIAGONAL: " + diagonalOLD(33,mv.NE) );

mv.bmoves_from_square = function(board, i) {
   // Output: array of moves (non-captures) from square i
   var moves = [];     // output array
   var p = board[i];
   if ( !isUpperCase(p) ) return [];  // only moves for white; return empty list

   if (p == 'P') {
      for (dir in mv.DIRECTIONS) {
         var d = mv.DIRECTIONS[dir];
         var q = board[d[i]];
         if ( q == '0' )  continue;       // direction empty; try next direction
         if ( q == '.' && ( d[i] == mv.NE[i] || d[i] == mv.NW[i] )) {
            // move detected; save and continue
            moves.push( new Move({steps: [i,d[i]], takes: []}) );
         }
      }
   }
   if (p == 'K') {
      for (dir in mv.DIRECTIONS) {
         var d = mv.DIRECTIONS[dir];
         var diag = mv.diagonal(i, d); // diagonal squares from i in direction d
         for (t in diag) { 
         //for (var t of diagonalGEN(i,d)) {
            var j = diag[t];
            var q = board[j];
            if (q == '0') break;         // stay inside the board; stop with this diagonal
            if (q != '.') break;         // stop this direction if next square not empty
            if (q == '.') {
               // move detected; save and continue
               moves.push( new Move({steps: [i,j], takes: []}) );
            }
         }
      }
   }
   return moves;
}  // mv.bmoves_from_square() ======================================


mv.bcaptures_from_square = function(board, i) {
   // List of one-take captures for square i
   var captures = [];     // output array
   var p = board[i];
   if ( !isUpperCase(p) ) return [];   // only captures for white; return empty list 

   if (p == 'P') {
      for (dir in mv.DIRECTIONS) {
         var d = mv.DIRECTIONS[dir];
         var q = board[ d[i] ];      // first diagonal square
         if (q == '0') continue;     // direction empty; try next direction
         if ( q == '.' || isUpperCase(q) )  continue;

         if (isLowerCase(q)) {
            r = board[ d[d[i]] ];    // second diagonal square
            if (r == '0') continue;  // no second diagonal square; try next direction
            if (r == '.') {
               // capture detected; save and continue
               captures.push( new Move({steps: [ i, d[d[i]] ], takes: [ d[i] ] }) );
            }
         }
      }
   }
   if (p == 'K') {
      for (dir in mv.DIRECTIONS) {
         var d = mv.DIRECTIONS[dir];
         var take = null;
         var diag = mv.diagonal(i, d); // diagonal squares from i in direction d
         for (var t=0; t < diag.length; t++) {
         //for (var t of diagonalGEN(i,d)) {
            var j = diag[t];
            var q = board[j];
            if (isUpperCase(q)) break;      // own piece on this diagonal; stop
            if (q == '0')  break;           // stay inside the board; stop with this diagonal
            if (isLowerCase(q) && take == null) {
               take = j;      // square number of q
               continue;
            }
            if (isLowerCase(q) && take != null)  break;
            if (q == '.' && take != null) {
               // capture detected; save and continue
               captures.push( new Move({steps: [i,j], takes: [take]}) );
            }
         }
      }
   }
   return captures;
}  // mv.bcaptures_from_square() ======================================

mv.basicMoves = function(board) {
   // Return list of basic moves of board; either captures or normal moves.
   // Basic moves are normal moves or one-take captures
   var bmoves_of_board = [];
   var bcaptures_of_board = [];
   var captureFound = false;

   for (var i=0; i < board.length; i++) {
      var p = board[i];
      if (!isUpperCase(p)) continue;  // Filter only white pieces
      var bcaptures = mv.bcaptures_from_square(board, i);

      if (bcaptures.length > 0) captureFound = true;
      if (captureFound) {
         bcaptures_of_board = bcaptures_of_board.concat( bcaptures );
      }
      else {
         bmoves = mv.bmoves_from_square(board, i);
         bmoves_of_board = bmoves_of_board.concat( bmoves );
      }
   }

   if (bcaptures_of_board.length > 0) {
      return bcaptures_of_board;
   }
   else {
      return bmoves_of_board;
   }
}  // mv.basicMoves()


mv.searchCaptures = function(board) {
   // Capture construction by extending incomplete captures with basic captures

   function boundCaptures(board, capture, depth ) {
      // Recursive construction of captures.
      // - board: current board during capture construction
      // - capture: incomplete capture used to extend with basic captures
      // - depth: not used
      // Output globals: captures and max_takes
      var laststep = capture.steps[capture.steps.length - 1];
      var bcaptures = mv.bcaptures_from_square(board, laststep);   // new extends of capture

      var completed = true;
      for (var j=0; j < bcaptures.length; j++) {
         var bcapture = bcaptures[j];
         if ( bcapture.takes.length == 0 ) continue;          // no capture; nothing to extend
         if ( capture.takes.indexOf(bcapture.takes[0]) > -1) continue;  // do not capture the same piece
         /////OR/////if ( capture.takes.includes(bcapture.takes[0]) ) continue;  // do not capture the same piece

         var n_from = bcapture.steps[0];
         var n_to = bcapture.steps[bcapture.steps.length - 1];   // last step

         var new_board = board.slice(0);  // clone the board and do the capture without taking pieces
         new_board[n_from] = '.';
         new_board[n_to] = board[n_from];

         // make copy of capture and extend it
         var new_capture = new Move( {steps: capture.steps, takes: capture.takes} );
         new_capture.steps.push(bcapture.steps[1]);
         new_capture.takes.push(bcapture.takes[0]);

         completed = false;
         var result = boundCaptures(new_board, new_capture, depth + 1);   // RECURSION result not used
      }
      if (completed) {
         // Update global output variables: captures and max_takes
         captures.push(capture);
         max_takes = capture.takes.length > max_takes ? capture.takes.length : max_takes;

      }

      return 0
   }  // boundCaptures()

   // ============================================================================
   var captures = [];    // global  // resulting array of captures
   var max_takes = 0;    // global  // max number of taken pieces

   var depth = 0;
   var bmoves = mv.basicMoves(board);

   for (var i=0; i < bmoves.length; i++) {
      var bmove = bmoves[i];

      if (bmove.takes.length == 0) break;    // only moves, no captures; nothing to extend
      var n_from = bmove.steps[0];
      var n_to = bmove.steps[bmove.steps.length-1];     // last step

      var new_board = board.slice(0);  // clone the board and do the capture without taking pieces
      new_board[n_from] = '.';
      new_board[n_to] = board[n_from];
      var result = boundCaptures(new_board, bmove, depth);  // result not used
   }
   ////alert("Max takes: " + str(max_takes));

   var result = captures.filter(function(cap) { return cap.takes.length == max_takes } );
   return result;

}  // mv.searchCaptures()

mv.hasCapture = function(board) {     // PUBLIC
   // Returns True if capture for white found for this board else False.
   for (var i=0; i < board.length; i++) {
      var p = board[i];
      if ( !isUpperCase(p) ) continue;
      var bcaptures = mv.bcaptures_from_square(board, i);
      if (bcaptures.length > 0) return true;
   }
   return false;
}  // mv.hasCapture()

mv.gen_moves = function(board) {       // PUBLIC
   // Returns list of all legal moves of a board for player white (capital letters).
   // Move is a named tuple with array of steps and array of takes
   //
   if (mv.hasCapture(board)) {
      var legalMoves = mv.searchCaptures(board);
   }
   else {
      var legalMoves = mv.basicMoves(board);
   }
   // We remove duplicate moves to get a unique move when matching user input.
   legalMoves = mv.removeDuplicateMoves(legalMoves);
   return legalMoves;
}  // mv.gen_moves()

mv.isLegal = function(board, iMove) {     // PUBLIC
   // Returns True if move for this board is legal else False.
   var moves = mv.gen_moves(board);
   for (var i=0; i < moves.length; i++) {
      gmove = moves[i];
      // iMove and gmove equal??
      var firstStepEqual = iMove.steps[0] == gmove.steps[0];
      var lastStepEqual = iMove.steps[iMove.steps.length-1] == gmove.steps[gmove.steps.length-1];
      var takesEqual = arraysEqual(iMove.takes, gmove.takes, true);
      if (firstStepEqual && lastStepEqual && takesEqual) return true;
   }
   return false;
}  // mv.isLegal()

mv.removeDuplicateMoves = function(iMoves) {
   // Remove duplicate moves if they have equal first and last step and equal takes.
   function moveEqual(iMove) {
      // Comparing move iMove with external move variable.
      var firstStepEqual = move.steps[0] == iMove.steps[0];
      var lastStepEqual = move.steps[move.steps.length-1] == iMove.steps[iMove.steps.length-1];
      var takesEqual = arraysEqual(move.takes, iMove.takes, true);
      return firstStepEqual && lastStepEqual && takesEqual;
   }  // moveEqual

   var arr = [];
   for (var i=0; i < iMoves.length; i++) {
      var move = iMoves[i];
      if ( !arr.some(moveEqual) )  arr.push(move);
   }
   return arr;
}  // mv.removeDuplicateMoves()

// ====================================================================================

