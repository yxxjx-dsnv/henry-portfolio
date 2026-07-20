#include <stdio.h>
#include <math.h>

#define PI 3.14159265

int main(void)
{
    double sideA;
    double sideB;
    double sideC;
    double angleA;
    double angleB;
    double angleC;
    double dtr = PI / 180; // degree to radian
    double rtd = 180 / PI; // radian to degree

    // sine law: (a/sinA) = (b/sinB) = (c/sinC)
    // given: a,b,A
    // not given: c,B,C

    // to get B: B = asin((b*sinA)/a)
    // to get C: C = asin((c*sinA)/a)
    // to get c: c = ((a*sinC)/sinA)

    printf("Enter the length of side A: ");
    scanf("%lf", &sideA); // 3

    printf("Enter the length of side B: ");
    scanf("%lf", &sideB); // 2

    printf("Enter the measure of angle alpha in degrees: ");
    scanf("%lf", &angleA); // 30

    angleA = angleA * dtr; // convert to rad: now angleA is 30 * (PI/180) = 0.52 rad

    angleB = asin((sideB * sin(angleA) / sideA)); // it's rad
    angleC = (PI - angleA - angleB);
    // angleC = asin((sideC * sin(angleA) / sideA)); //it's rad
    sideC = (sideA * sin(angleC)) / sin(angleA);

    angleA = angleA * rtd;
    angleB = angleB * rtd;
    angleC = angleC * rtd;

    printf("\n");
    printf("Results:\n");
    printf("Side A: %.2lf\n", sideA);               // 3.00
    printf("Side B: %.2lf\n", sideB);               // 2.00
    printf("Side C: %.2lf\n", sideC);               // 4.56
    printf("Angle Alpha: %.2lf degrees\n", angleA); // 30.00 degrees
    printf("Angle Beta: %.2lf degrees\n", angleB);  // 19.47 degrees
    printf("Angle Gamma: %.2lf degrees\n", angleC); // 130.53 degrees

    return 0;
}
