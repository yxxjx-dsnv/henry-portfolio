#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/*
 *  constant ball speed = 20 m/s
 *  constant gravity = 9.81 m/s^2
 *  robot height = 2 m
 *  rim height can be vary with range of 3 ~ 6 m
 *  distance between robot and stand can be vary with range of 3 ~ 30 m
 */

// y = l(=2) + v_y,0 * t - 0.5*g*t^2
// v_x = v * cos(alpha)
// v_y = v * sin(alpha)
// t_travel = d / v_x = d / v * cos(alpha)

int main(void) {
  double l = 2, v = 20, g = 9.81;  // robot height = 2 m, speed of ball = 20
                                   // m/s, gravity = 9.81 m/s^2
  double horizontal_d, target_h, alpha, v_x, v_y, t_travel, y;
  const double PI = 3.14159265;

  printf(
      "Please enter the horizontal distance from the wall between 3 and 30 "
      "m:\n");
  scanf("%lf", &horizontal_d);  // 3 ~ 30 m , if it's over. Ask the value again.

  if (horizontal_d >= 3 && horizontal_d <= 30) {
    ;
  } else {
    do {
      printf(
          "Please enter the horizontal distance from the wall between 3 and 30 "
          "m:\n");
      scanf("%lf", &horizontal_d);
    } while (horizontal_d < 3 || horizontal_d > 30);
  }

  printf("Please enter the target height between 3 and 6 m:\n");
  scanf("%lf", &target_h);  // 3 ~ 6 m , if it's over. Ask the value again.

  if (target_h >= 3 && target_h <= 6) {
    ;
  } else {
    do {
      printf("Please enter the target height between 3 and 6 m:\n");
      scanf("%lf", &target_h);
    } while (target_h < 3 || target_h > 6);
  }

  for (alpha = 0; alpha <= 90; ++alpha) {
    alpha = alpha * (PI / 180);
    v_y = v * sin(alpha);
    v_x = v * cos(alpha);
    t_travel = horizontal_d / v_x;
    y = l + (v_y * t_travel) - (0.5 * g * pow(t_travel, 2));
    alpha = alpha * (180 / PI);

    if (fabs(y - target_h) <= 0.3) {
      break;
    }
  }

  printf("The angle should be %.2lf\n", alpha);

  return 0;
}
