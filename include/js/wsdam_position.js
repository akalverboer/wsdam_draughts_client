/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
||  Module position related stuff.
||  ALL LOGIC FOR POSITION IS "ONE-COLOR" LOGIC: white plays.
||  Numbering of board from top-left to bottom-right.
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

Position = function(iSetup) {
   // A position of a draughts 10x10 game
   // Position stored as an array of 52 char; first and last index unused ('0') rotation-symmetry
   // Coding:
   // - lowercase char: black
   // - uppercase char: white
   // - P: white piece; K: white king
   // - p: black piece; k: black king
   // - dot is empty field
   // The setup is a "one-color" setup. Always white to move.
   // =============================================================================

   this.setup = Array.from(iSetup);  // make clone

   // === METHODS ===
   this.rotate = function() {
      // Swap case of each char in the setup (black <--> white) and reverse setup order.
      var rotSetup = this.setup.map(swapCase).reverse();  // clone
      var rotpos = new Position( rotSetup );
      return rotpos;
   }  // rotate()

   this.clone = function() {
      var setup = Array.from(this.setup);  // make clone
      var newpos = new Position(setup);
      return newpos
   }  // clone()

   this.legalMoves = function() {
      return mv.gen_moves(this.setup);
   }  // legalMoves()

   this.matchMoves = function(iNumbers) {
      // Returns array of moves which matches with given square numbers.
      // Split numbers in steps and takes.
      var steps = [];  var takes = [];
      for (var i=0; i < iNumbers.length; i++) {
         if ( isLowerCase(this.setup[iNumbers[i]]) ) takes.push(iNumbers[i]);
         else steps.push(iNumbers[i]);
      }

      var matchedMoves = [];
      var legalMoves = this.legalMoves();
      for (var i=0; i < legalMoves.length; i++) {
         lmove = legalMoves[i];
         //var matchFound = mv.matchMove(lmove, nsteps, ntakes);
         var matchFound = lmove.match(steps, takes);
         // *** Special match if first and last step equal.***
         var first = lmove.steps[0]; var last = lmove.steps[lmove.steps.length-1];
         var isSpecialMatch = ( steps.length == 1 && first == steps[0] && last == steps[0] );
         if (isSpecialMatch) return [lmove];

         if (matchFound) matchedMoves.push(lmove);
      }
      return matchedMoves;
   }  // matchMoves()

   this.hasCapture = function() {
      return mv.hasCapture(this.setup);
   }  // hasCapture()

   this.domove = function(move) {
      // Move is an object with steps and takes.
      // The move is a "one-color" move; white always playing.
      // Returns new position object after moving.
      // This function does not verify if the move is legal.
      if (move == null)  return this; 
      var setup = this.setup.slice(0);    // clone setup

      // Actual move
      var i = move.steps[0];      // first
      var j = move.steps[move.steps.length-1]; // last (NB. sometimes i==j !)
      var p =  setup[i];

      // Move piece and promote to white king
      setup[i] = '.';
      var promotion_line = [1,2,3,4,5];
      if (promotion_line.indexOf(j) > -1 && p!= 'K')  setup[j] = 'K';
      else setup[j] = p;

      // Capture
      for (var k=0; k < move.takes.length; k++) setup[move.takes[k]] = '.';

      var posnew = new Position(setup);
      return posnew;
   }  // doMove()

   return this;
}  //===  Position


// ====================================================================================

