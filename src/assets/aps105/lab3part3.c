#include <stdio.h>

int main(void) {
  int amount, hundred = 0, fifty = 0, twenty = 0, ten = 0, five = 0;

  printf("Please enter an amount in dollars ($): ");
  scanf("%d", &amount);

  do {
    if (amount % 5 == 0) {
      continue;
      ;
    } else {
      printf("The amount should be a multiple of $5: ");
      scanf("%d", &amount);
    }
  } while (amount % 5 != 0);

  hundred = amount / 100;
  amount = amount - hundred * 100;

  fifty = amount / 50;
  amount = amount - fifty * 50;

  twenty = amount / 20;
  amount = amount - twenty * 20;

  ten = amount / 10;
  amount = amount - ten * 10;

  five = amount / 5;
  amount = amount - five * 5;

  if (hundred != 0) {
    printf("$100: %d\n", hundred);
  }
  if (fifty != 0) {
    printf("$50: %d\n", fifty);
  }
  if (twenty != 0) {
    printf("$20: %d\n", twenty);
  }
  if (ten != 0) {
    printf("$10: %d\n", ten);
  }
  if (five != 0) {
    printf("$5: %d\n", five);
  }

  return 0;
}
