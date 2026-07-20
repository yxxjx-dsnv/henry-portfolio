// APS105 (intro C) weekly labs. Each lab has one or more independent programs
// (each with its own main); a program may span multiple files (a .c the visitor
// edits plus read-only framework headers). `code` is Henry's original submission
// — the Reset baseline. `stdin` is a sample the program reads with scanf.
//
// Sources live in src/assets/aps105/** and are imported verbatim (?raw).

import lab0 from '../assets/aps105/lab0.c?raw';
import lab1p1 from '../assets/aps105/lab1part1.c?raw';
import lab1p2 from '../assets/aps105/lab1part2.c?raw';
import lab1p3 from '../assets/aps105/lab1part3.c?raw';
import lab2p1 from '../assets/aps105/lab2part1.c?raw';
import lab2p2 from '../assets/aps105/lab2part2.c?raw';
import lab2p3 from '../assets/aps105/lab2part3.c?raw';
import lab3p1 from '../assets/aps105/lab3part1.c?raw';
import lab3p2 from '../assets/aps105/lab3part2.c?raw';
import lab3p3 from '../assets/aps105/lab3part3.c?raw';
import lab4p1 from '../assets/aps105/lab4part1.c?raw';
import lab4p2 from '../assets/aps105/lab4part2.c?raw';
import lab5 from '../assets/aps105/lab5.c?raw';
import lab6p1 from '../assets/aps105/lab6part1.c?raw';
import lab6p2 from '../assets/aps105/lab6part2.c?raw';
import lab7reversiC from '../assets/aps105/lab7-reversi.c?raw';
import lab7reversiH from '../assets/aps105/lab7-reversi.h?raw';
import lab8p1C from '../assets/aps105/lab8part1.c?raw';
import lab8p1H from '../assets/aps105/lab8part1.h?raw';
import lab8p2C from '../assets/aps105/lab8part2.c?raw';
import lab8p2H from '../assets/aps105/lab8part2.h?raw';
import lab8p2LibH from '../assets/aps105/liblab8part2.h?raw';
import lab9 from '../assets/aps105/lab9.c?raw';

export type LabFile = { name: string; code: string; readonly?: boolean };
export type LabProgram = {
  id: string;
  title: string;
  files: LabFile[];
  stdin: string;
  runnable?: boolean; // false for a library submission with no standalone main
  note?: string; // shown instead of the runner when runnable === false
};
export type Lab = {
  id: string;
  title: string;
  objective: string;
  task?: string; // what the lab asked for and the goal
  approach?: string; // how I implemented it
  programs: LabProgram[];
};

const one = (id: string, title: string, name: string, code: string, stdin: string): LabProgram => ({
  id,
  title,
  files: [{ name, code }],
  stdin,
});

export const aps105Labs: Lab[] = [
  {
    id: 'lab0',
    title: 'Lab 0 — Setup',
    objective:
      'The warm-up: get a first C program building and running, and print to the console.',
    task: "Lab0 was the first warm-up for APS105. There was no formal handout, so the goal was just to get a C program compiling and running and to print some text to the screen. It doubles as a check that the setup and toolchain work.",
    approach: "I wrote a single main function that includes stdio.h and uses printf. I set an int variable i to 2025, then added one to it so it holds 2026. After that I print \"Happy new year\" on its own line, then print \"It's year %d\" with i filled in by the format specifier, and return 0.",
    programs: [one('lab0', 'Hello', 'lab0.c', lab0, '')],
  },
  {
    id: 'lab1',
    title: 'Lab 1 — Simple Calculations',
    objective:
      'Three small programs: the first prints basic messages, the next two read input with scanf and compute with printf.',
    task: "Lab 1 asked for three small C programs that all do input and output with scanf and printf. Part 1 just prints a fixed block of text about C escape sequences, Part 2 works out a car rental bill where one day in every four is free and then adds 13% HST, and Part 3 converts a distance in metres into whole yards, feet, inches plus a two-decimal leftover fraction of an inch. The goal was to practise basic printing, reading numbers, and simple arithmetic.",
    approach: "For Part 1 I used five printf lines with no input, escaping the quote, backslash and newline characters as \\\", \\\\ and \\n to print the message exactly. For Part 2 I read the daily rate and rental period as doubles with scanf, got the free days with the integer division rental_period / 4 stored in an int, then charged for (period minus free days) times the daily rate times 1.13 for the tax, and printed the days with %d and the total with %.2lf. For Part 3 I read the metres as a double, divided by 0.0254 to get total inches, then peeled off whole yards with integer division by 36, whole feet from the remainder divided by 12, the leftover whole inches, and finally the fractional inch, printing all four values on one line with %d and %.2lf.",
    programs: [
      one('lab1p1', 'Part 1 — messages', 'lab1part1.c', lab1p1, ''),
      one('lab1p2', 'Part 2 — rental cost', 'lab1part2.c', lab1p2, '9.99\n5\n'),
      one('lab1p3', 'Part 3 — unit conversion', 'lab1part3.c', lab1p3, '26.2\n'),
    ],
  },
  {
    id: 'lab2',
    title: 'Lab 2 — More Complex Calculations',
    objective:
      'Three programs using the math library and decision/logic statements to perform each task.',
    task: "Lab 2 asked for three small C programs that use the math library and decision-making with scanf and printf. Part 1 uses the law of sines to find a triangle's third side and its other two angles from two sides and the included angle alpha. Part 2 decodes a 4-digit lock combination by swapping the first and fourth digits and taking the 9's complement of the middle two. Part 3 computes the electrostatic force between two charges with Coulomb's law, then prints it in nN, uN, mN, or N depending on how large it is.",
    approach: "For Part 1 I define PI as a macro and precompute degree-to-radian and radian-to-degree factors, read side A, side B, and alpha with scanf, convert alpha to radians, then get angle beta with asin((b*sin A)/a), get gamma as PI minus the other two angles, and get side C from the law of sines. I convert the angles back to degrees and print everything with %.2lf. For Part 2 I read the code as one integer with scanf, pull out each digit using % 10 and integer division by 10, 100, and 1000, then rebuild the real number as d(9-b)(9-c)a with place-value multiplication. For Part 3 I read both charges and their unit letters in a single scanf format string (\"%lf%c%c %lf%c%c\"), check whether each unit char is 'n' or 'u' to scale the charge to Coulombs, compute F = k*fabs(q1*q2)/(r*r), then use an if / else-if cascade comparing F against 1e-6, 1e-3, and 1 to pick the right unit, rescale F, and print it.",
    programs: [
      one('lab2p1', 'Part 1 — triangle', 'lab2part1.c', lab2p1, '3\n4\n90\n'),
      one('lab2p2', 'Part 2 — code', 'lab2part2.c', lab2p2, '2\n'),
      one('lab2p3', 'Part 3 — quantities', 'lab2part3.c', lab2p3, '2.5kg + 1.5kg\n3\n'),
    ],
  },
  {
    id: 'lab3',
    title: 'Lab 3 — Decisions and Simple Loops',
    objective: 'Three programs practising branching and counting/accumulating loops.',
    task: "Lab 3 asked for three small C programs that practise decisions and simple loops. Part 1 reads an observed boiling point and a user threshold, then names the substance (water, mercury, copper, silver, or gold) if the reading is within the threshold of that substance's known boiling point, or says the substance is unknown. Part 2 finds the angle at which a robot throwing a ball at 20 m/s from a height of 2 m should shoot to hit a rim, given a horizontal distance and target height that must be validated. Part 3 simulates an ATM that takes a dollar amount that must be a multiple of 5 and breaks it into the fewest 100, 50, 20, 10, and 5 bills.",
    approach: "In part 1 I read the threshold and boiling point as ints, worked out boiling+threshold and boiling-threshold, and used an if / else-if chain where each branch checks that a substance's boiling point sits between those two bounds, which is the same as the reading being within the threshold, falling through to \"Substance unknown.\" otherwise. In part 2 I set l, v, and g as doubles, validated each input with an if that does nothing when the value is in range and a do-while that re-prompts when it is not, then looped alpha from 0 to 90 by one degree, converting to radians to compute v_x, v_y, the travel time d/v_x, and the height y, and used fabs from math.h to break when y is within 0.3 of the target before printing the angle to two decimals. In part 3 I used a do-while with a continue that re-prompts until the amount is a multiple of 5, then did greedy integer division and subtraction down the denominations from 100 to 5, printing each count only when it is non-zero.",
    programs: [
      one('lab3p1', 'Part 1', 'lab3part1.c', lab3p1, '80\n100\n'),
      one('lab3p2', 'Part 2', 'lab3part2.c', lab3p2, '10\n20\n5\n8\n'),
      one('lab3p3', 'Part 3', 'lab3part3.c', lab3p3, '285\n'),
    ],
  },
  {
    id: 'lab4',
    title: 'Lab 4 — Loops and Functions',
    objective:
      'A Monte Carlo estimate of the probability a random point lands in a safe zone, and a count of numbers with three or more sevens.',
    task: "Lab 4 asked for two C programs that practise loops and functions. Part 1 uses a Monte Carlo simulation to estimate the probability that a randomly thrown point lands inside a safe zone, running for however many iterations the user enters. Part 2 reads a stream of integers, stopping at 0, and counts how many of them are pretty, meaning they contain three or more 7 digits.",
    approach: "For Part 1 I wrote a randDouble helper that turns rand() into a double between -1 and 1, and an inSafeZone helper that returns true when x squared plus y squared is at most 1, so the safe zone is the unit circle inside the square. I seeded with srand(67) so the run is repeatable, looped the requested number of times generating an x and y and counting the hits, then divided hits by total, which comes out near pi over four. For Part 2 I wrote a prettyCheck function that peels off each digit with % 10 and / 10, counts the 7s, and returns 1 as soon as it reaches three. The main function loops with a while, reads an integer each pass, breaks on 0, and adds to a running total whenever a number is pretty.",
    programs: [
      one('lab4p1', 'Part 1 — Monte Carlo', 'lab4part1.c', lab4p1, '100000\n'),
      one('lab4p2', 'Part 2 — counting sevens', 'lab4part2.c', lab4p2, '1777\n88\n7777\n0\n'),
    ],
  },
  {
    id: 'lab5',
    title: 'Lab 5 — Elementary Cellular Automaton',
    objective:
      'Evolve a one-dimensional cellular automaton: given a starting live cell, a rule number, and a generation count, print each generation.',
    task: "The lab asked for a C program that simulates an Elementary Cellular Automaton, like the famous Rule 30, on a fixed row of 17 cells that are each dead (0) or alive (1). It reads three integers from the user (the index of the single starting alive cell, a rule number from 0 to 255, and the number of generations), then prints each generation on its own line using an asterisk for an alive cell and a blank space for a dead one. The point was to practise arrays, the binary representation of numbers, and handling the array edges, here using the fixed boundary condition where cells past the ends count as 0.",
    approach: "I split the work across the five suggested functions. initializeArray sets all 17 slots to 0 with a loop and then puts a 1 at the alive index, and printArray walks the array printing \"*\" for a 1 and \" \" otherwise. getRuleOutcome turns the left, center, right triplet into a number with left*4 + center*2 + right, unpacks the rule into an 8-element int array using the rule % 2 and rule /= 2 loop, and returns that bit. calculateNextState loops over every cell, reads the left and right neighbours but forces them to 0 at the two edges for the fixed boundary, and calls getRuleOutcome into a next array. simulateGenerations prints the current row, computes the next one, copies it back over the current array, and repeats for the given number of iterations, with main doing the scanf and kicking it off.",
    programs: [one('lab5', 'Automaton', 'lab5.c', lab5, '5 90 16\n')],
  },
  {
    id: 'lab6',
    title: 'Lab 6 — Connect Four',
    objective:
      'Implement Connect Four on a 6×7 grid: players drop pieces into columns and the program detects four in a row.',
    task: "Lab 6 asked me to implement Connect Four in C on a 6 by 7 grid, where two players take turns dropping a piece into a column and it falls to the lowest free row. Part 1 builds the board, the dropping, and the turn-taking, ending when a player enters a negative column. Part 2 adds the win condition, announcing the winner as soon as one player connects four pieces in a row, column, or diagonal.",
    approach: "I kept the board as a 2-D char array with named HEIGHT, WIDTH, P1 and P2 constants, and split the work into helpers: clearBoard fills it with dashes, printBoard draws it with a column header, getPlayerColumnChoice reads a column, and makeMove walks up that column to drop the piece into the lowest empty row. The main loop prints the board, takes a move, switches the current player between P1 and P2, and breaks when the column entered is negative. For Part 2 I added checkPosition, which looks outward from a placed piece horizontally, vertically, and along both diagonals for four in a row, and checkForWin, which scans the board so the main loop can print the winner and stop.",
    programs: [
      one('lab6p1', 'Part 1', 'lab6part1.c', lab6p1, '3\n2\n3\n2\n-1\n'),
      one('lab6p2', 'Part 2', 'lab6part2.c', lab6p2, '3\n2\n3\n2\n3\n2\n3\n'),
    ],
  },
  {
    id: 'lab7',
    title: 'Lab 7 — Reversi: Board & Legality',
    objective:
      'Set up a Reversi (Othello) board with 2-D arrays and check whether moves are legal.',
    task: "Lab 7 was the first half of a two-lab Reversi (Othello) project in C. It asked for a program that reads a board size n (even, at most 26), sets up an n by n board as a static 2-D array with the four starting tiles in the centre, prints it, then reads a mid-game board configuration line by line until \"!!!\". After that it had to list the available moves for White and then Black in row-then-column order, read one move, say whether it was legal, and if so play it by flipping the captured tiles before printing the final board. The handout required three specific helper functions: printBoard, positionInBounds, and checkLegalInDirection.",
    approach: "I stored the board as a static char board[26][26] and filled it with 'U' in clearBoard before placing the four centre tiles using n/2 to find the middle. printBoard prints the column letters with 'a' + col, then each row with its own letter and the U/B/W characters. The core check is checkLegalInDirection, which steps one square by (deltaRow, deltaCol): the first neighbour must be the opponent's colour, then I keep stepping while positionInBounds holds, returning false if I hit a 'U' and true if I reach my own colour. I wrote checkMOVE to call that in all eight directions with two loops over dr and dc from -1 to 1, skipping (0,0), and availableMoves scans every cell in row-major order and prints the legal ones. makeMove records which directions were legal in a 3x3 bool array, drops the tile, then calls flip to walk each legal direction and turn the opponent's tiles over. In main I read n and the moves with scanf, and used character arithmetic like config[1] - 'a' to turn the row and column letters into array indices.",
    programs: [
      {
        id: 'lab7',
        title: 'Reversi',
        files: [
          { name: 'reversi.c', code: lab7reversiC },
          { name: 'reversi.h', code: lab7reversiH, readonly: true },
        ],
        stdin: '8\nWdd\nBde\nBed\nWee\n!!!\nBdc\n',
      },
    ],
  },
  {
    id: 'lab8',
    title: 'Lab 8 — Reversi: Game-Playing',
    objective:
      'Build on Lab 7 to play Reversi against a human: part 1 uses a specified move algorithm; part 2 is your own.',
    task: "The lab asked me to build on my Lab 7 board code and finish a real Reversi game where a human plays against the computer on an n by n board (n even, from 4 to 26), asking for the dimensions and which colour the computer is, with Black moving first and the board printed after every move. In Part 1 the computer's strategy was fixed for me: for each legal square, work out a score equal to the number of opponent tiles that move would flip, play the highest-scoring square, and break ties by lowest row then lowest column, while also handling skipped turns, wins, draws, and an illegal human move that ends the game. In Part 2 I had to write my own stronger move-picker inside a makeMove function that returns within one second and can beat the staff \"smarter\" and \"smartest\" reference programs.",
    approach: "For Part 1 I reused my Lab 7 helpers on a 26x26 2-D char array of 'U', 'B', and 'W': clearBoard places the four centre tiles, checkLegalInDirection walks one of the eight directions, checkMOVE tests all eight, and doMove lays a tile then flips each valid line. The prescribed computer move is greedy: countFlipsInDirection and moveScore add up how many tiles a square would flip, and chooseComputerMove scans in row-major order keeping the highest score with a strict greater-than so ties keep the earlier square; my main runs two validation loops for the dimension and colour, starts Black, and loops until the board is full, both players are stuck, or the human enters an illegal move. For Part 2 I kept the same helpers but added const copies (constCheckMOVE, constPlayerHasMove, countAvailableMoves) so I would not modify the const board, and wrote makeMove as recursive minimax with alpha-beta pruning to a fixed depth of four. It copies the board with copyBoard, applies each candidate move with doMove on the copy, and scores leaf boards with evaluateBoard, a weighted sum of piece difference, corner difference, and mobility difference; at the root I also add a positionScore that rewards corners and edges and penalises the X and C squares next to empty corners, plus totalFlips, and the main function is commented out as the handout required for grading.",
    programs: [
      {
        id: 'lab8p1',
        title: 'Part 1 — specified AI',
        files: [
          { name: 'lab8part1.c', code: lab8p1C },
          { name: 'lab8part1.h', code: lab8p1H, readonly: true },
        ],
        stdin: '8\nW\n',
      },
      {
        id: 'lab8p2',
        title: 'Part 2 — your AI',
        files: [
          { name: 'lab8part2.c', code: lab8p2C },
          { name: 'lab8part2.h', code: lab8p2H, readonly: true },
          { name: 'liblab8part2.h', code: lab8p2LibH, readonly: true },
        ],
        stdin: '',
        runnable: false,
        note: "Part 2 is a library of move-picking functions (a minimax makeMove, findSmarterMove, findSmartestMove) that plugs into the course's Reversi driver, so there is no standalone program to run here. The code is below to read; Part 1 above is the playable game.",
      },
    ],
  },
  {
    id: 'lab9',
    title: 'Lab 9 — Hospital ER Triage',
    objective:
      'Manage an ER queue with a dynamically-allocated singly linked list, prioritizing patients by severity then arrival order.',
    task: "The lab asked me to build a hospital emergency room triage queue in C using a dynamically allocated singly linked list. Patients each have a unique ID, a name, and a severity level, and the list has to stay sorted so higher severity sits closer to the head while patients with equal severity keep their arrival order. The program reads single-letter commands from input and runs the matching operation: A adds a patient, T treats (removes) the one at the front, R removes a patient by ID, D displays the whole queue, and Q frees all the memory and exits.",
    approach: "I defined a Patient struct holding the id, a name[100] char array, a severity int, and a next pointer, plus a small Queue struct that just holds the head pointer. For adding, I first walk the list with an idExists helper to reject duplicate IDs, then malloc a new node in createPatient and do a sorted insert: I put it at the head if the list is empty or its severity beats the head, otherwise I walk with a current pointer while the next node's severity is greater than or equal to the new one, which keeps equal-severity patients in arrival order. Treat just unlinks and frees the head, remove uses a current-and-prev pointer walk to unlink the matching ID and free it, display loops printing each name and severity, and Q calls freeQueue to walk the list freeing every node. The main function uses a while(1) loop with scanf(\" %c\", &command) and an if/else-if chain to dispatch each command.",
    programs: [one('lab9', 'Triage', 'lab9.c', lab9, 'A 101 Jane 1\nA 201 Mary 2\nA 301 John 4\nD\nT\nQ\n')],
  },
];
