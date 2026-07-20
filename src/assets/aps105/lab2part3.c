#include <math.h>
#include <stdio.h>

// F = k * (abs|q_1 * q_2|) / r^2 <-Coublomb's Law
// k = 8.9875e9 N*m"^2/C^2
// u: micro = e-6
// n: nano = e-9

int main(void) {
  double r, F, q_1, q_2;
  char si1, si2, c1, c2;
  const double k = 8.9875e9;
  const double m = 1e-3;
  const double u = 1e-6;
  const double n = 1e-9;

  printf("Enter the value of the two charges separated by a space: ");
  scanf("%lf%c%c %lf%c%c", &q_1, &si1, &c1, &q_2, &si2,
        &c2);  // 2nC 3uC [or] 3.2nC -7.2nC [or] 10uC 200uC

  printf("Enter distance between charges in metres: ");
  scanf("%lf", &r);  // 2 [or] 13.78 [or] 0.9

  if (si1 == 'n') {
    q_1 = q_1 * n;
  } else {
    q_1 = q_1 * u;
  }

  if (si2 == 'n') {
    q_2 = q_2 * n;
  } else {
    q_2 = q_2 * u;
  }

  F = ((k)*fabs((q_1) * (q_2))) /
      (r * r);  // 0.00001348 ... = 13.48 e-6 or 1348 e-9

  if (F < u) {  // F(=0.000 013 480) < 1e-6 = 0.000 001
    F = F / n;
    printf("The force between charges is %.2lfnN (less than 1uN)\n", F);
  } else if (F < m) {  // F(=0.000 013 480) < 1e-3 = 0.001
    F = F / u;
    printf("The force between charges is %.2lfuN (less than 1mN)\n", F);
  } else if (F < 1) {  // F(=0.00 013 480) < 1
    F = F / m;
    printf("The force between charges is %.2lfmN (less than 1N)\n", F);
  } else {  // F(=0.000 013 480) >= 1
    printf("The force between charges is %.2lfN (1N or greater)\n", F);
  }

  return 0;
}
