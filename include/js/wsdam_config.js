/*
||====================================================================================  
||  WsDam: browser client for 10x10 draughts
||====================================================================================
||  CONSTANTS and CONFIG
||
|| (c) Copyright 2018 Arthur Kalverboer 
||
||====================================================================================
*/

C = {}  // global constants
C.VERSION = "2018.05.1";
C.INITIATOR = "WsDam " + "(" + C.VERSION + ")";   // name DXP protocol
C.APPNAME = {short:"WsDam", long:"WsDam Draughts Client", github: "wsdam_draughts_client"};
C.DESCR = "Webclient for 10x10 draughts";

C.WHITE = 0;
C.BLACK = 1;
C.BOARD_DIM = 10;  // fixed 10x10 board (do not change!)
C.SQUARESIZE = 42; // can be changed for larger board
C.SQR_COLORLIGHT = "#BFBAB6";  
C.SQR_COLORDARK = "#7E858C"
C.BG_COLOR = "#50545D";     // Background color canvas

var w = h = C.SQUARESIZE * C.BOARD_DIM;
C.BOARD_RECT = {x: 10, y: 10, w: w, h: h};  // to fill the canvas
C.CANVAS_SIZE = {w: C.BOARD_RECT.w + 20, h: C.BOARD_RECT.h + 20};
C.PIECE_IMAGE = document.createElement('IMG');

// Choose one of the sprites to display pieces
  //C.PIECE_IMAGE.src = "include/images/spr_th01.png"
  C.PIECE_IMAGE.src = "include/images/spr_th60.svg"
  //C.PIECE_IMAGE.src = "include/images/spr_th61.svg"
  //C.PIECE_IMAGE.src = "include/images/spr_th01.svg"

// Views for sprite images of pieces: sequence bk, bm, wk, wm
C.VIEWS = { k:{}, p:{}, K:{}, P:{} }
C.VIEWS.k = {sx: 0, sy: 0, sw: 48, sh: 48};    // bk
C.VIEWS.p = {sx: 48, sy: 0, sw: 48, sh: 48};   // bm
C.VIEWS.K = {sx: 96, sy: 0, sw: 48, sh: 48};   // wk
C.VIEWS.P = {sx: 144, sy: 0, sw: 48, sh: 48};  // wm

C.SETUP_START = [];  // array of starting position
C.SETUP_START.push('0');
for (var i=1; i<=20; i++)  C.SETUP_START.push('p');
for (var i=21; i<=30; i++) C.SETUP_START.push('.');
for (var i=31; i<=50; i++) C.SETUP_START.push('P');
C.SETUP_START.push('0');

// The external respresentation of our board is a character string.
// Sequence of chars (P K p k .) with 0 at both ends and spaces for visualisation.
BOARD_EMPTY = 
"0 \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
0" // ==========================

BOARD_START =
"0 \
        p   p   p   p   p      \
      p   p   p   p   p        \
        p   p   p   p   p      \
      p   p   p   p   p        \
        .   .   .   .   .      \
      .   .   .   .   .        \
        P   P   P   P   P      \
      P   P   P   P   P        \
        P   P   P   P   P      \
      P   P   P   P   P        \
0" // ==========================



BOARD_TEST_01 =
"0 \
        .   K   .   .   .      \
      .   .   .   .   .        \
        p   .   .   .   .      \
      .   .   .   k   p        \
        p   .   .   .   p      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   p   .   .        \
        .   .   .   p   .      \
      .   .   .   .   .        \
0" // ==========================

BOARD_TEST_02 =
"0 \
        .   K   .   .   .      \
      .   .   .   .   .        \
        p   .   .   .   .      \
      .   .   .   k   p        \
        p   .   .   .   .      \
      .   .   .   .   p        \
        .   .   .   .   .      \
      .   .   p   .   .        \
        .   .   .   p   .      \
      .   .   .   .   .        \
0" // ==========================


BOARD_TEST_03 =
"0 \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
        p   p   .   .   .      \
      P   .   .   .   .        \
        p   p   p   p   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
0" // ==========================

BOARD_TEST_04 =
"0 \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   p   .   p   .        \
        .   .   .   .   .      \
      K   .   .   .   .        \
        .   .   .   .   .      \
      .   p   .   p   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
0" // ==========================

BOARD_TEST_05 =
"0 \
        .   .   .   .   .      \
      .   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   p   .        \
        .   p   p   .   .      \
      .   .   .   .   .        \
        .   .   p   p   .      \
      K   .   .   .   .        \
        .   .   .   .   .      \
      .   .   .   .   .        \
0" // ==========================


BOARD_PROBLEM_01 =  // P.Lauwen, DP, 4/1977
"0 \
        .   .   .   .   p      \
      .   .   p   .   .        \
        .   .   .   .   P      \
      .   .   .   P   .        \
        .   .   .   P   .      \
      .   .   .   P   p        \
        .   P   .   .   p      \
      .   p   .   .   p        \
        P   p   .   .   p      \
      .   .   .   P   P        \
0" // ==========================

// FEN examples
FEN_INITIAL = "W:B1-20:W31-50";
FEN_DXP100_1 = "W:W15,19,24,29,32,41,49,50:B5,8,30,35,37,40,42,45.";  // P.Lauwen, DP, 4/1977
FEN_DXP100_2 = "W:W17,28,32,33,38,41,43:B10,18-20,23,24,37.";
FEN_DXP100_3 = "W:WK3,25,34,45:B38,K47.";
FEN_DXP100_4 = "W:W18,23,31,33,34,39,47:B8,11,20,24,25,26,32.";       // M.Dalman
FEN_DXP100_5 = "B:B7,11,13,17,20,22,24,30,41:W26,28,29,31,32,33,38,40,48.";  // after 30-35 white wins
FEN_DXP100_6 = "W:W30,32,34,35,37,39,40,42,45,46,47,49:B1,8,10,11,12,14,17,19,20,21,23,26.";  // Lucien Lebourg

// Solution 1x1 after 20 moves!! Mad100 finds solution. Set nodes 300000.
FEN_DXP100_7 = "W:W16,21,25,32,37,38,41,42,45,46,49,50:B8,9,12,17,18,19,26,29,30,33,34,35,36.";



// ====================================================================================

