#include <stdio.h>


/*
Substance	Normal boiling point
Water	100
Mercury	357
Copper	1187
Silver	2193
Gold	2660
*/

int main(void) {
  int threshold, boilding, total_plus, total_minus;

  printf("Enter the threshold in Celsius: ");
  scanf("%d", &threshold);  // 10
  printf("Enter the observed boiling point in Celsius: ");
  scanf("%d", &boilding);  // 2668

  total_plus = boilding + threshold;   // 2678
  total_minus = boilding - threshold;  // 2658

  if (total_plus >= 100 && total_minus <= 100) {
    printf("The substance you tested is: Water\n");
  } else if (total_plus >= 357 && total_minus <= 357) {
    printf("The substance you tested is: Mercury\n");
  } else if (total_plus >= 1187 && total_minus <= 1187) {
    printf("The substance you tested is: Copper\n");
  } else if (total_plus >= 2193 && total_minus <= 2193) {
    printf("The substance you tested is: Silver\n");
  } else if (total_plus >= 2660 && total_minus <= 2660) {
    printf("The substance you tested is: Gold\n");
  } else {
    printf("Substance unknown.\n");
  }

  return 0;
}
