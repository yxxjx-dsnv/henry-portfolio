#include <stdio.h>

int main(void)
{
    double daily_rate;
    double rental_period;
    int total_freeday;
    double total_charge;

    printf("Enter the daily rate:");
    scanf("%lf", &daily_rate);

    printf("Enter the rental period (in days):");
    scanf("%lf", &rental_period);

    total_freeday = rental_period / 4;
    total_charge = daily_rate * (rental_period - total_freeday) * 1.13;

    printf("\n");
    printf("Your total free day(s) in this rental is: %d\n", total_freeday);
    printf("Your total charge including taxes is: %.2lf\n", total_charge);

    return 0;
}
