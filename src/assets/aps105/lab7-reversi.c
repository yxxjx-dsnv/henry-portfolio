#include <stdio.h>
#include "reversi.h"

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
    int row, col;
    int center = n / 2; //if n = 6, center = 3

    for (row = 0; row< n; row++) {
        for (col = 0; col < n; col++) {
            board[row][col] = 'U';
        }
    } board[center - 1][center - 1] = 'W'; // board[3-1][3-1] left-top
      board[center - 1][center] = 'B'; // board[3-1][3] left-bottom
      board[center][center - 1] = 'B'; // board[3][3-1] right-top
      board[center][center] = 'W'; // board[3][3] right-bottom
}

static char switchColour(char colour) {
    if (colour == 'B') {
        return 'W';
    } else {
        return 'B';
    }
}

void printBoard(char board[][26], int n) {
    int row, col;

    printf("  ");

    for (col = 0; col < n; col++) { //print labes on the top of board e.g) a b c d e f
        printf("%c", 'a' + col); //this is because of ASCII. 'a' = 97 and 'b' =98 and so on.
    }
    printf("\n");

    for (row = 0; row < n; row++) {
        printf("%c ", 'a' + row); //print alpabet first and space to print condition U B W
        for (col = 0; col < n; col++) {
            printf("%c", board[row][col]);  //U - for unoccupied
                                            //B - occupied by black
                                            //W - occupied by white
        }
        printf("\n");
    }
}

bool positionInBounds(int n, int row, int col) { //checking if it's meets or not
    return col >= 0 && col < n && row >= 0 && row < n ; // return True or False
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
    int dr,dc;

    for (dr = -1; dr <= 1; dr++) {
        for (dc= -1; dc <= 1; dc++) {
            if(dr == 0 && dc == 0) { // Skip the (0,0) direction (no movement)
                continue;
            } if(checkLegalInDirection(board, n, row, col, colour, dr, dc)) { // If at least one direction is legal, the move is legal
                return true;
            }
        }
    }
    return false; // No valid direction found → move is not legal
}

// Prints all valid moves in the order of increasing rows, then in the order of increasing columns
void availableMoves(char board[][26], int n, char colour) {
    int row,col;

    printf("Available moves for %c:\n", colour); // e.g.)Available moves for W:
    for (row = 0; row < n; row++) {
        for (col = 0; col < n; col++) {
            if (checkMOVE(board, n, row, col, colour)) { //if(True) -> print blah blah blah in order
                printf("%c%c\n",'a' + row, 'a' + col); //e.g.)aa , ab, cd ,etc
            }
        }
    }
}

// Flips opponent pieces to the current colour
// starts from row, col -> moving by deltaRow, deltaCol
void flip(char board[][26], int n, int row, int col, char colour, int deltaRow, int deltaCol) {
    int r = row + deltaRow, c = col + deltaCol;
    char opponent = switchColour(colour);

    while (positionInBounds(n, r, c) && board[r][c] == opponent) {// check if piece is opponent, and if yes, it changes colour
        board[r][c] =  colour; // this flip pieces
        r = r+deltaRow;
        c = c+deltaCol;
    }
}

void makeMove(char board[][26], int n, int row, int col, char colour) {
    bool legalDir[3][3] = {{false}};

    for (int dr = -1; dr <= 1; dr++) { // Check all directions and record valid ones
        for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) {
                continue;
            }
            if (checkLegalInDirection(board, n, row, col, colour, dr, dc)) {
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

int main(void) {
    char board[26][26];
    char config[4];
    char move[4];
    char colour;
    int row, col, n;

    printf("Enter the board dimension: ");
    scanf("%d", &n);

    clearBoard(board, n);
    printBoard(board, n);

    printf("Enter board configuration:\n"); // Read board configuration until "!!!"
    while (1) { //infinite loop
        scanf("%3s", config);
        if (config[0]== '!' && config[1] == '!' && config[2] == '!') {
            break;
        }
        board[config[1]-'a'][config[2]-'a'] = config[0];
    }

    printBoard(board, n);
    availableMoves(board, n, 'W');
    availableMoves(board, n, 'B');
    printf("Enter a move:\n");
    scanf("%3s", move);

    colour = move[0];
    row = move[1] - 'a';
    col = move[2] - 'a';

    if (checkMOVE(board, n, row, col, colour)) {
        printf("Valid move.\n");
        makeMove(board, n, row, col, colour);
    } else {
        printf("Invalid move.\n");
    }

    printBoard(board, n);

    return 0;
}
