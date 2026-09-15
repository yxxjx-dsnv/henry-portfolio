// Korean for the Gyroscope Wand page and the model viewer — English on the left, Korean on the right.
const ko: Record<string, string> = {
  // page chrome
  'All projects': '모든 프로젝트',
  'The Gyroscope Wand': '자이로스코프 완드',
  'APS112 Engineering Strategies & Practice II — Winter 2026': 'APS112 Engineering Strategies & Practice II — 2026년 겨울 학기',
  'Team 013 — {members}and {me} (me)': '013팀 — {members}그리고 {me} (본인)',
  'Client: {client}, {kup} director': '클라이언트: {client}, {kup} 디렉터',

  // the story
  "Skule™ Kup is a year-long competition between U of T's engineering disciplines. One of its games is Discipline Feud, where teams race to guess the most common answers to survey questions, and whoever signals first gets to answer. The signalling is the problem. When several people react at once, the organizers have to judge who was first, the judgment gets disputed, and the game slows down. Our team of six spent the winter semester designing a fix.":
    'Skule™ Kup은 토론토 대학교(U of T) 공학부의 여러 학과가 일 년 내내 겨루는 대회입니다. 그중 한 종목인 Discipline Feud에서는 팀들이 설문 질문에 가장 많이 나온 답을 먼저 맞히려 경쟁하고, 먼저 신호를 보낸 쪽이 답할 기회를 얻습니다. 문제는 바로 그 신호 방식이었습니다. 여러 사람이 동시에 반응하면 운영진이 누가 먼저였는지 판정해야 하고, 그 판정을 두고 이의가 나오며, 게임이 느려집니다. 여섯 명으로 이루어진 저희 팀은 겨울 학기 내내 이 문제를 해결할 장치를 설계했습니다.',
  'Here is the whole project the way we presented it: the final deck from April 9th, 2026. Turn through it below, or open it in its own tab. The rest of this page is the story behind it.':
    '프로젝트 전체를 저희가 발표했던 그대로 담았습니다: 2026년 4월 9일의 최종 발표 자료입니다. 아래에서 한 장씩 넘겨 보시거나 새 탭에서 여실 수 있습니다. 이 페이지의 나머지는 그 뒤에 담긴 이야기입니다.',
  'Buzzer Beaters, the final presentation': 'Buzzer Beaters, 최종 발표',
  'A real client': '실제 클라이언트',
  'APS112 gives first-year teams a real client, and ours was Alexandre Klaus, a second-year Engineering Science student and the current Skule™ Kup director. His brief was specific: detect the first responder reliably, handle a changing number of contestants in real time, and keep the system safe and portable. The requirements came from visiting the rooms themselves. We measured the EngSoc Arena at 46 decibels of ambient sound and noted its lighting controls and table heights, so the design would fit the room it will be used in.':
    'APS112는 1학년 팀에게 실제 클라이언트를 붙여 줍니다. 저희 클라이언트는 Engineering Science 2학년이자 현 Skule™ Kup 디렉터인 Alexandre Klaus였습니다. 요구 사항은 구체적이었습니다: 첫 응답자를 확실하게 감지할 것, 바뀌는 참가자 수에 실시간으로 대응할 것, 시스템을 안전하고 휴대하기 쉽게 만들 것. 요구 사항은 경기가 열리는 공간을 직접 찾아가 정리했습니다. EngSoc Arena의 주변 소음을 46데시벨로 측정하고 조명 제어 방식과 테이블 높이를 기록해, 설계가 실제로 쓰일 공간에 맞도록 했습니다.',
  'Three ideas on a whiteboard': '화이트보드 위의 세 가지 아이디어',
  'My formal role was quality assurance, but the contribution I care most about happened at a whiteboard. Earlier in the term, my first peer evaluation told me plainly that I should be more present in team discussions. I took that seriously. During idea selection, I came to one of our in-person meetings prepared and presented three design directions on the whiteboard: a hard-hat concept with built-in buzzers, a gyroscope-based wand, and a conventional buzzer system. For each one I walked through the detection method, the physical layout, and how it would be used on game day. After several rounds of deliberation the team chose the wand, and the client responded well to the less conventional ideas.':
    '저의 공식 역할은 품질 보증(QA)이었지만, 제가 가장 아끼는 기여는 화이트보드 앞에서 나왔습니다. 학기 초 첫 동료 평가에서 팀 토론에 더 적극적으로 참여해야 한다는 솔직한 피드백을 받았습니다. 저는 그 말을 진지하게 받아들였습니다. 아이디어 선정 단계에서 대면 회의에 준비를 해 가서, 화이트보드에 세 가지 설계 방향을 발표했습니다: 버저를 내장한 안전모 콘셉트, 자이로스코프(gyroscope) 기반 완드, 그리고 기존 방식의 버저 시스템입니다. 각 안마다 감지 방식, 물리적 구성, 경기 당일 사용 방법을 차례로 설명했습니다. 여러 차례 논의를 거쳐 팀은 완드를 골랐고, 클라이언트도 관습에서 벗어난 아이디어들에 좋은 반응을 보였습니다.',
  'The whiteboard from that meeting: three numbered options — a hard hat with sensor choices listed, a gyroscope light stick with two SKULE wands wired to a hub box and a computer, and a general buzzer system — with notes on collecting all data in one place and lighting up the first responder.':
    '그 회의의 화이트보드: 번호를 매긴 세 가지 안 — 센서 후보를 적어 둔 안전모, 허브 박스와 컴퓨터에 연결된 SKULE 완드 두 개를 그린 자이로스코프 라이트 스틱, 일반 버저 시스템 — 그리고 모든 데이터를 한곳에 모으고 첫 응답자에게 불을 켠다는 메모.',
  'The whiteboard itself: hard-hat, gyroscope light stick, general buzzer.': '그날의 화이트보드: 안전모, 자이로스코프 라이트 스틱, 일반 버저.',
  "The idea is simple to say: instead of pressing a button, you raise the wand. Motion detection identifies the first wand to move, and each discipline gets its own topper sealed in a clear globe, so every wand shows its discipline's symbol.":
    '아이디어는 말로 하면 간단합니다: 버튼을 누르는 대신 완드를 들어 올립니다. 모션 감지가 가장 먼저 움직인 완드를 찾아내고, 학과마다 투명 구체 안에 밀봉된 고유의 토퍼가 있어 모든 완드가 자기 학과의 상징을 보여 줍니다.',
  'In the report, the three directions became formal designs. The team had generated 72 ideas, consolidated them to 38, voted them down to 10, and kept three. The CDS drew each one out properly, and the figures below are from those pages.':
    '보고서에서 세 방향은 정식 설계안이 되었습니다. 팀은 72개의 아이디어를 내고, 38개로 통합하고, 투표로 10개까지 추린 뒤 세 개를 남겼습니다. CDS는 각 안을 제대로 그려 냈고, 아래 그림들은 그 페이지에서 가져왔습니다.',
  'Alternative Design 1 was the Skule™ Wand: a handheld device that reads a response as angular velocity, with an inertial measurement unit in every wand and an I²C multiplexer collecting all eight signals into one Arduino.':
    '대안 설계 1은 Skule™ Wand였습니다: 응답을 각속도로 읽는 손에 쥐는 장치로, 완드마다 관성 측정 장치(IMU)를 넣고 I²C 멀티플렉서가 여덟 개의 신호를 모두 하나의 Arduino로 모읍니다.',
  'Alternative Design 1: the Skule Wand': '대안 설계 1: Skule Wand',
  'Alternative Design 2 was the Hard-Hat Smack: eight hard hats, each with a force-sensitive pod on the crown that you slap, reporting over Bluetooth to an ESP32. Viscoelastic foam inside the hat protects the head that does the slapping.':
    '대안 설계 2는 Hard-Hat Smack이었습니다: 안전모 여덟 개의 정수리마다 손으로 내리치는 압력 감지 포드를 달고, Bluetooth로 ESP32에 신호를 보냅니다. 모자 안의 점탄성 폼이 내리치는 쪽의 머리를 보호합니다.',
  'Alternative Design 2: the Hard-Hat Smack': '대안 설계 2: Hard-Hat Smack',
  'Alternative Design 3 was the Boom-Box: the classic buzzer rebuilt around a T-handle, with a piezo buzzer in every box and an Arduino Mega in the hub.':
    '대안 설계 3은 Boom-Box였습니다: 고전적인 버저를 T자 손잡이를 중심으로 다시 만든 것으로, 상자마다 피에조 버저를 넣고 허브에는 Arduino Mega를 두었습니다.',
  'Alternative Design 3: the Boom-Box': '대안 설계 3: Boom-Box',
  'The Pugh method decided it. With the wand as the datum, the Hard-Hat Smack scored minus three and the Boom-Box minus one, mostly on weight and size, and the Skule™ Wand became the proposed design.':
    '결정은 Pugh 방법(Pugh method)이 내렸습니다. 완드를 기준(datum)으로 두었을 때 Hard-Hat Smack은 −3점, Boom-Box는 −1점을 받았는데, 주로 무게와 크기에서 점수를 잃었습니다. 그렇게 Skule™ Wand가 제안 설계가 되었습니다.',
  'Modeling it': '모델링',
  'To make the concept concrete I built a prototype model in Blender, finishing it the day before the CDS deadline. The model works out the full assembly: a gripped handle, a globe mount, an LED puck that lights when a wand wins the round, and the globe with a discipline topper inside. I modeled eight toppers, one per discipline.':
    '콘셉트를 구체화하기 위해 저는 Blender로 프로토타입 모델을 만들었고, CDS 마감 전날 완성했습니다. 이 모델은 전체 조립 구조를 풀어냅니다: 그립 손잡이, 구체 마운트, 완드가 라운드를 이기면 켜지는 원반형 LED 퍽, 그리고 학과 토퍼가 든 구체입니다. 토퍼는 학과마다 하나씩, 여덟 개를 모델링했습니다.',
  'Blender model and renders': 'Blender 모델과 렌더',
  'The model below is the Blender file itself, converted for the web. Drag to orbit, scroll to zoom.':
    '아래 모델은 Blender 파일 그대로를 웹용으로 변환한 것입니다. 드래그하면 회전하고, 스크롤하면 확대·축소됩니다.',
  'Poster for the interactive 3D model: the lineup of eight wands.': '인터랙티브 3D 모델의 포스터: 나란히 선 여덟 개의 완드.',
  'All eight wands, in 3D — modeled in Blender™.': '여덟 개의 완드 전부를 3D로 — Blender™로 모델링했습니다.',
  'Making it move': '움직이게 만들기',
  "I also wrote the firmware for a two-wand bench prototype. It runs on an Arduino with a TCA9548A I2C multiplexer and a motion sensor in each wand. The loop samples both sensors, derives speed and acceleration magnitudes from the readings, and compares them against a threshold. The first wand past the threshold locks the round, lights its own LED, and plays its own tone on the hub's buzzer, so everyone can hear which wand was first. The code self-checks too: it scans the I2C bus, verifies each sensor's identity register, and runs the sensor's self-test before trusting it. A note on the name: we pitched the concept with a gyroscope, and the bench prototype detects motion with accelerometers.":
    '두 완드 벤치 프로토타입의 펌웨어도 제가 작성했습니다. TCA9548A I2C 멀티플렉서를 단 Arduino에서 돌아가며, 완드마다 모션 센서가 하나씩 들어 있습니다. 루프는 두 센서를 샘플링해 측정값에서 속도와 가속도의 크기를 구하고, 이를 임계값과 비교합니다. 임계값을 먼저 넘은 완드가 그 라운드를 잠그고, 자기 LED를 켜고, 허브의 버저로 자기만의 음을 울려서 어느 완드가 먼저였는지 모두가 들을 수 있습니다. 코드는 스스로 점검도 합니다: I2C 버스를 스캔하고, 각 센서의 식별 레지스터를 확인하고, 센서를 신뢰하기 전에 자체 테스트를 돌립니다. 이름에 대해 한마디 덧붙이자면, 콘셉트는 자이로스코프로 제안했지만 벤치 프로토타입은 가속도계로 움직임을 감지합니다.',
  'Firmware bench work': '펌웨어 벤치 작업',
  'Getting there took legwork outside the code. I visited MyFab to understand what we could actually manufacture, asked upper-year students for advice, and at one meeting brought in a physical gyroscope so the team could handle the thing we kept talking about.':
    '여기까지 오는 데는 코드 밖의 발품도 필요했습니다. 실제로 무엇을 제작할 수 있는지 알아보러 MyFab을 찾아갔고, 선배들에게 조언을 구했으며, 한 회의에는 실물 자이로스코프를 가져가 팀이 늘 이야기만 하던 물건을 직접 만져 볼 수 있게 했습니다.',
  'MyFab and hardware legwork': 'MyFab과 하드웨어 발품',
  'From model to hardware': '모델에서 하드웨어로',
  "After the model, we built it. We printed five handles, capped them with clear globes, and wired two of them up as live wands into a breadboard hub carrying the Arduino, the multiplexer, the LEDs, and the buzzer. One assembled wand weighs 106 grams on a kitchen scale; the CDS had calculated 102. The number mattered, because portability was in the client's brief from the first meeting.":
    '모델 다음에는 실물을 만들었습니다. 손잡이 다섯 개를 프린트해 투명 구체를 씌우고, 그중 두 개를 실제 작동하는 완드로 삼아 Arduino, 멀티플렉서, LED, 버저를 실은 브레드보드 허브에 배선했습니다. 조립된 완드 하나는 주방 저울에서 106그램이 나왔고, CDS의 계산값은 102그램이었습니다. 이 숫자가 중요했던 이유는, 휴대성이 첫 회의 때부터 클라이언트의 요구 사항에 들어 있었기 때문입니다.',
  'Building the wands': '완드 제작',
  'Bench demo: shaking the wand lights the globe': '벤치 시연: 완드를 흔들면 구체에 불이 켜집니다',
  'Shake the wand, and the globe lights.': '완드를 흔들면 구체에 불이 켜집니다.',
  'Bench demo: two wands racing; the first to move wins the round': '벤치 시연: 두 완드의 경쟁, 먼저 움직인 쪽이 라운드를 이깁니다',
  'Both wands wired up: the first one to move wins the round.': '두 완드 모두 배선 완료: 먼저 움직인 쪽이 라운드를 이깁니다.',
  'The paper trail': '문서의 기록',
  'Alongside the hardware, the course asked for formal documents, and the writing took as much work as the build. The Project Requirements came first, in early March. The Conceptual Design Specification followed three weeks later: 95 pages of problem framing, morph charts, alternative designs, and measures of success. The night before the CDS was due we were 700 words over the limit at 2 a.m., and the whole team stayed on call until seven in the morning cutting words and fixing formatting. As quality assurance manager I did the final proofreading and kept our submissions on time. Everything below opens right here on the page.':
    '하드웨어와 함께 과목은 정식 문서도 요구했고, 글쓰기에는 제작만큼의 품이 들었습니다. 3월 초에 프로젝트 요구사항(Project Requirements)이 먼저 나왔습니다. 3주 뒤에는 개념 설계 사양서(Conceptual Design Specification)가 이어졌습니다: 문제 정의, 모프 차트, 대안 설계, 성공 척도를 담은 95쪽짜리 문서입니다. CDS 마감 전날 밤 새벽 2시에 저희는 분량 제한을 700단어 넘긴 상태였고, 팀 전원이 아침 7시까지 통화를 유지한 채 단어를 줄이고 서식을 고쳤습니다. 품질 보증 담당으로서 저는 최종 교정을 맡고 제출 기한을 지켰습니다. 아래 문서는 모두 이 페이지에서 바로 열립니다.',
  'Morph chart and schedule from the CDS': 'CDS의 모프 차트와 일정표',
  'Student numbers and personal contact details are redacted from the published copies.': '공개본에서는 학번과 개인 연락처를 가렸습니다.',
  'The feedback loop': '피드백 루프',
  'This course taught me to treat peer feedback the way I treat a bug report. The first evaluation said I needed to engage more; I answered it with the whiteboard session and the prototype, and I later wrote the whole loop up in the Team Feedback Analysis above. By the second evaluation, teammates were writing about the late nights on the CDS and the resources I kept bringing to meetings. The feedback also gave me new things to work on, like sharing more during discussions and responding faster online. I would rather know these things in first year than discover them at a job.':
    '이 과목은 동료 피드백을 버그 리포트 대하듯 다루는 법을 가르쳐 주었습니다. 첫 평가는 제가 더 적극적으로 참여해야 한다고 했고, 저는 화이트보드 세션과 프로토타입으로 답했으며, 나중에 그 과정 전체를 위의 팀 피드백 분석에 정리했습니다. 두 번째 평가에서는 팀원들이 CDS를 붙들고 지새운 밤들과 제가 회의마다 가져온 자료를 언급하고 있었습니다. 피드백은 토론 중에 더 많이 공유하기, 온라인에서 더 빨리 답하기처럼 새로 다듬을 점도 알려 주었습니다. 이런 점은 직장에서 뒤늦게 발견하기보다 1학년 때 알아 두는 편이 낫습니다.',
  'Kamilia wrote afterward that working on this team was one of the highlights of her first year. It was one of mine too.':
    'Kamilia는 나중에 이 팀에서 일한 것이 1학년의 가장 좋았던 순간 중 하나였다고 적었습니다. 저에게도 그랬습니다.',
  'Presentation day': '발표 당일',
  'We hope to build the production version with Alexandre and see the wand make its debut at a future Skule™ Kup event.':
    '저희는 Alexandre와 함께 정식 버전을 만들어, 앞으로의 Skule™ Kup 행사에서 이 완드가 데뷔하는 모습을 보고 싶습니다.',

  // the deck, one note per slide
  'Title slide: Buzzer Beaters, Team 13, presented to client Alexandre Klaus on April 9th.': '표지: Buzzer Beaters, 13팀. 4월 9일 클라이언트 Alexandre Klaus에게 발표했습니다.',
  'The course disclaimer: a first-year student design, not a professional engineering submission.': '과목의 면책 고지: 전문 엔지니어링 제출물이 아닌 1학년 학생 설계물입니다.',
  'The agenda: problem, proposed design, key objectives, iteration, next steps.': '발표 순서: 문제, 제안 설계, 핵심 목표, 반복 개선, 다음 단계.',
  'The proposed design: the Skule™ Wand, effective, feasible, and efficient.': '제안 설계: Skule™ Wand — 효과적이고, 실현 가능하며, 효율적입니다.',
  'How it works: swing the wand, pass the motion threshold, your LED lights and the others lock out.': '작동 방식: 완드를 휘둘러 움직임 임계값을 넘으면 내 LED가 켜지고 나머지 완드는 잠깁니다.',
  'The five objectives, with targets: lightweight, compact, impact resistant, structurally resilient, durable.': '목표치와 함께 정리한 다섯 가지 목표: 가벼움, 소형, 내충격성, 구조적 복원력, 내구성.',
  'All five objectives, checked off against the built wand system.': '제작한 완드 시스템에 대해 다섯 가지 목표를 모두 확인했습니다.',
  'Measure of Success: the drop test and weight. 92% functional, 89% physical condition, 83% operational.': '성공 척도(Measure of Success): 낙하 시험과 무게. 기능 92%, 물리적 상태 89%, 작동 83%.',
  'Compact enough to be carry-on: the packed system is 200 by 300 by 230 mm.': '기내 반입이 가능할 만큼 작습니다: 포장한 시스템은 200 × 300 × 230 mm입니다.',
  'What testing exposed: the clear acrylic sphere cracked during the drop test.': '시험에서 드러난 문제: 투명 아크릴 구체가 낙하 시험 중 금이 갔습니다.',
  'The iteration: the old acrylic model beside the new polycarbonate one.': '반복 개선: 기존 아크릴 모델과 새 폴리카보네이트 모델을 나란히.',
  'Why we switched: polycarbonate is more impact resistant than acrylic.': '바꾼 이유: 폴리카보네이트가 아크릴보다 충격에 강하기 때문입니다.',
  'Next steps: put the wand into Discipline Feud and support more hardware and wireless connections.': '다음 단계: 완드를 Discipline Feud에 투입하고, 더 많은 하드웨어와 무선 연결을 지원합니다.',
  'Takeaway: feasible, meets the objectives, confirmed by MoS, and iterated after testing.': '요약: 실현 가능하고, 목표를 충족하며, MoS로 확인했고, 시험 후 개선했습니다.',
  'Thank you, and questions.': '감사 인사, 그리고 질의응답.',
  'References.': '참고 문헌.',
  'Appendix: the threshold logic, in the firmware itself, that decides which wand moved first.': '부록: 어느 완드가 먼저 움직였는지 판정하는 임계값 로직, 펌웨어 코드 그대로.',
  'Appendix: the flowchart of how the system identifies the first responder.': '부록: 시스템이 첫 응답자를 판별하는 과정의 순서도.',
  'Appendix: the Measure of Success success-rate calculations.': '부록: 성공 척도(MoS)의 성공률 계산.',

  // the document shelf (the .ino file name stays as it is)
  'Project Requirements (PR)': '프로젝트 요구사항 (PR)',
  'March 3, 2026 · 28 pages': '2026년 3월 3일 · 28쪽',
  'Conceptual Design Specification (CDS)': '개념 설계 사양서 (CDS)',
  'March 22, 2026 · 95 pages': '2026년 3월 22일 · 95쪽',
  'Team Feedback Analysis': '팀 피드백 분석',
  'April 6, 2026 · 7 pages': '2026년 4월 6일 · 7쪽',
  'Engineering Notebook': '엔지니어링 노트북',
  'Winter 2026 · 16 pages': '2026년 겨울 학기 · 16쪽',
  'Arduino C++ · 493 lines': 'Arduino C++ · 493줄',

  // Alternative Design 1: the Skule Wand
  'CDS system diagram of the Skule Wand: LED first-responder indicator, motion sensor capturing angular velocity, hub box, and USB link to the computer.':
    'CDS의 Skule Wand 시스템 다이어그램: 첫 응답자를 표시하는 LED, 각속도를 읽는 모션 센서, 허브 박스, 컴퓨터로 이어지는 USB 연결.',
  'The Skule™ Wand, end to end: sensor, hub, screen.': 'Skule™ Wand의 전체 흐름: 센서, 허브, 화면.',
  'CDS drawing of the wand central hub interior: the I2C multiplexer wired to an Arduino-based central unit.':
    'CDS의 완드 중앙 허브 내부 도면: Arduino 기반 중앙 장치에 연결된 I2C 멀티플렉서.',
  'The central hub: the multiplexer feeding the Arduino.': '중앙 허브: 멀티플렉서가 Arduino로 신호를 모아 보냅니다.',
  'Hand-drawn dimensioned wand from the CDS: an 80 mm globe with the flask topper on a 150 mm PETG grip.':
    'CDS에 실린 손으로 그린 완드 치수 도면: 150 mm PETG 손잡이 위에 플라스크 토퍼가 든 80 mm 구체.',
  'The wand, dimensioned: an 80 mm globe on a 150 mm PETG grip.': '완드의 치수: 150 mm PETG 손잡이 위에 80 mm 구체.',

  // Alternative Design 2: the Hard-Hat Smack
  'CDS drawing of the hard-hat concept: eight hard hats arranged around a central operating system connected to a laptop.':
    'CDS의 안전모 콘셉트 도면: 노트북에 연결된 중앙 운영 장치를 둘러싼 여덟 개의 안전모.',
  'The hard-hat concept: eight helmets reporting to one central unit.': '안전모 콘셉트: 여덟 개의 헬멧이 하나의 중앙 장치로 신호를 보냅니다.',
  'CDS drawing of a hard hat from above, with a buzzer pod attached by velcro and an example discipline logo sticker.':
    'CDS의 안전모 상면 도면: 벨크로로 붙인 버저 포드와 학과 로고 스티커 예시.',
  'The buzzer pod sits on the helmet crown, with a discipline sticker.': '헬멧 정수리에 얹은 버저 포드와 학과 스티커.',
  'CDS drawing of the buzzer pod interior: a force-sensitive resistor inside a polycarbonate shell with a velcro base.':
    'CDS의 버저 포드 내부 도면: 벨크로 바닥을 댄 폴리카보네이트 케이스 안의 압력 감지 저항(FSR).',
  'Inside the pod: a force-sensitive resistor reads the tap.': '포드 내부: 압력 감지 저항(FSR)이 두드림을 읽습니다.',
  'Dimensioned CDS drawing of a standard hard hat with a viscoelastic polyurethane foam insert.':
    '점탄성 폴리우레탄 폼 인서트를 넣은 표준 안전모의 CDS 치수 도면.',
  'Padding spec for the helmet mount.': '헬멧 장착부의 패딩 사양.',
  "CDS drawing of the hard-hat concept's central unit: a polycarbonate enclosure holding an ESP32 dev board, a mini speaker, and a breadboard, linked to a laptop over Bluetooth.":
    '안전모 콘셉트의 중앙 장치 CDS 도면: ESP32 개발 보드, 미니 스피커, 브레드보드를 담은 폴리카보네이트 케이스가 Bluetooth로 노트북과 연결됩니다.',
  "The hard-hat concept's central unit: an ESP32 talking Bluetooth.": '안전모 콘셉트의 중앙 장치: Bluetooth로 통신하는 ESP32.',

  // Alternative Design 3: the Boom-Box
  'CDS drawing of the Boom-Box system: buzzer boxes wired to a plywood hub with an Arduino Mega 2560 and a laptop.':
    'CDS의 Boom-Box 시스템 도면: Arduino Mega 2560과 노트북이 있는 합판 허브에 유선으로 연결된 버저 박스들.',
  'The Boom-Box system, drawn end to end.': 'Boom-Box 시스템의 전체 구성도.',
  'CDS drawing of a Boom-Box unit: a navy MDF box with SKULE lettering, a T-handle, and a passive piezo buzzer.':
    'CDS의 Boom-Box 유닛 도면: SKULE 글자를 새긴 남색 MDF 상자, T자 손잡이, 패시브 피에조 버저.',
  'One Boom-Box unit: MDF painted navy, a T-handle, and a piezo buzzer.': 'Boom-Box 유닛 하나: 남색으로 칠한 MDF, T자 손잡이, 피에조 버저.',
  'Dimensioned CDS drawing of the Boom-Box unit: an 80 mm T-handle over a 110 by 80 by 80 mm box with the SKULE logo.':
    'Boom-Box 유닛의 CDS 치수 도면: SKULE 로고가 있는 110 × 80 × 80 mm 상자 위의 80 mm T자 손잡이.',
  'The Boom-Box unit, dimensioned.': 'Boom-Box 유닛의 치수.',

  // morph chart and schedule
  'The morphological chart from the CDS: functions and objectives as rows, means as columns, with colored concept paths drawn through the grid.':
    'CDS의 모프 차트(morphological chart): 행은 기능과 목표, 열은 수단이며, 격자 위로 색깔별 콘셉트 경로를 그렸습니다.',
  'The morph chart: every function crossed against every means.': '모프 차트: 모든 기능을 모든 수단과 교차시켰습니다.',
  'Gantt chart for March and April 2026 covering prototyping, testing, iteration, and final presentation preparation, with owners per task.':
    '2026년 3월과 4월의 간트 차트: 프로토타이핑, 시험, 반복 개선, 최종 발표 준비를 담당자별로 정리했습니다.',
  'The Gantt chart: prototyping, testing, and presentation prep planned to the day.': '간트 차트: 프로토타이핑, 시험, 발표 준비를 날짜 단위로 계획했습니다.',

  // Blender model and renders
  'A laptop with Blender open on the left, showing the eight modeled wands, and the CDS document open on the right with a hand-drawn diagram of the hub electronics.':
    '왼쪽에는 모델링한 여덟 개의 완드가 보이는 Blender, 오른쪽에는 허브 전자부 손그림 다이어그램이 있는 CDS 문서가 열린 노트북.',
  'March 21: the model on one side of the screen, the report on the other.': '3월 21일: 화면 한쪽에는 모델, 다른 쪽에는 보고서.',
  'Blender render: a lineup of eight blue wands, each topped with a clear globe containing a different discipline symbol, including a lightning bolt, a flask, a gear, a pickaxe, an eight-ball, and a calculator.':
    'Blender 렌더: 나란히 선 여덟 개의 파란 완드. 각 완드 위 투명 구체 안에는 번개, 플라스크, 톱니바퀴, 곡괭이, 8번 당구공, 계산기 등 서로 다른 학과 상징이 들어 있습니다.',
  'The eight disciplines, in a row.': '여덟 개 학과가 한 줄로.',
  'Blender render of the same eight wands seen from behind.': '같은 여덟 개의 완드를 뒤에서 본 Blender 렌더.',
  'The lineup from behind.': '뒤에서 본 모습.',
  'Blender render of a single wand: a blue gripped handle with a clear globe on top, an Erlenmeyer flask sealed inside.':
    '완드 하나의 Blender 렌더: 파란 그립 손잡이 위에 투명 구체, 그 안에 밀봉된 삼각 플라스크.',
  'A single wand, with the flask topper sealed in the globe.': '구체 안에 플라스크 토퍼를 밀봉한 완드 하나.',
  'Blender render from a three-quarter angle showing the yellow LED puck seated under the globe mount.':
    '구체 마운트 아래에 자리한 노란 LED 퍽이 보이는, 비스듬한 각도의 Blender 렌더.',
  'Under the globe, the LED puck that lights when a wand wins the round.': '구체 아래, 완드가 라운드를 이기면 켜지는 LED 퍽.',
  'A darker Blender render of a single wand with the flask topper, seen close up.': '플라스크 토퍼가 달린 완드 하나를 가까이서 본 어두운 톤의 Blender 렌더.',
  'The globe, close up.': '구체를 가까이서.',
  'A Blender viewport view of a single wand against the working grid.': '작업 격자 위에 놓인 완드 하나의 Blender 뷰포트 화면.',
  'In the viewport.': '뷰포트에서.',

  // firmware bench work
  'A laptop running the Arduino IDE with a serial monitor open, wired to an Arduino Uno and a red accelerometer breakout on a makerspace bench.':
    '메이커스페이스 작업대에서 Arduino Uno와 빨간 가속도계 브레이크아웃 보드에 연결된 채 Arduino IDE와 시리얼 모니터를 띄운 노트북.',
  'Bringing up the sensor over I2C.': 'I2C로 센서를 처음 띄우는 중.',
  'Video: sensor readings streaming into the serial monitor while a hand moves the wired accelerometer over an Arduino.':
    '영상: 손으로 Arduino에 연결된 가속도계를 움직이는 동안 시리얼 모니터에 흘러 들어오는 센서 값.',
  'Watching the readings come in on the serial monitor.': '시리얼 모니터로 들어오는 측정값을 지켜보는 중.',
  'Video: shaking the accelerometer breakout at a home desk until the LED on the breadboard lights.':
    '영상: 집 책상에서 브레드보드의 LED가 켜질 때까지 가속도계 브레이크아웃 보드를 흔드는 모습.',
  'The same rig again at home, late at night.': '같은 장비를 집에서 다시, 늦은 밤에.',
  'The purple TCA9548A multiplexer breakout held between two fingers, with the breadboard and Arduino behind.':
    '두 손가락으로 집은 보라색 TCA9548A 멀티플렉서 브레이크아웃 보드, 뒤로는 브레드보드와 Arduino.',
  'The TCA9548A multiplexer, up close.': 'TCA9548A 멀티플렉서를 가까이서.',
  'Close-up of the breadboard at night: LEDs, resistors, and the purple multiplexer board wired to an Arduino Uno.':
    '밤에 찍은 브레드보드 클로즈업: Arduino Uno에 연결된 LED, 저항, 보라색 멀티플렉서 보드.',
  'LEDs and the multiplexer on the breadboard.': '브레드보드 위의 LED와 멀티플렉서.',
  'The hub laid out on bubble wrap: breadboard with the multiplexer and two accelerometer breakouts, an LED, a buzzer, and the Arduino.':
    '에어캡 위에 펼쳐 놓은 허브: 멀티플렉서와 가속도계 브레이크아웃 보드 두 개가 꽂힌 브레드보드, LED, 버저, Arduino.',
  'The hub, laid out: multiplexer, sensors, LED, buzzer.': '펼쳐 놓은 허브: 멀티플렉서, 센서, LED, 버저.',
  'A breadboard test with four accelerometer breakouts wired through the multiplexer to an Arduino, laptop behind.':
    '가속도계 브레이크아웃 보드 네 개를 멀티플렉서를 거쳐 Arduino에 연결한 브레드보드 시험, 뒤에는 노트북.',
  'Four sensors through one multiplexer.': '멀티플렉서 하나로 센서 네 개.',
  'Two wired wands beside a MacBook running the Arduino IDE with the two-wand firmware open.':
    '두 완드 펌웨어를 Arduino IDE에 띄운 MacBook 옆에 놓인, 배선을 마친 완드 두 개.',
  'The two-wand rig beside the firmware.': '펌웨어 옆의 두 완드 장비.',

  // MyFab and hardware legwork
  'The parts laid out on a workbench: an Arduino Uno, the purple multiplexer, LEDs and resistors, three red accelerometer breakouts, and a breadboard.':
    '작업대에 늘어놓은 부품: Arduino Uno, 보라색 멀티플렉서, LED와 저항, 빨간 가속도계 브레이크아웃 보드 세 개, 브레드보드.',
  'The parts, laid out: one Arduino, one multiplexer, three sensors.': '늘어놓은 부품: Arduino 하나, 멀티플렉서 하나, 센서 셋.',
  'A soldering station with helping hands holding a small purple multiplexer board mid-solder.':
    '납땜 도중 작은 보라색 멀티플렉서 보드를 헬핑 핸드(보조 집게)로 고정한 납땜 작업대.',
  'Soldering the multiplexer breakout.': '멀티플렉서 브레이크아웃 보드 납땜.',
  'An Arduino Uno R3 board resting on an open palm.': '펼친 손바닥 위에 놓인 Arduino Uno R3 보드.',
  'The Arduino Uno that ran the hub.': '허브를 돌린 Arduino Uno.',
  'A makerspace worktable covered with wand handles, wiring, pliers, a drill, and a glue gun mid-build.':
    '제작 도중 완드 손잡이, 배선, 펜치, 드릴, 글루건으로 뒤덮인 메이커스페이스 작업대.',
  "The team's bench at MyFab, mid-build.": '제작이 한창인 MyFab의 저희 팀 작업대.',

  // building the wands
  'Five 3D-printed blue wand handles with clear globes laid out on a table beside a breadboard hub wired to two of them.':
    '테이블 위에 늘어놓은, 투명 구체가 달린 3D 프린팅 파란 완드 손잡이 다섯 개. 그중 두 개가 옆의 브레드보드 허브에 연결되어 있습니다.',
  'Five printed wands; the bottom two are wired into the hub.': '프린트한 완드 다섯 개. 아래 두 개는 허브에 배선되어 있습니다.',
  'An assembled wand lying on a kitchen scale that reads 106 grams.': '106그램을 가리키는 주방 저울 위에 놓인 조립된 완드.',
  '106 grams.': '106그램.',
  'A hand gripping a finished wand in front of the breadboard hub with the Arduino and multiplexer boards.':
    'Arduino와 멀티플렉서 보드가 꽂힌 브레드보드 허브 앞에서 완성된 완드를 쥔 손.',
  'Holding a finished wand, with the hub behind it.': '완성된 완드를 손에 들고, 뒤에는 허브.',
  'A teammate studying the two-wand rig on a desk with a multimeter, spare multiplexer boards, and a bag of jumper wires.':
    '멀티미터, 여분의 멀티플렉서 보드, 점퍼선 봉지가 놓인 책상에서 두 완드 장비를 살펴보는 팀원.',
  'Debugging with a multimeter and spare boards.': '멀티미터와 여분 보드로 디버깅.',
  'The breadboard hub and Arduino packed on bubble wrap next to a USB cable and a bag of clip leads.':
    'USB 케이블과 클립 리드선 봉지 옆에 에어캡으로 싸 둔 브레드보드 허브와 Arduino.',
  'Packed for transport between meetings.': '회의 사이 이동을 위해 포장.',

  // presentation day
  "Five teammates in formal wear holding the wands and electronics in front of a University of Toronto Engineering 'Defy Gravity' backdrop.":
    "University of Toronto Engineering의 'Defy Gravity' 배경막 앞에서 완드와 전자 장치를 들고 선 정장 차림의 팀원 다섯 명.",
  'Presentation day.': '발표 당일.',
  'Henry in a suit holding two finished wands and the hub electronics, beside the Myhal Centre plaque.':
    'Myhal Centre 명판 옆에서 완성된 완드 두 개와 허브 전자 장치를 든 정장 차림의 Henry.',
  'Before the final presentation.': '최종 발표 직전.',
  'The team giving thumbs up beside the client after the final presentation, with a laptop showing the team slide and wands on the table.':
    '최종 발표 후 클라이언트 옆에서 엄지를 든 팀. 노트북에는 팀 슬라이드가, 테이블에는 완드가 놓여 있습니다.',
  'With our client, after the final presentation.': '최종 발표 후, 클라이언트와 함께.',

  // the model viewer
  'View in 3D': '3D로 보기',
  'Interactive 3D model of the wand': '완드의 인터랙티브 3D 모델',
  'Drag to orbit, scroll to zoom.': '드래그하면 회전하고, 스크롤하면 확대·축소됩니다.',
  'loading the model…': '모델을 불러오는 중…',
  "3D isn't available here — {link} instead.": '이 환경에서는 3D를 표시할 수 없습니다 — 대신 {link}해 주세요.',
  'download the model': '모델을 다운로드',
};

export default ko;
