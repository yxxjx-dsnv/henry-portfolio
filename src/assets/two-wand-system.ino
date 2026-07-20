#include <Wire.h>

// Fresh two-wand system for:
// - Arduino Uno/Nano
// - TCA9548A I2C multiplexer at 0x70
// - Two KX13x accelerometer wands
//
// Main wiring:
// Arduino SDA/A4 -> mux SDA
// Arduino SCL/A5 -> mux SCL
// Arduino GND    -> mux GND
// Arduino 3.3V or 5V -> mux VCC (match your board)
//
// Wand wiring:
// mux channel 0 (SD0/SC0) -> Wand 1 SDA/SCL
// mux channel 1 (SD1/SC1) -> Wand 2 SDA/SCL
//
// LED wiring:
// D10 -> resistor -> Wand 1 LED -> GND
// D11 -> resistor -> Wand 2 LED -> GND

const uint8_t NUM_WANDS = 2;
const uint8_t MUX_ADDR_MIN = 0x70;
const uint8_t MUX_ADDR_MAX = 0x77;
const uint8_t WAND_CHANNELS[NUM_WANDS] = {0, 1};
const uint8_t LED_PINS[NUM_WANDS] = {10, 11};
const uint8_t BUZZER_PIN = 6;
const uint8_t SENSOR_ADDRS[] = {0x1E, 0x1F};

const uint8_t REG_XOUT_L = 0x08;
const uint8_t REG_COTR = 0x12;
const uint8_t REG_WHO_AM_I = 0x13;
const uint8_t REG_CNTL1 = 0x1B;
const uint8_t REG_CNTL2 = 0x1C;

const uint8_t WHO_AM_I_KX132 = 0x3D;
const uint8_t WHO_AM_I_KX134 = 0x46;
const uint8_t EXPECTED_COTR = 0x55;

const float COUNTS_PER_G_16G = 2048.0f;
const unsigned long SAMPLE_TIME_MS = 300;
const float SPEED_THRESHOLD = 10.0f;
const uint8_t LED_BRIGHTNESS = 255;
const unsigned int BUZZER_FREQUENCY = 1500;
const uint8_t MUX_DETECT_RETRIES = 10;
const unsigned long MUX_DETECT_RETRY_DELAY_MS = 250;

struct WandState {
  bool connected = false;
  uint8_t channel = 0;
  uint8_t ledPin = 0;
  uint8_t sensorAddress = 0;
  uint8_t whoAmI = 0;
  float sx = 0.0f;
  float sy = 0.0f;
  float sz = 0.0f;
  float sxPrior = 0.0f;
  float syPrior = 0.0f;
  float szPrior = 0.0f;
  float vx = 0.0f;
  float vy = 0.0f;
  float vz = 0.0f;
  float vxPrior = 0.0f;
  float vyPrior = 0.0f;
  float vzPrior = 0.0f;
  float ax = 0.0f;
  float ay = 0.0f;
  float az = 0.0f;
  float a = 0.0f;
};

WandState wands[NUM_WANDS];
uint8_t muxAddress = 0;

void printHexByte(uint8_t value) {
  Serial.print("0x");
  if (value < 16) {
    Serial.print('0');
  }
  Serial.print(value, HEX);
}

bool muxExists() {
  if (muxAddress == 0) {
    return false;
  }

  Wire.beginTransmission(muxAddress);
  return Wire.endTransmission() == 0;
}

bool detectMuxAddress() {
  for (uint8_t address = MUX_ADDR_MIN; address <= MUX_ADDR_MAX; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      muxAddress = address;
      return true;
    }
  }

  muxAddress = 0;
  return false;
}

bool detectMuxAddressWithRetries() {
  for (uint8_t attempt = 1; attempt <= MUX_DETECT_RETRIES; ++attempt) {
    if (detectMuxAddress()) {
      Serial.print("Mux detected on attempt ");
      Serial.print(attempt);
      Serial.print(" at ");
      printHexByte(muxAddress);
      Serial.println();
      return true;
    }

    delay(MUX_DETECT_RETRY_DELAY_MS);
  }

  return false;
}

void scanMainI2CBus() {
  bool foundAny = false;

  Serial.println("Main I2C scan:");
  for (uint8_t address = 0x08; address <= 0x77; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.print("  Found device at ");
      printHexByte(address);
      Serial.println();
      foundAny = true;
    }
  }

  if (!foundAny) {
    Serial.println("  No devices found on the main bus.");
  }
}

bool selectMuxChannel(uint8_t channel) {
  if (muxAddress == 0) {
    return false;
  }

  Wire.beginTransmission(muxAddress);
  Wire.write(1 << channel);
  return Wire.endTransmission() == 0;
}

void disableMuxChannels() {
  if (muxAddress == 0) {
    return;
  }

  Wire.beginTransmission(muxAddress);
  Wire.write(0x00);
  Wire.endTransmission();
}

bool readSensorBytes(uint8_t channel, uint8_t address, uint8_t startReg, uint8_t *buffer, uint8_t len) {
  if (!selectMuxChannel(channel)) {
    return false;
  }

  Wire.beginTransmission(address);
  Wire.write(startReg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(address, len) != len) {
    return false;
  }

  for (uint8_t i = 0; i < len; ++i) {
    buffer[i] = Wire.read();
  }

  return true;
}

bool readSensorReg(uint8_t channel, uint8_t address, uint8_t reg, uint8_t &value) {
  return readSensorBytes(channel, address, reg, &value, 1);
}

bool writeSensorReg(uint8_t channel, uint8_t address, uint8_t reg, uint8_t value) {
  if (!selectMuxChannel(channel)) {
    return false;
  }

  Wire.beginTransmission(address);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool isExpectedWhoAmI(uint8_t value) {
  return value == WHO_AM_I_KX132 || value == WHO_AM_I_KX134;
}

bool findSensorOnChannel(uint8_t channel, uint8_t &foundAddress, uint8_t &foundWhoAmI) {
  for (uint8_t i = 0; i < sizeof(SENSOR_ADDRS); ++i) {
    uint8_t whoAmI = 0;
    if (!readSensorReg(channel, SENSOR_ADDRS[i], REG_WHO_AM_I, whoAmI)) {
      continue;
    }

    if (!isExpectedWhoAmI(whoAmI)) {
      continue;
    }

    foundAddress = SENSOR_ADDRS[i];
    foundWhoAmI = whoAmI;
    return true;
  }

  return false;
}

bool initWand(uint8_t wandIndex) {
  WandState &wand = wands[wandIndex];
  uint8_t address = 0;
  uint8_t whoAmI = 0;

  if (!findSensorOnChannel(wand.channel, address, whoAmI)) {
    return false;
  }

  if (!writeSensorReg(wand.channel, address, REG_CNTL1, 0x00)) {
    return false;
  }
  delay(10);

  if (!writeSensorReg(wand.channel, address, REG_CNTL2, 0x80)) {
    return false;
  }
  delay(50);

  uint8_t cotr = 0;
  if (!readSensorReg(wand.channel, address, REG_COTR, cotr)) {
    return false;
  }

  if (cotr != EXPECTED_COTR) {
    return false;
  }

  if (!writeSensorReg(wand.channel, address, REG_CNTL1, 0x00)) {
    return false;
  }
  delay(10);

  if (!writeSensorReg(wand.channel, address, REG_CNTL1, 0xC0)) {
    return false;
  }
  delay(20);

  wand.connected = true;
  wand.sensorAddress = address;
  wand.whoAmI = whoAmI;
  wand.sxPrior = 0.0f;
  wand.syPrior = 0.0f;
  wand.szPrior = 0.0f;
  wand.vx = 0.0f;
  wand.vy = 0.0f;
  wand.vz = 0.0f;
  wand.vxPrior = 0.0f;
  wand.vyPrior = 0.0f;
  wand.vzPrior = 0.0f;
  return true;
}

bool readAccelerationG(uint8_t wandIndex, float &sx, float &sy, float &sz) {
  WandState &wand = wands[wandIndex];
  if (!wand.connected) {
    return false;
  }

  uint8_t raw[6];
  if (!readSensorBytes(wand.channel, wand.sensorAddress, REG_XOUT_L, raw, sizeof(raw))) {
    return false;
  }

  int16_t xCounts = (static_cast<int16_t>(raw[1]) << 8) | raw[0];
  int16_t yCounts = (static_cast<int16_t>(raw[3]) << 8) | raw[2];
  int16_t zCounts = (static_cast<int16_t>(raw[5]) << 8) | raw[4];

  sx = xCounts / COUNTS_PER_G_16G;
  sy = yCounts / COUNTS_PER_G_16G;
  sz = zCounts / COUNTS_PER_G_16G;
  return true;
}

void printSetupSummary() {
  Serial.println("=== Fresh Two Wand Setup ===");

  if (!muxExists()) {
    Serial.print("Mux not found from ");
    printHexByte(MUX_ADDR_MIN);
    Serial.print(" to ");
    printHexByte(MUX_ADDR_MAX);
    Serial.println();
    return;
  }

  Serial.print("Mux found at ");
  printHexByte(muxAddress);
  Serial.println();

  for (uint8_t i = 0; i < NUM_WANDS; ++i) {
    Serial.print("Wand ");
    Serial.print(i + 1);
    Serial.print(" | channel ");
    Serial.print(wands[i].channel);
    Serial.print(" | LED D");
    Serial.print(wands[i].ledPin);
    Serial.print(" | ");

    if (!wands[i].connected) {
      Serial.println("not found");
      continue;
    }

    Serial.print("addr ");
    printHexByte(wands[i].sensorAddress);
    Serial.print(" | WHO_AM_I ");
    printHexByte(wands[i].whoAmI);
    Serial.println();
  }
}

void printHeader() {
  Serial.println("W1_SX\tW1_SY\tW1_SZ\tW1_VX\tW1_VY\tW1_VZ\tW1_V\tW1_AX\tW1_AY\tW1_AZ\tW1_A\tW2_SX\tW2_SY\tW2_SZ\tW2_VX\tW2_VY\tW2_VZ\tW2_V\tW2_AX\tW2_AY\tW2_AZ\tW2_A");
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  Wire.begin();
  Wire.setClock(100000);
  Wire.setWireTimeout(2000, true);

  scanMainI2CBus();
  detectMuxAddressWithRetries();

  for (uint8_t i = 0; i < NUM_WANDS; ++i) {
    wands[i] = WandState();
    wands[i].channel = WAND_CHANNELS[i];
    wands[i].ledPin = LED_PINS[i];
    pinMode(wands[i].ledPin, OUTPUT);
    analogWrite(wands[i].ledPin, 0);

    if (!initWand(i)) {
      wands[i].connected = false;
    }
  }

  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  disableMuxChannels();
  printSetupSummary();
  printHeader();
}

void loop() {

  //set sensor frequency
  const float dtSeconds = SAMPLE_TIME_MS / 1000.0f;

  for (uint8_t i = 0; i < NUM_WANDS; ++i) {
    WandState &wand = wands[i];

    if (!wand.connected) {
      Serial.print("NA\tNA\tNA\tNA\tNA\tNA\tNA\tNA\tNA\tNA\tNA");
      if (i < NUM_WANDS - 1) {
        Serial.print('\t');
      }
      continue;
    }

    float sx = 0.0f;
    float sy = 0.0f;
    float sz = 0.0f;

    if (!readAccelerationG(i, sx, sy, sz)) {
      wand.connected = false;
      analogWrite(wand.ledPin, 0);
      Serial.print("ERR\tERR\tERR\tERR\tERR\tERR\tERR\tERR\tERR\tERR\tERR");
      if (i < NUM_WANDS - 1) {
        Serial.print('\t');
      }
      continue;
    }

    wand.vxPrior = wand.vx;
    wand.vyPrior = wand.vy;
    wand.vzPrior = wand.vz;

    wand.vx = fabs(sx - wand.sxPrior) / dtSeconds;
    wand.vy = fabs(sy - wand.syPrior) / dtSeconds;
    wand.vz = fabs(sz - wand.szPrior) / dtSeconds;
    float v = sqrt((wand.vx * wand.vx) + (wand.vy * wand.vy) + (wand.vz * wand.vz));

    float ax = fabs(wand.vx - wand.vxPrior) / dtSeconds;
    float ay = fabs(wand.vy - wand.vyPrior) / dtSeconds;
    float az = fabs(wand.vz - wand.vzPrior) / dtSeconds;
    float a = sqrt((ax * ax) + (ay * ay) + (az * az));

    wand.sx = sx;
    wand.sy = sy;
    wand.sz = sz;
    wand.ax = ax;
    wand.ay = ay;
    wand.az = az;
    wand.a = a;

    wand.sxPrior = sx;
    wand.syPrior = sy;
    wand.szPrior = sz;

    Serial.print(sx, 3);
    Serial.print('\t');
    Serial.print(sy, 3);
    Serial.print('\t');
    Serial.print(sz, 3);
    Serial.print('\t');
    Serial.print(wand.vx, 3);
    Serial.print('\t');
    Serial.print(wand.vy, 3);
    Serial.print('\t');
    Serial.print(wand.vz, 3);
    Serial.print('\t');
    Serial.print(v, 3);
    Serial.print('\t');
    Serial.print(ax, 3);
    Serial.print('\t');
    Serial.print(ay, 3);
    Serial.print('\t');
    Serial.print(az, 3);
    Serial.print('\t');
    Serial.print(a, 3);

    if (i < NUM_WANDS - 1) {
      Serial.print('\t');
    }
  }

  float wand1a = wands[0].a;
  float wand2a = wands[1].a;

  Serial.print('\t');
  Serial.print(wand1a, 3);
  Serial.print('\t');
  Serial.print(wand2a, 3);

  static bool jeoperdy = false;
  static int turn = 0;

  float sensitivity =80.0f;

  if (wand1a > wand2a && wand1a > sensitivity && !jeoperdy && turn >= 2){
    analogWrite(wands[0].ledPin, LED_BRIGHTNESS);  // wand 1 ON
    analogWrite(wands[1].ledPin, 0);               // wand 2 OFF
    tone(BUZZER_PIN, BUZZER_FREQUENCY);
    jeoperdy = true;
    delay(1500);
    noTone(BUZZER_PIN);
  } else if (wand2a > wand1a && wand2a > sensitivity && !jeoperdy && turn >= 2){
    analogWrite(wands[0].ledPin, 0);                    // wand 1 ON
    analogWrite(wands[1].ledPin, LED_BRIGHTNESS);       // wand 2 OFF
    tone(BUZZER_PIN, BUZZER_FREQUENCY-500);
    jeoperdy = true;
    delay(1500);
    noTone(BUZZER_PIN);
  } else if (!jeoperdy && turn < 2) {
    analogWrite(wands[0].ledPin, 0);  // wand 1 ON
    analogWrite(wands[1].ledPin, 0);               // wand 2 OFF
    noTone(BUZZER_PIN);
    turn += 1;
  } else if (!jeoperdy) {
    analogWrite(wands[0].ledPin, 0);
    analogWrite(wands[1].ledPin, 0);
    noTone(BUZZER_PIN);
  }

  Serial.println();
  disableMuxChannels();
  delay(SAMPLE_TIME_MS);
}
