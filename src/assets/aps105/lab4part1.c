#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

double randDouble() {
  return (2.0 * ((double)rand() / ((double)RAND_MAX + 1)) - 1.0);
}
// rand / randmax @ seed 67 = 2147483647 + 1 ==> [0,1)
// 2 * [0,1) --> [0,2) -1 --> [-1,1)

bool inSafeZone(double x, double y) {
    return ((x*x) + (y*y) <= 1);
}

int main(void) {
    int i, safe = 0, numberIteration;
    double x, y, probability;
    srand(67);

    printf("Number of Monte Carlo iterations: ");
    scanf("%d",&numberIteration); // 10

    for(i = 0; i != numberIteration; i++) {
        x = randDouble();
        y = randDouble();

        if (inSafeZone(x,y)) {
            safe ++;
        }
    }

    probability = (double)safe / (double)numberIteration;


//probability = Area of safe zone / Area of landing area
//Probability = Number of points falling in the safe zone / Total number of points generated

    printf("\nProbability of safe landing: %.4lf\n", probability); // 1.000
    return 0;
}
