#include <stdio.h>

int prettyCheck(int x) {
    int countSeven = 0;

    // negative value chagne to positive
    if (x < 0) {
      x = x *(-1);
    }

    while (x > 0) {
        int digit = x % 10; // 777 % 10 = 7 => digit
        if (digit == 7) { //digit = 7 so keep proceed
            countSeven++;
            if (countSeven >= 3) {
            return 1; //it return 1, which menas that's true
            }
        }
        x = x/10; // 777/10 = 77
    }
    return 0; 
  }

int main(void) {
    int input, i = 1;
    int prettyCount = 0;

    while (i != 0) {
        printf("Input an integer (0 to stop): ");
        scanf("%d", &input);
        
        if (input == 0) {
            break;
        }

        if (prettyCheck(input)) { //if prettyCheck Funcion return 1 (True), then add count 1
            prettyCount++;
        }
    }

    printf("You entered %d pretty number(s)!\n", prettyCount);
    return 0;
  }
