#include <stdio.h>

int main(void)
{
    double metres;
    int yards;
    int feet;
    double default_1_inch = 0.0254;
    double convert_to_inches;
    int inches;
    double inches_remainder;

    // 2.54 cm = 0.0254 m = 1 inch
    // 1 yard = 36 inches
    // 1 foot = 12 inches

    // 3.376 m = 132.91 inches = 3 yards(108 inches: 3 * 36 inches) + 2 feet (24 inches: 2 * 12 inches ) + 0 inches + 0.91 inches remainder

    printf("Please provide a distance in metres: ");
    scanf("%lf", &metres);

    convert_to_inches = metres / default_1_inch;    // inches = 3.376 / 0.0254 = 139.9134 ...
    yards = convert_to_inches / 36;                 // yards = 139.9134 ... / 36 = 3.88 = 3
    feet = (convert_to_inches - (yards * 36)) / 12; // feet = (139.9134 - (3 *36))/12 = 2
    inches = convert_to_inches - (yards * 36) - (feet * 12);
    inches_remainder = convert_to_inches - (yards * 36) - (feet * 12) - (inches);

    printf("\n");
    printf("%d yards, %d feet, %d inches, %.2lf inches remainder\n", yards, feet, inches, inches_remainder);

    return 0;
}
