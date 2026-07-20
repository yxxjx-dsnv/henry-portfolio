#include<stdio.h>
#include<stdlib.h>
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

void clearBoard(char board[][WIDTH]){ //initializing the board as loooks like above empty board //the reason why need at least col value is to calculate the memory address
    for (int row = 0; row < HEIGHT; row++){ //WIDTH == 6
        for (int col = 0; col < WIDTH; col++){ // So this function, basically checks every values in row and col and replaces it to '-' (clearing the board)
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



int getPlayerColumnChoice(char board[][WIDTH], char p ){ //in initial, the current player is P1(x)
    int col;

    while (1){
        printf("Player %c enter column: ", p); // p = P1(x) in initial
        scanf("%d", &col);

        if (col < 0)    {
            return col; //once the user typed negative value, firstly it returns and check later to quit this game in main function
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

void makeMove(char board[][WIDTH], char p, int col){ //makeMove(board, currentPlayer, col);
    for (int row = 5; row >= 0; row--)  { //checking from the top, since the piece stacked from bottom to top
        if (board[row][col] == '-')     { //if board is empty at the player choice, keep process
            board[row][col] = p; //assgined as now player at user chosen place
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


int main(void) {
    char board[HEIGHT][WIDTH];
    char currentPlayer = P1;
    int col, x=1;

    clearBoard(board); //make the board in initial condition

    while (x  == 1)  { //infinite loop
        printBoard(board);
        col = getPlayerColumnChoice(board, currentPlayer);

        if (col < 0){ //break this loop when the user types negative value
            break;
        }

        makeMove(board, currentPlayer, col);

        if(currentPlayer == P1) { // after move, player switch
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
