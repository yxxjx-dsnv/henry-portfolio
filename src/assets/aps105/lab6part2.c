#include<stdio.h>
#include<stdlib.h>
#include<stdbool.h>
#include<math.h>

#define WIDTH 7
#define HEIGHT 6
#define CONNECT 4
#define P1 'X'
#define P2 'O'
#define EMPTY '-'

//Lab 6: Connect Four!

//The board consists of 6 rows and 7 columns,

/*
Your implementation will:

Print the current state of the board before every move
Prompt the user to input a column between 0 and 6 in which to drop their piece
Validate the chosen column is within bounds and is not full
Check for a winner
Display the final board and who won when the game ends
Exit when any player enters a negative number
*/


//Game Rules:
/*
Player 1: X , Player 2: O -- Player 1 starts the game first
Player choose a col index(0-6: 7 cols) -- need to be check if the players' enter is vaild or not
if player choose out of range, it need to be re-type

prompt: 
Player 1 : Player X enter column = 0 <= x <= 6
Player 2 : Player O enter column = 0 <= x <= 6

Win:
A player wins if they connect four pieces in a row
- codition: horizontally (left to right)
            vertically (top to bottom)
            diagonally (either ascending or descending)

Print this when wins: "Player X wins!" or "Player O wins!"

Note: I dont need to detect a condition to Draw(when the board is full, but no 4 connects)
*/


/*
An empty board will look like so

0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - -


A board where player X has chosen column 1, and player O has chosen column 3 will look like so

0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- X - O - - - 
*/

void clearBoard(char board[][WIDTH]){ //initializing the board as loooks like above empty board
    for (int row = 0; row < HEIGHT; row++){
        for (int col = 0; col < WIDTH; col++){
            board[row][col] = '-';
        }
    }
}

void printBoard(char board[][WIDTH]){ // print when non: - , exist: O or X
    for (int col = 0; col < WIDTH; col++){ //print numbers on the top of board e.g) 0 1 2 3 4 5 6
        printf("%d ", col);
    }
    printf("\n");

    for (int row = 0; row < HEIGHT; row++){
        for (int col = 0; col < WIDTH; col++)   {
            printf("%c ", board[row][col]);
        }
        printf("\n");
    }
}



int getPlayerColumnChoice(char board[][WIDTH], char p){
    int col;

    while (1){
        printf("Player %c enter column: ", p);
        scanf("%d", &col);

        if (col < 0)    {
            return col;
        } if (col >= 7) {
            continue;
        } 
        // if (board[0][col] != '-') {
        //     continue;
        // }

        return col;
    }
}

/*
The prompt will be "Player X enter column: " or "Player Y enter column: ".  
The column index is expected to be between 0 and 6 inclusive.
if player typed wrong(greater than WIDTH -1 / enter invalid input / enter a col with full), need to be re-typed

Note: If the player enters a negative number, the program will exit with no further output.
*/

void makeMove(char board[][WIDTH], char p, int col){
    for (int row = 5; row >= 0; row--)  {
        if (board[row][col] == '-')     {
            board[row][col] = p;
            return;
        }
    }
}
/*
This function is responsible for executing the move on column col specified by player p.

The function will examine the specified column to find the lowest EMPTY position and set that slot to the player piece.

Given a board like so

0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - X - - -
calling the function with p='O' and col=3 will update the board like so

0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - O - - - 
- - - X - - - 
*/


bool checkPosition(char board[][WIDTH], int col, int row) { //check winning condition. 
    /*
    --- codition: horizontally (left to right)
        vertically (top to bottom)
        diagonally (either ascending or descending)
    */
    char piece = board[row][col];

    if (piece == '-') {
        return false;
    }

    // Horizontal
    if (col< WIDTH -3 ) { //WIDTH==7 , 7-3 = 4 which same as need to connect 4.
        if (board[row][col + 1] == piece && board[row][col + 2] == piece && board[row][col + 3] == piece) {
            return true; // col + 1, becuase the number is starts from 0 and also Piece is piece = board[row][col]; so this basically check horizontally connects 4
        }
    }

    // Vertical
    if (row< HEIGHT -3) {
        if (board[row + 1][col] == piece && board[row + 2][col] == piece && board[row + 3][col] == piece) {
            return true; //same features but in vertically
        }
    }

    // Descending
    if (row< HEIGHT -3 && col< WIDTH-3) {
        if (board[row + 1][col + 1] == piece && board[row + 2][col + 2] == piece &&board[row + 3][col + 3] == piece) {
            return true;
        }
    }

    // Ascending
    if (row - 3 >= 0 && col + 3 < WIDTH) {
        if (board[row - 1][col + 1] == piece && board[row - 2][col + 2] == piece && board[row - 3][col + 3] == piece) {
            return true;
        }
    }

    return false;
}

bool checkForWin(char board[][WIDTH]) {
    for (int row = 0; row < 6; row++) {
        for (int col = 0; col < 7; col++) {
            if (checkPosition(board, col, row)) {
                return true;
            }
        }
    }
    return false;
}


int main(void) {
    char board[HEIGHT][WIDTH];
    char currentPlayer = P1;
    int col, x=1;

    clearBoard(board);

    while (x  == 1)  {
        printBoard(board);
        col = getPlayerColumnChoice(board, currentPlayer);

        if (col < 0){
            break;
        }

        makeMove(board, currentPlayer, col);

        if (checkForWin(board)) {
            printBoard(board);
            printf("Player %c wins!\n", currentPlayer);
            return 0;
        }

        if(currentPlayer == P1) { //player switch
            currentPlayer = P2; 
        }else{
            currentPlayer = P1;
        }
    }

    return 0;
}


/*

Sample Output
Example 3: Player exits

0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
Player X enter column: 1
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- X - - - - - 
Player O enter column: 2
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- X O - - - - 
Player X enter column: 3
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- X O X - - - 
Player O enter column: 1
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- O - - - - - 
- X O X - - - 
Player X enter column: 2
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- O X - - - - 
- X O X - - - 
Player O enter column: 3
0 1 2 3 4 5 6 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- - - - - - - 
- O X O - - - 
- X O X - - - 
Player X enter column: -1

*/
