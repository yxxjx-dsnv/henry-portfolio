#include <stdio.h>
#include <stdlib.h>
#define ARRAY_SIZE 17

// Elementary Cellular Automaton (ECA), such as the famous Rule 30 automaton.

// decimal 30 -> binary 00011110 : b7:0 b6:0 ... b1:1 b0:0

/*
111 -> b7 = 0 , which means that if the left, center, and right cells are all
alive, the center cell becomes dead (0) in the next generation. 

110 -> b6 = 0 , which means that if the left and center cells are alive, but the right cell is
dead, the center cell becomes dead (0) in the next generation. 

101 -> b5 = 0 , which means that if the left and right cell are alive, but the center cell is
dead, the center cell becomes dead (0) in the next generation. 

100 -> b4 = 1 , which means that if the left cell is alive and the center and right cells are
dead, the center cell becomes alive (1) in the next generation. 

011 -> b3 = 1 , which means that if the center and right cells are alive, but the left cell is
dead, the center cell becomes alive (1) in the next generation. 

010 -> b2 = 1 , which means that if the center cell is alive, but the left and right cells are
dead, the center cell becomes alive (1) in the next generation. 

001 -> b1 = 1 , which means that if the right cell is alive, but the left and center cells are
dead, the center cell becomes alive (1) in the next generation. 

000 -> b0 = 0 , which means that if all cells are dead, the center cell becomes dead (0) in the
next generation.
*/

void printArray(int array[]) {
  for (int i = 0; i < ARRAY_SIZE; i++) {
    if (array[i] == 1) {
      printf("*");
    } else {
      printf(" ");
    }
  }
  printf("\n");
}

void initializeArray(int aliveIndex, int array[]) {
  for (int i = 0; i < ARRAY_SIZE; i++) {
    array[i] = 0;
  }
  array[aliveIndex] = 1;
}

// L, C, R are each 0(dead) or 1(alive)
// index = left*4 + center*2 + right  (000=b0, 001=b1, 010=b2, 011=b3, 100=b4,
// 101=b5, 110=b6, 111=b7)
int getRuleOutcome(int rule, int left, int center, int right) {
  int decimal = left * 4 + center * 2 + right;  // LCR to decimal

  int bin[8] = {0};//it's initializing to 0 for all col  // rule to binary 
  for (int i = 0; i <= 7; i++) {
    bin[i] = rule % 2;
    rule /= 2; //rule = rule / 2
  }
  return bin[decimal];  // 1 or 0
}

void calculateNextState(int currentArray[], int nextArray[], int rule) {
  for (int i = 0; i < ARRAY_SIZE; i++) {
    int left = 0;
    if (i > 0) {
      left = currentArray[i - 1];
    }

    int center = currentArray[i];

    int right = 0;
    if (i < ARRAY_SIZE - 1) {
      right = currentArray[i + 1];
    }

    nextArray[i] = getRuleOutcome(rule, left, center, right);
  }
}

void simulateGenerations(int iterations, int array[], int rule) {
  int nextArray[ARRAY_SIZE];

  for (int j = 0; j < iterations; j++) {
    printArray(array);
    calculateNextState(array, nextArray, rule);

    // copy next to current
    for (int i = 0; i < ARRAY_SIZE; i++) {
      array[i] = nextArray[i];
    }
  }
}

int main(void) {
  int aliveIndex, rule, iterations, array[ARRAY_SIZE];

  printf("Enter input: ");
  scanf("%d %d %d", &aliveIndex, &rule, &iterations);

  initializeArray(aliveIndex, array);
  simulateGenerations(iterations, array, rule);

  return 0;
}
