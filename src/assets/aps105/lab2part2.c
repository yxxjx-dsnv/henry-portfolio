#include <stdio.h>
#include <math.h>

int main(void)
{
    int code, codea, codeb, codec, coded, realcode;

    // code: abcd -> d(9-b)(9-c)a

    printf("Enter an encrypted 4-digit combination: ");
    scanf("%d", &code); // 8021

    coded = code % 10;          // least-significant digit
    codec = (code / 10) % 10;   // middle rigt digit
    codeb = (code / 100) % 10;  // middle left digit
    codea = (code / 1000) % 10; // most significant

    realcode = (coded * 1000) + ((9 - codeb) * 100) + ((9 - codec) * 10) + codea;

    printf("The real combination is: %d\n", realcode); // 1978

    return 0;
}
