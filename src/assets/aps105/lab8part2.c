#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include "lab8part2.h"
#include "liblab8part2.h"

/*
 *  Reversi: simliar like gomoku, but little different
 *  Reversi is played on a board -> like a chess board
 *  the dimensions is even.  e.g.) if  n=4 -> 4 x 4 
                                       n=6 -> 6 x 6
 *  Two tiles: Black(B) and White(W)
 *  Tiles can be Fliped but no removed
 *  The initial Condition: Put tiles at middle of board by cross each others
 *  Trun -  put tiles on a empty board : 
            1. There must be a continuous straight line of tile(s) of the opponent's colour
               in at least one of the eight directions from the candidate empty position 
               (North, South, East, West, and diagonals).
            2. In the position immediately following the continuous straight line mentioned 
               in #1 above, a tile of the player's colour must already be placed.
 *          3. If tiles meet that criteria, the opponent's tiles are flipped to the player's tile colour                          
 *  If one player has no available move, an available player is allowed to continue to make moves.
 *  
 *  When the games end? - the entire board is full, or neither player has an available move.
 */


/* 
 *  The first input to the program will be n : n is even umber and maximum is 26
 *  There is no need to allocate memory dynamically or to declare variable-length arrays.
 *  Your program should initialize the board as shown above and print it.
 *  The user will type as format: colour of tiles, row loc(a to z), col loc(a to z) (w/o space)-- e.g.)Waa Bca
 *  The typed "!!!"" ends the board configuration entry phase
 * 
 *  Then your program should print a list of the available moves for the White player,
 *  The available moves for each player should be printed in the order of increasing rows,
 *  then in the order of increasing columns (for available moves in the same row).
 */

/*
 *  U - for unoccupied
 *  B - occupied by black
 *  W - occupied by white
 */


static void clearBoard(char board[][26], int n) {
    int row,  col;
    int center = n / 2; //if n = 6, center = 3

    for (row = 0; row< n; row++) {
        for (col =0; col < n; col++) {
            board[row][col] = 'U';
        }
    } board[center - 1][center - 1] = 'W'; // board[3-1][3-1] left-top
      board[center - 1][center] = 'B'; // board[3-1][3] left-bottom
      board[center][center - 1] = 'B'; // board[3][3-1] right-top
      board[center][center] = 'W'; // board[3][3] right-bottom
}

static char switchColour(char colour) {
    if (colour  ==  'B') {
        return 'W';
    } else {
        return 'B';
    }
}

void printBoard(char board[][26], int n) {
    int row, col;
    printf("  ");

    for (col = 0; col<n; col++) { //print labes on the top of board e.g) a b c d e f
        printf("%c", 'a' + col); //this is because of ASCII. 'a' = 97 and 'b' =98 and so on.
    }   printf("\n");

    for (row = 0; row<n; row++) {
        printf("%c ", 'a' +row); //print alpabet first and space to print condition U B W
        for (col = 0; col < n; col++) {
            printf("%c", board[row][col]);  //U - for unoccupied
                                            //B - occupied by black
                                            //W - occupied by white
        }
        printf("\n");
    }
}

bool positionInBounds(int n, int row, int col) { //checking if it's meets or not
    return col >= 0 && row >= 0 && col < n && row < n ; // return True or False
}

//checks whether (row, col) is a legal position for a tile of colour by "looking'' in the direction specified by deltaRow and deltaCol.
//deltaRow and deltaCol take on values of -1, 0, and 1
bool checkLegalInDirection(char board[][26], int n, int row, int col, char colour, int deltaRow, int deltaCol) {
    char opponent = switchColour(colour); // to define opponent, using function anme switchColur to define opponent
    int ROW, COL;

    if (board[row][col] != 'U') { //check position is already empty or not. if it's not empty it retrun false and quit
        return false;
    }

    ROW = row + deltaRow; // new position in x dir
    COL = col + deltaCol; // y dir

    if (!positionInBounds(n, ROW, COL)) { // if positionInBounds is false, it returns false
        return false;
    } if (board[ROW][COL] != opponent) { //if New located postion in + -1 0 1 is not opponent colour, it return false
        return false;
    }

    ROW = ROW + deltaRow; // new position in x dir
    COL = COL + deltaCol;

    while (positionInBounds(n, ROW, COL)) {
        if (board[ROW][COL] == 'U') {
            return false;
        } if (board[ROW][COL] == colour) {
            return true;
        }
    ROW = ROW + deltaRow; // new position in x dir
    COL = COL + deltaCol;
    }

    return false;
}

// Checks if a piece move is legal
// by testing all 8 directions, returns true if it is vald
bool checkMOVE(char board[][26], int n, int row, int col, char colour) {
    int deltaRow,deltaCol;

    for (deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (deltaCol= -1; deltaCol <= 1; deltaCol++) {
            if(deltaRow == 0 && deltaCol == 0) { // Skip the (0,0) direction (no movement)
                continue;
            } if(checkLegalInDirection(board, n, row, col, colour, deltaRow, deltaCol)) { // If at least one direction is legal, the move is legal
                return true;
            }
        }
    }
    return false; // No valid direction found → move is not legal
}

// // Prints all valid moves in the order of increasing rows, then in the order of increasing columns
// void availableMoves(char board[][26], int n, char colour) {
//     int row,col;

//     printf("Available moves for %c:\n", colour); // e.g.)Available moves for W:
//     for (row = 0; row < n; row++) {
//         for (col = 0; col < n; col++) {
//             if (checkMOVE(board, n, row, col, colour)) { //if(True) -> print blah blah blah in order
//                 printf("%c%c\n",'a' + row, 'a' + col); //e.g.)aa , ab, cd ,etc
//             }
//         }
//     }
// }

// Flips opponent pieces to the current colour
// starts from row, col -> moving by deltaRow, deltaCol
void flip(char board[][26], int n, int row, int col, char colour, int deltaRow, int deltaCol) {
    int r = row + deltaRow, c = col +deltaCol;
    char opponent = switchColour(colour);

    while (positionInBounds(n, r, c) && board[r][c] == opponent) {// check if piece is opponent, and if yes, it changes colour
        board[r][c] =  colour; //this flip pieces
        r = r+deltaRow;
        c = c+deltaCol;
    }
}

void doMove(char board[][26], int n, int row, int col, char colour) {
    bool legalDir[3][3] = {{false}};

    for (int dr = -1; dr <= 1; dr++) { // Check all directions and record valid ones
        for (int dc = -1; dc <=1; dc++) {
            if (dr ==  0 && dc== 0) {
                continue;
            }   if (checkLegalInDirection(board, n, row, col, colour, dr, dc)) {
                legalDir[dr+1][dc+1] = true;
            }
        }
    }

    board[row][col] = colour; // Place the piece on the board

    for (int dr = -1; dr <= 1; dr++) { // Flip pieces in all valid directions
        for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) {
                continue;
            }
            if (legalDir[dr+1][dc+1]) {
                flip(board, n, row, col, colour, dr, dc);
            }
        }
    }
}

// -------- from here : part 2 ----------

static void copyBoard(const char src[][26], char dest[][26], int n) {
    for (int row = 0; row < n; row++) {
        for (int col = 0; col < n; col++) {
            dest[row][col] = src[row][col];
        }
    }
}

static bool constcheckLegalInDirection(const char board[][26], int n, int row, int col,char colour, int deltaRow, int deltaCol) {
    char opponent = switchColour(colour);
    int ROW, COL;

    if (board[row][col] != 'U') {
        return false;
    }

    ROW = row + deltaRow;
    COL = col + deltaCol;

    if (!positionInBounds(n, ROW, COL)) {
        return false;
    } if (board[ROW][COL] != opponent) {
        return false;
    }

    ROW = ROW + deltaRow;
    COL = COL + deltaCol;

    while (positionInBounds(n, ROW, COL)) {
        if (board[ROW][COL] == 'U') {
            return false;
        }   if (board[ROW][COL] == colour) {
            return true;
        }
        ROW = ROW + deltaRow;
        COL = COL + deltaCol;
    }
    return false;
}

static bool constCheckMOVE(const char board[][26], int n, int row, int col, char colour) {
    for (int dr = -1; dr <= 1; dr++) {
        for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) {
                continue;
            }   if (constcheckLegalInDirection(board, n, row, col, colour, dr, dc)) {
                return true;
            }
        }
    }
    return false;
}

static int countAvailableMoves(const char board[][26], int n, char colour) {
    int count = 0;

    for (int row = 0; row < n; row++) {
        for (int col = 0; col < n; col++) {
            if (constCheckMOVE(board, n, row, col, colour)) {
                count++;
            }
        }
    }
    return count;
}

static int countFlipsInDirection(const char board[][26], int n, int row,int col, char colour, int deltaRow, int deltaCol) {
    int r = row +deltaRow;
    int c = col + deltaCol;
    int count =  0;
    char opponent = switchColour(colour);

    if (!positionInBounds(n, r, c) || board[r][c] != opponent) {
        return 0;
    }

    while (positionInBounds(n, r, c) && board[r][c] == opponent) {
        count++;
        r = r + deltaRow;
        c = c + deltaCol;
    }

    if (!positionInBounds(n, r, c))   {
        return 0;
    }   if (board[r][c] == colour)  {
        return count;
    }
    return 0;
}

static int totalFlips(const char board[][26], int n, int row, int col, char colour) {
    int total = 0;

    for (int dr =  -1; dr <= 1; dr++) {
        for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) {
                continue;
            }
            total = total + countFlipsInDirection(board, n, row, col, colour, dr, dc);
        }
    }
    return total;
}

static int positionScore(const char board[][26], int n, int row, int col) {
    int score = 0;

    /* corners are best */
    if ((row == 0 && col == 0) || (row == 0 && col == n - 1) || (row == n - 1 && col ==0) ||(row == n - 1 && col == n - 1)) {
        return 1000;
    }

    /* edges are generally good */
    if (row == 0 ||row == n - 1 || col == 0 || col == n - 1) {
        score = score + 80;
    }

    /* X-squares near empty corners are dangerous */
    if (row == 1 && col == 1 && board[0][0] == 'U') {
        score = score - 250;
    }   if (row == 1 && col == n - 2 && board[0][n - 1] =='U') {
        score = score - 250;
    }   if (row == n - 2 && col == 1 && board[n -1][0] == 'U') {
        score = score - 250;
    }   if (row == n - 2 && col == n - 2 && board[n-1][n-1]== 'U') {
        score = score - 250;
    }/* C-squares next to empty corners are also risky */
        if (row == 0 && col == 1 && board[0][0] == 'U') {
        score = score - 120;
    }   if (row == 1 && col == 0 && board[0][0] == 'U') {
        score = score - 120;
    }   if (row == 0 && col == n -2 && board[0][n - 1] == 'U') {
        score = score - 120;
    }   if (row == 1 && col == n - 1 && board[0][n - 1] == 'U') {
        score = score - 120;
    }   if (row == n -2 && col == 0 && board[n - 1][0] == 'U') {
        score = score - 120;
    }   if (row == n- 1 && col == 1 && board[n - 1][0] == 'U') {
        score = score - 120;
    }   if (row== n - 2 && col == n - 1 && board[n- 1][n -1] == 'U') {
        score = score - 120;
    }   if (row == n -1 && col == n - 2 && board[n -1][n - 1] == 'U') {
        score = score - 120;
    }

    return score;
}

static bool constPlayerHasMove(const char board[][26], int n, char colour) {
    for (int row = 0; row <n; row++) {
        for (int col =0; col < n; col++) {
            if (constCheckMOVE(board, n, row, col, colour)) {
                return true;
            }
        }
    }
    return false;
}

static int evaluateBoard(const char board[][26], int n, char myColour) {
    char oppColour = switchColour(myColour);
    int myPieces = 0, oppPieces = 0;
    int myCorners = 0, oppCorners = 0;
    int myMobility = 0, oppMobility = 0;
    int score = 0;

    for (int row =  0; row < n;  row++) {
        for (int col =  0; col < n;  col++) {
            if (board[row][col] == myColour) {
                myPieces++;
            } else if (board[row][col] == oppColour) {
                oppPieces++;
            }
        }
    }

    if (board[0][0] == myColour) {
        myCorners++;
    }   else if (board[0][0] == oppColour) {
        oppCorners++;
    }

    if (board[0][n - 1] == myColour) {
        myCorners++;
    }   else if (board[0][n - 1] == oppColour) {
        oppCorners++;
    }

    if (board[n - 1][0] == myColour) {
        myCorners++;
    }   else if (board[n - 1][0] == oppColour) {
        oppCorners++;
    }

    if (board[n - 1][n - 1] == myColour) {
        myCorners++;
    }   else if (board[n - 1][n - 1] == oppColour) {
        oppCorners++;
    }

    myMobility = countAvailableMoves(board, n, myColour);
    oppMobility = countAvailableMoves(board, n, oppColour);

    score = score +(myPieces - oppPieces) * 2;
    score = score +(myCorners - oppCorners) * 100;
    score = score + (myMobility - oppMobility) * 8;

    return score;
}

static int minMax(const char board[][26], int n, char currentTurn, char myColour, int depth, int maxDepth,int alpha, int beta) {
    char oppColour = switchColour(currentTurn);

    if (depth == maxDepth) {
        return evaluateBoard(board, n, myColour);
    }

    if (!constPlayerHasMove(board, n, 'B') && !constPlayerHasMove(board, n, 'W')) {
        return evaluateBoard(board, n, myColour);
    }

    if (!constPlayerHasMove(board, n, currentTurn)) {
        return minMax(board, n, oppColour, myColour, depth + 1, maxDepth, alpha, beta);
    }

    if (currentTurn == myColour) {
        int best = -1000000;
        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                if (constCheckMOVE(board, n, row, col, currentTurn)) {
                    char tempBoard[26][26];
                    int score;

                    copyBoard(board, tempBoard, n);
                    doMove(tempBoard, n, row, col, currentTurn);

                    score = minMax((const char (*)[26])tempBoard, n, oppColour, myColour, depth + 1, maxDepth, alpha, beta);

                    if (score > best) {
                        best = score;
                    }   if (best > alpha) {
                        alpha = best;
                    }   if (beta <= alpha) {
                        return best;
                    }
                }
            }
        }
        return best;
    }   else    {
        int best = 1000000;

        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                if (constCheckMOVE(board, n, row, col, currentTurn)) {
                    char tempBoard[26][26];
                    int score;

                    copyBoard(board, tempBoard, n);
                    doMove(tempBoard, n, row, col, currentTurn);

                    score = minMax((const char (*)[26])tempBoard, n, oppColour, myColour, depth + 1, maxDepth, alpha, beta);

                    if (score < best) {
                        best = score;
                    }   if (best < beta) {
                        beta = best;
                    }   if (beta <= alpha) {
                        return best;
                    }
                }
            }
        }
        return best;
    }
}

/*
 * Chooses the best move for turn.
 * Returns the evaluation score.
 * The chosen move is written into *row and *col.
 */
int makeMove(const char board[][26], int n, char turn, int *row, int *col) {
    int bestScore = -1000000;
    int maxDepth = 4;

    // char tempBoard[26][26];
    // char opponent = switchColour(turn);
    // int score, flips, oppMoves, myMoves;

    *row = -1;
    *col = -1;

    for (int r = 0; r < n; r++) {
        for (int c = 0; c < n; c++) {
            if (constCheckMOVE(board, n, r, c, turn)) {
                char tempBoard[26][26];
                int score;

                copyBoard(board, tempBoard, n);
                doMove(tempBoard, n, r, c, turn);

                score = minMax((const char (*)[26])tempBoard, n, switchColour(turn), turn,
                                1, maxDepth, -1000000, 1000000);

                //add small positional bonus to prefer strong squares
                score += positionScore(board, n, r, c);
                score += totalFlips(board, n, r, c, turn);

                /* row-major traversal automatically breaks ties */
                if (score >bestScore) {
                    bestScore = score;
                    *row = r;
                    *col = c;
                }
            }
        }
    }

    if (*row == -1||*col == -1) {
        return 0;
    }

    return bestScore;
}





// -------------------- lab 8 part1 code : from here 

// /* Returns true if the given colour has at least one legal move */
// static bool userMoved(char board[][26], int n, char colour) {
//     int row, col;

//     for (row = 0; row < n; row++) {
//         for (col = 0; col < n; col++) {
//             if (checkMOVE(board, n, row, col, colour)) {
//                 return true;
//             }
//         }
//     }
//     return false;
// }

// /* Returns true if the board has no empty squares left */
// static bool boardIsFull(char board[][26], int n) {
//     int row, col;

//     for (row = 0; row < n; row++) {
//         for (col = 0; col < n; col++) {
//             if (board[row][col] == 'U') {
//                 return false;
//             }
//         }
//     }
//     return true;
// }

// /* Counts how many pieces of a given colour are on the board */
// static int countPieces(char board[][26], int n, char colour) {
//     int row, col;
//     int count = 0;

//     for (row = 0; row < n; row++) {
//         for (col = 0; col < n; col++) {
//             if (board[row][col] == colour) {
//                 count++;
//             }
//         }
//     }
//     return count;
// }

// /* Prints the winner based on final piece counts */
// static void printWinner(char board[][26], int n) {
//     int blackCount = countPieces(board, n, 'B');
//     int whiteCount = countPieces(board, n, 'W');

//     if (blackCount > whiteCount) {
//         printf("B player wins.\n");
//     } else if (whiteCount > blackCount) {
//         printf("W player wins.\n");
//     } else {
//         printf("Draw!\n");
//     }
// }

// /*
//  * Counts how many opponent pieces would be flipped in one direction
//  * if colour were played at (row, col).
//  */
// static int countFlipsInDirection(char board[][26], int n, int row, int col,
//                                  char colour, int deltaRow, int deltaCol) {
//     int r = row + deltaRow;
//     int c = col + deltaCol;
//     int count = 0;
//     char opponent = switchColour(colour);

//     if (!positionInBounds(n, r, c) || board[r][c] != opponent) {
//         return 0;
//     }

//     while (positionInBounds(n, r, c) && board[r][c] == opponent) {
//         count++;
//         r += deltaRow;
//         c += deltaCol;
//     }

//     if (!positionInBounds(n, r, c)) {
//         return 0;
//     }

//     if (board[r][c] == colour) {
//         return count;
//     }

//     return 0;
// }

// /* Total score of a candidate move = number of flipped opponent pieces */
// static int moveScore(char board[][26], int n, int row, int col, char colour) {
//     int dr, dc;
//     int score = 0;

//     if (!checkMOVE(board, n, row, col, colour)) {
//         return 0;
//     }

//     for (dr = -1; dr <= 1; dr++) {
//         for (dc = -1; dc <= 1; dc++) {
//             if (dr == 0 && dc == 0) {
//                 continue;
//             }
//             score += countFlipsInDirection(board, n, row, col, colour, dr, dc);
//         }
//     }

//     return score;
// }

// /*
//  * Chooses the best move for the computer.
//  * Best means highest score.
//  * Ties are automatically broken by smaller row then smaller column,
//  * because we scan in row-major order.
//  */
// static void chooseComputerMove(char board[][26], int n, char colour, int *bestRow, int *bestCol) {
//     int row, col;
//     int bestScore = -1;

//     *bestRow = -1;
//     *bestCol = -1;

//     for (row = 0; row < n; row++) {
//         for (col = 0; col < n; col++) {
//             if (checkMOVE(board, n, row, col, colour)) {
//                 int score = moveScore(board, n, row, col, colour);
//                 if (score > bestScore) {
//                     bestScore = score;
//                     *bestRow = row;
//                     *bestCol = col;
//                 }
//             }
//         }
//     }
// }


// lab 8 part1 code : until here -------------------- 



/*
int main(void) {
    char board[26][26];
    // char config[4];
    // char move[4];
    // char colour;

    char computerColour, humanColour, turn;
    char move[3];

    int row, col, n;
    int r,c;

    while (1) {
    printf("Enter the board dimension: ");
    scanf("%d", &n);

    if (n >= 4 && n <= 26 && n % 2 == 0) {
        break;
    }
}

    while (1) {
    printf("Computer plays (B/W): ");
    scanf(" %c", &computerColour);

    if (computerColour == 'B' || computerColour == 'W') {
        break;
    }
}

    // humanColour = switchColour(computerColour);

    clearBoard(board, n);
    printBoard(board, n);

    // printf("Enter board configuration:\n"); // Read board configuration until "!!!"
    // while (1) { //infinite loop
    //     scanf("%3s", config);
    //     if (config[0]== '!' && config[1] == '!' && config[2] == '!') {
    //         break;
    //     }
    //     board[config[1]-'a'][config[2]-'a'] = config[0];
    // }

    // printBoard(board, n);
    // // availableMoves(board, n, 'W');
    // // availableMoves(board, n, 'B');
    // printf("Enter a move:\n");
    // scanf("%3s", move);

    // colour = move[0];
    // row = move[1] - 'a';
    // col = move[2] - 'a';

    // if (checkMOVE(board, n, row, col, colour)) {
    //     printf("Valid move.\n");
    //     doMove(board, n, row, col, colour);
    // } else {
    //     printf("Invalid move.\n");
    // }

    // printBoard(board, n);

    turn = 'B';

    while (1) {
        bool blackHasMove = false;
        bool whiteHasMove = false;

        for (r = 0; r < n; r++) {
            for (c = 0; c < n; c++) {
                if (checkMOVE(board, n, r, c, 'B')) {
                    blackHasMove = true;
                }
                if (checkMOVE(board, n, r, c, 'W')) {
                    whiteHasMove = true;
                }
            }
        }

        //Game ends if neither player has a valid move
        if (!blackHasMove && !whiteHasMove) {
            int blackCount = 0;
            int whiteCount = 0;

                for (r = 0; r < n; r++) {
                    for (c = 0; c < n; c++) {
                        if (board[r][c] == 'B') {
                            blackCount++;
                        } else if (board[r][c] == 'W') {
                            whiteCount++;
                        }
                    }
                }

                if (blackCount > whiteCount) {
                    printf("B player wins.\n");
                } else if (whiteCount > blackCount) {
                    printf("W player wins.\n");
                } else {
                    printf("Draw!\n");
                }
            break;
        }

        //Skip turn if current player has no valid move
        if ((turn == 'B' && !blackHasMove) || (turn == 'W' && !whiteHasMove)) {
            printf("%c player has no valid move.\n", turn);
            turn = switchColour(turn);
            continue;
        }

        //Computer turn
        if (turn == computerColour) {
            makeMove(board, n, turn, &row, &col);
            printf("Computer places %c at %c%c.\n", turn, 'a' + row, 'a' + col);
            doMove(board, n, row, col, turn);
            printBoard(board, n);
        }


        // //Human turn
        // else {
        //     printf("Enter move for colour %c (RowCol): ", turn);
        //     scanf("%2s", move);

        //     row = move[0] - 'a';
        //     col = move[1] - 'a';

        //     if (!positionInBounds(n, row, col) || !checkMOVE(board, n, row, col, turn)) {
        //         printf("Invalid move.\n");
        //         printf("%c player wins.\n", computerColour);
        //         break;
        //     }

        //     doMove(board, n, row, col, turn);
        //     printBoard(board, n);
        // }


        // //lab8 part2 Testing turn -- smarter ver.
        // else {
        //     findSmarterMove(board, n, turn, &row, &col);
        //     printf("Testing AI move (row, col): %c%c\n", row + 'a', col + 'a');

        //     if (!positionInBounds(n, row, col) || !checkMOVE(board, n, row, col, turn)) {
        //         printf("Invalid move.\n");
        //         printf("%c player wins.\n", computerColour);
        //         break;
        //     }

        //     doMove(board, n, row, col, turn);
        //     printBoard(board, n);
        // }


        // //lab8 part2 Testing turn -- smartest ver.
        // else {
        //     findSmartestMove(board, n, turn, &row, &col);
        //     printf("Testing AI move (row, col): %c%c\n", row + 'a', col + 'a');

        //     if (!positionInBounds(n, row, col) || !checkMOVE(board, n, row, col, turn)) {
        //         printf("Invalid move.\n");
        //         printf("%c player wins.\n", computerColour);
        //         break;
        //     }

        //     doMove(board, n, row, col, turn);
        //     printBoard(board, n);
        // }

        turn = switchColour(turn);
    }

        return 0;
    }

*/
