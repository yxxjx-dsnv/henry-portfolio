// Korean for the Campus Pulse page and its dashboard — English on the left, Korean on the right.
const ko: Record<string, string> = {
  // ── the page ──
  'All projects': '모든 프로젝트',
  'IEEE × AWS hackathon — March 13, 2026': 'IEEE × AWS 해커톤 — 2026년 3월 13일',
  'Team 6SIX7 — {members}, and {me} (me)': 'Team 6SIX7 — {members}, 그리고 {me} (저)',
  'Code': '코드',
  "The Campus Pulse logo: navy line-art of campus towers rising into a bar chart and a pulse curve, above the wordmark 'CAMPUS PULSE'.":
    "Campus Pulse 로고: 남색 선화 속에서 캠퍼스 건물들이 막대 그래프와 맥박 곡선으로 솟아오릅니다. 그 아래에 'CAMPUS PULSE' 워드마크가 있습니다.",
  'The Campus Pulse logo.': 'Campus Pulse 로고입니다.',
  "My first hackathon was on March 13, 2026, at Amazon's Toronto office at 18 York Street. IEEE called the event \"Hack the Student Life\": nine hours, from eight in the morning to five in the afternoon, to build something real around a problem of student life at U of T. I had never used AWS before, and I was nervous, but I wanted to see what I could build in one day.":
    '저의 첫 해커톤은 2026년 3월 13일, 토론토 18 York Street에 있는 Amazon 사무실에서 열렸습니다. IEEE는 이 행사를 "Hack the Student Life"라고 불렀습니다. 아침 8시부터 오후 5시까지 아홉 시간 동안 U of T 학생 생활의 문제를 하나 골라 실제로 동작하는 무언가를 만드는 자리였습니다. AWS를 한 번도 써 본 적이 없어 긴장됐지만 하루 만에 무엇을 만들 수 있는지 직접 확인해 보고 싶었습니다.',
  "Students seated at long tables during the opening presentation; the screen reads 'Welcome to AWS Canada YYZ18 — IEEE Hack the Student Life Event'.":
    "개회 발표 중 긴 테이블에 앉아 있는 학생들. 화면에는 'Welcome to AWS Canada YYZ18 — IEEE Hack the Student Life Event'라고 적혀 있습니다.",
  '8 a.m. at Amazon Toronto (YYZ18): the opening talk, before the teams scattered.': 'Amazon 토론토(YYZ18)의 오전 8시: 팀들이 흩어지기 전, 개회 발표.',
  'Why I signed up': '지원한 이유',
  'The application form asked why I wanted to attend, and my honest answer was that small problems in campus life had been bothering me for a while. Information is scattered across a handful of channels: department websites, email newsletters, Quercus announcements, club social media. More than once I learned about a lecture I wanted only after its registration had closed. The systems make students do the searching that software should be doing. I wrote that I wanted to move beyond passively observing those problems and try to analyze and redesign the system underneath one of them.':
    '지원서에는 참가하고 싶은 이유를 묻는 항목이 있었습니다. 저의 솔직한 답은 캠퍼스 생활의 작은 문제들이 꽤 오래전부터 신경 쓰였다는 것이었습니다. 정보는 학과 웹사이트, 이메일 뉴스레터, Quercus 공지, 동아리 소셜 미디어 등 여러 채널에 흩어져 있습니다. 듣고 싶던 강연을 등록 마감이 지난 뒤에야 알게 된 적이 한두 번이 아니었습니다. 소프트웨어가 해야 할 검색을 시스템이 학생에게 떠넘기고 있는 셈입니다. 저는 그런 문제를 수동적으로 바라보는 데서 벗어나 그중 하나의 밑바탕에 있는 시스템을 분석하고 다시 설계해 보고 싶다고 썼습니다.',
  'Building MONO, my resale analytics platform, had taught me that I could ship software around a real problem: it collected inventory from retail sites, compared retail prices against resale prices, and calculated the margins. But everything I had built so far ran on tools I already knew. Under the question about AWS experience I wrote the only thing I could write: that I had none, and that I was prepared to learn quickly.':
    '리셀 분석 플랫폼 MONO를 만들면서 저는 실제 문제를 중심으로 소프트웨어를 완성해 내놓을 수 있다는 것을 배웠습니다. MONO는 리테일 사이트에서 재고를 수집하고 정가와 리셀 가격을 비교해 마진을 계산하는 서비스였습니다. 하지만 그때까지 제가 만든 것은 모두 이미 아는 도구 위에서 돌아갔습니다. AWS 경험을 묻는 항목에는 쓸 수 있는 유일한 답을 적었습니다. 경험은 없지만 빠르게 배울 준비가 되어 있다고요.',
  'Choosing the problem': '문제 고르기',
  'The problem we picked was not original, but it was real, and all four of us had lived it. During midterm season you walk to Robarts, take the elevator up, walk the floor, find nothing, and repeat the loop in the next building. Thousands of students hunt for seats in parallel, and there is no live signal telling you where not to bother going. Every student knows this feeling, but there was no data anyone could check.':
    '저희가 고른 문제는 독창적이지는 않았지만 실제로 겪는 문제였습니다. 네 명 모두 직접 경험한 일이었습니다. 중간고사 기간이면 Robarts까지 걸어가서 엘리베이터를 타고 올라가 한 층을 다 돌아도 자리가 없고 다음 건물에서 같은 과정을 반복합니다. 수천 명의 학생이 동시에 자리를 찾아다니는데 어디는 가 봐야 소용없다고 알려 주는 실시간 신호는 없습니다. 모든 학생이 이 기분을 알지만 누구도 확인할 수 있는 데이터는 없었습니다.',
  'Deciding how to measure occupancy turned out to be the most instructive part of the day. Our first idea was counting devices on campus Wi-Fi. It sounded clever until we said "track everyone\'s phones" out loud, and we dropped it. The second was T-card tap data, which fails on coverage: only a few buildings, like Robarts and Gerstein, have T-card gates at all, so the signal could never cover the whole campus. What survived was the simplest idea: point a camera at a study space, count the people in frame, and compare the count to the floor\'s seat capacity. It measures exactly the thing a student cares about, which is seats. In the end, the constraints made the decision for us, and going through that elimination taught me a lot about how engineering choices are really made.':
    '점유율을 어떻게 측정할지 정하면서 그날 가장 많이 배웠습니다. 첫 번째 아이디어는 캠퍼스 Wi-Fi에 접속한 기기 수를 세는 것이었습니다. 그럴듯하게 들렸지만 "모든 사람의 휴대폰을 추적한다"고 소리 내어 말해 보는 순간 접었습니다. 두 번째는 T-card 태그 데이터였는데 범위가 문제였습니다. T-card 게이트가 있는 건물은 Robarts와 Gerstein 등 몇 곳뿐이라 이 신호로는 캠퍼스 전체를 결코 덮을 수 없었습니다. 살아남은 것은 가장 단순한 아이디어였습니다. 학습 공간에 카메라를 두고 화면 안의 사람 수를 세어 그 층의 좌석 수와 비교하는 것입니다. 학생이 정말 궁금해하는 것, 즉 자리를 정확히 측정합니다. 결국 제약 조건이 저희 대신 결정을 내려 준 셈이었습니다. 이 소거 과정을 거치면서 엔지니어링 선택이 실제로 어떻게 이루어지는지 많이 배웠습니다.',
  'What we built': '무엇을 만들었나',
  'The system we built is a straight line. Video frames from a study space go to Amazon Rekognition, which detects people without us training any model of our own. A Python processor turns the detections into headcounts, the headcounts land in DynamoDB, a Lambda function behind API Gateway serves them, and a React dashboard reads the API. By mid-afternoon the dashboard was live on a public URL. I remember refreshing the page on an iPad and feeling amazed that something we had planned at breakfast was now on the internet.':
    '저희가 만든 시스템은 한 줄로 이어집니다. 학습 공간의 영상 프레임이 Amazon Rekognition으로 들어가면 저희가 모델을 직접 학습시키지 않아도 사람을 감지해 줍니다. Python 프로세서가 감지 결과를 인원수로 바꾸고 인원수는 DynamoDB에 저장됩니다. API Gateway 뒤의 Lambda 함수가 이를 제공하고 React 대시보드가 그 API를 읽습니다. 오후 중반쯤 대시보드는 공개 URL에 올라갔습니다. iPad에서 페이지를 새로고침하며 아침 식사 때 계획한 것이 이제 인터넷에 올라와 있다는 사실에 감탄했던 기억이 납니다.',
  'The counting itself is the first link in that chain. Our {file} (in the shelf below) reads a study-space video frame by frame, sends each frame to Rekognition, and draws a box around every person it finds before writing the headcount out. Here it is running on three source feeds, one mapped to each building.':
    '사람을 세는 일이 그 사슬의 첫 고리입니다. 저희의 {file}(아래 선반에 있습니다)은 학습 공간 영상을 프레임 단위로 읽어 각 프레임을 Rekognition에 보내고 찾아낸 사람마다 박스를 그린 뒤 인원수를 기록합니다. 아래는 건물마다 하나씩 대응시킨 원본 영상 세 개에서 이 코드가 동작하는 모습입니다.',
  "The person-detector running on each building's feed": '건물별 영상에서 동작하는 사람 감지기',
  // the detection carousel
  "A window titled 'Campus Pulse — gerstein-library#2F' plays busy library footage with a green box drawn around every person and '23 person(s)' counted in green at the top.":
    "'Campus Pulse — gerstein-library#2F'라는 제목의 창에서 붐비는 도서관 영상이 재생되며 모든 사람 주위에 초록색 박스가 그려지고 상단에 '23 person(s)'가 초록색으로 표시됩니다.",
  'The detector on the busiest feed, gerstein-library#2F, boxing and counting 23 people at once.': '가장 붐비는 영상 gerstein-library#2F에서 동작하는 감지기. 한 번에 23명을 박스로 표시하고 셉니다.',
  "A window titled 'Campus Pulse — bahen-centre#2F' plays office CCTV footage with a green box tracking each person and a live count at the top.":
    "'Campus Pulse — bahen-centre#2F'라는 제목의 창에서 사무실 CCTV 영상이 재생되며 초록색 박스가 사람마다 따라붙고 상단에 실시간 인원수가 표시됩니다.",
  'The same detector on the feed tagged bahen-centre#2F.': 'bahen-centre#2F로 태그된 영상에서 동작하는 같은 감지기.',
  "A window titled 'Campus Pulse — sidney-smith#2F' plays study-space footage with a green box on each detected person and the count updating live.":
    "'Campus Pulse — sidney-smith#2F'라는 제목의 창에서 학습 공간 영상이 재생되며 감지된 사람마다 초록색 박스가 표시되고 인원수가 실시간으로 갱신됩니다.",
  'And on sidney-smith#2F: a green box on every person, counted live, frame by frame.': '그리고 sidney-smith#2F에서: 모든 사람에게 초록색 박스가 그려지고 프레임마다 실시간으로 셉니다.',
  "Campus Pulse dashboard on a tablet: 'Live Campus Occupancy Dashboard' showing Sidney Smith as the best location at 26% occupied and Robarts at 58%.":
    "태블릿에 띄운 Campus Pulse 대시보드: 'Live Campus Occupancy Dashboard'에 점유율 26%인 Sidney Smith가 최적 장소로, Robarts는 58%로 표시되어 있습니다.",
  'Mid-afternoon: the dashboard, live on its public URL (shown here in demo view).': '오후 중반: 공개 URL에 올라간 대시보드 (여기서는 데모 화면).',
  'The dashboard kept things simple and clear: a percentage for every floor, low / mid / high color bands, a "best location right now" answer at the top, a daily trend line, and building alerts for things like a broken elevator. When we presented, I opened the architecture walkthrough for the judges and explained our pipeline as simply as I could, even though I had only learned these services that morning.':
    '대시보드는 단순하고 명확하게 유지했습니다. 층마다 퍼센트, 낮음 / 보통 / 높음 색상 구간, 상단의 "지금 가장 좋은 장소" 답, 일간 추이 선, 엘리베이터 고장 같은 건물 알림입니다. 발표 때는 제가 심사위원들 앞에서 아키텍처 설명을 열었습니다. 그날 아침에야 배운 서비스들이었지만 저희 파이프라인을 최대한 쉽게 풀어 설명했습니다.',
  'Rather than only describe it, here is the dashboard itself, ported from our React source and running on the demo feed we presented. Search or sort the directory, open any building for its floors and daily trend, flip between cards and table, and watch the occupancy refresh every few seconds.':
    '말로만 설명하는 대신 대시보드를 여기에 두었습니다. 저희 React 소스를 그대로 옮겨 발표 때의 데모 피드로 돌아가게 했습니다. 목록을 검색하거나 정렬하고 건물을 열어 층별 현황과 일간 추이를 보세요. 카드와 표를 오가며 몇 초마다 점유율이 갱신되는 모습도 확인할 수 있습니다.',
  'A self-contained reproduction of our React dashboard on the presentation data; the real one read live counts from the AWS pipeline.':
    '발표 데이터로 동작하는 React 대시보드의 독립 재현본입니다. 실제 대시보드는 AWS 파이프라인에서 실시간 인원수를 읽었습니다.',
  'Screen recording of the Campus Pulse dashboard in use': 'Campus Pulse 대시보드 사용 화면 녹화',
  'The demo, recorded on the iPad at 2:26 that afternoon.': '그날 오후 2시 26분에 iPad로 녹화한 데모.',
  'The deck we presented': '발표한 슬라이드',
  'The slides themselves, turned left and right, with a note under each on what it covered and who spoke to it.':
    '슬라이드를 좌우로 넘겨 볼 수 있으며 각 슬라이드 아래에는 어떤 내용을 다뤘고 누가 발표했는지 메모를 달았습니다.',
  'Campus Pulse presentation': 'Campus Pulse 발표 자료',
  // the deck notes
  'Title slide: Campus Pulse, a real-time campus facility occupancy dashboard, by Team 4 — Junwhan, Henry, Suyeon, and Byeongmin.':
    '표지: 실시간 캠퍼스 시설 점유율 대시보드 Campus Pulse, Team 4 — Junwhan, Henry, Suyeon, Byeongmin.',
  'The problem: students move all day between libraries, gyms, study spaces, and dining halls, with no real-time signal of how full each floor is, so they keep walking into crowded rooms and wasting the trip.':
    '문제: 학생들은 하루 종일 도서관, 체육관, 학습 공간, 식당 사이를 오가지만 각 층이 얼마나 찼는지 알려 주는 실시간 신호가 없어 붐비는 방에 들어갔다가 헛걸음을 반복합니다.',
  'The pipeline, from the top: camera sensors capture raw video of a study space. (This is where I opened the architecture walkthrough.)':
    '파이프라인의 시작: 카메라 센서가 학습 공간의 원본 영상을 촬영합니다. (제가 아키텍처 설명을 시작한 슬라이드입니다.)',
  'Amazon Rekognition turns that video into a numerical headcount, detecting people frame by frame without us training a model of our own.':
    'Amazon Rekognition이 그 영상을 숫자 인원수로 바꿉니다. 모델을 직접 학습시키지 않고도 프레임마다 사람을 감지합니다.',
  'The detector running on a real frame: every person boxed, with "gerstein-library#2F | 26 person(s)" counted live in the corner.':
    '실제 프레임에서 동작하는 감지기: 모든 사람에게 박스가 그려지고 구석에 "gerstein-library#2F | 26 person(s)"가 실시간으로 표시됩니다.',
  'The headcounts are written to and continuously updated in DynamoDB. (My slide.)': '인원수는 DynamoDB에 기록되고 계속 갱신됩니다. (제 슬라이드입니다.)',
  'A Lambda function reads from DynamoDB, organizes the numbers, and generates the API response.': 'Lambda 함수가 DynamoDB에서 데이터를 읽어 숫자를 정리하고 API 응답을 생성합니다.',
  'API Gateway serves that response to the React frontend, which draws the occupancy floor by floor in real time.':
    'API Gateway가 그 응답을 React 프런트엔드에 제공하고 프런트엔드는 층별 점유율을 실시간으로 그립니다.',
  'What students actually see: real-time building density, floor-by-floor occupancy in percentages and colour, the least-crowded facility, and a crowd trend over time.':
    '학생이 실제로 보는 화면: 실시간 건물 밀도, 퍼센트와 색상으로 표시한 층별 점유율, 가장 한산한 시설, 시간에 따른 혼잡도 추이.',
  'The live dashboard: per-floor density cards (2F at 96%, 4F at 35%) and the day’s occupancy trend, peaking in the mid-afternoon.':
    '실시간 대시보드: 층별 밀도 카드(2F 96%, 4F 35%)와 오후 중반에 정점을 찍는 그날의 점유율 추이.',
  'Future steps: library room-booking status, a GPS route map, AI trend prediction, an emergency alert tied to density, and expansion to dining halls and rest spaces.':
    '향후 계획: 도서관 스터디룸 예약 현황, GPS 경로 지도, AI 추이 예측, 밀도와 연동된 긴급 알림, 식당과 휴게 공간까지 확장.',
  'The demo: a QR code to the live Campus Pulse site, hosted on AWS API Gateway. (My slide again.)':
    '데모: AWS API Gateway에 호스팅된 실제 Campus Pulse 사이트로 연결되는 QR 코드. (역시 제 슬라이드입니다.)',
  'Thank you.': '감사합니다.',
  'And the code behind the system opens right here too:': '시스템 뒤의 코드도 바로 여기서 열어 볼 수 있습니다:',
  // the code shelf
  'the Rekognition engine · Python · 232 lines': 'Rekognition 엔진 · Python · 232줄',
  'the Lambda API · Python · 118 lines': 'Lambda API · Python · 118줄',
  'infrastructure setup · Python · 111 lines': '인프라 설정 · Python · 111줄',
  'building & floor model · Python · 71 lines': '건물·층 모델 · Python · 71줄',
  'the dashboard · React · 967 lines': '대시보드 · React · 967줄',
  'S3 & API deployment · shell · 168 lines': 'S3·API 배포 · shell · 168줄',
  'The team': '팀',
  'Campus Pulse was built by four people who had mostly just met: Joshua, Suyeon, Byeongmin, and me, registered under the team code 6SIX7. We split the work roughly along the pipeline. Detection and the AWS setup went to one side, the dashboard and its data to the other, and we merged everything in the final hours. Building MONO had taught me three lessons the hard way: break a complex problem into smaller units, put structure ahead of speed, and test while you build instead of after. We spent the first half hour agreeing on what we would not build, and that decision saved us at the end of the day, when everything had to come together at once.':
    'Campus Pulse는 대부분 그날 처음 만난 네 사람이 만들었습니다. Joshua, Suyeon, Byeongmin과 저, 팀 코드 6SIX7로 등록했습니다. 일은 대략 파이프라인을 따라 나눴습니다. 감지와 AWS 설정은 한쪽이, 대시보드와 그 데이터는 다른 쪽이 맡았습니다. 마지막 몇 시간 동안 모든 것을 합쳤습니다. MONO를 만들며 어렵게 배운 세 가지 교훈이 있었습니다. 복잡한 문제는 작은 단위로 나눌 것, 속도보다 구조를 앞세울 것, 다 만든 뒤가 아니라 만들면서 테스트할 것. 저희는 첫 30분을 무엇을 만들지 않을지 합의하는 데 썼습니다. 모든 것을 한꺼번에 합쳐야 했던 하루의 마지막에 그 결정이 저희를 구했습니다.',
  'The four teammates posing around a large AWS cloud-logo sign in front of a wall patterned with binary digits.': '이진수 패턴 벽 앞의 커다란 AWS 구름 로고 간판 주위에서 포즈를 취한 네 명의 팀원.',
  'Team 6SIX7, in front of the AWS sign.': 'AWS 간판 앞의 6SIX7 팀.',
  'What I learned': '배운 것',
  'The concrete lessons were about AWS. I learned that Rekognition lets you use serious computer vision without training or hosting your own model. I learned how DynamoDB stores and serves the readings, how Lambda and API Gateway turn a function into an API, and how a static site on S3 becomes a URL anyone can open. In one focused day, I went from never having used AWS to having our service live on a public URL, and that changed my sense of what a single day of work can do.':
    '구체적인 교훈은 AWS에 관한 것이었습니다. Rekognition을 쓰면 모델을 직접 학습시키거나 호스팅하지 않고도 본격적인 컴퓨터 비전을 활용할 수 있다는 것을 배웠습니다. DynamoDB가 측정값을 저장하고 제공하는 방식, Lambda와 API Gateway가 함수 하나를 API로 만드는 방식, S3의 정적 사이트가 누구나 열 수 있는 URL이 되는 과정을 배웠습니다. 집중한 하루 만에 AWS를 한 번도 써 본 적 없는 상태에서 저희 서비스를 공개 URL에 올리기까지 갔습니다. 그 경험은 하루의 작업이 무엇을 해낼 수 있는지를 보는 제 감각을 바꿔 놓았습니다.',
  'I also learned something about being honest in design. Twice that day, we gave up an idea that sounded impressive for one that worked: first when we chose the sensor, and again when we trimmed the features down to what could be real by 5 p.m. I try to remember that whenever one of my projects starts becoming too ambitious.':
    '설계에서 솔직해지는 것에 대해서도 배웠습니다. 그날 저희는 두 번, 그럴듯하게 들리는 아이디어를 버리고 실제로 동작하는 쪽을 택했습니다. 처음은 센서를 고를 때였고 다음은 오후 5시까지 실제로 만들 수 있는 것만 남기고 기능을 덜어낼 때였습니다. 제 프로젝트가 지나치게 야심 차지기 시작할 때마다 그 일을 떠올리려고 합니다.',
  'Where this goes': '앞으로의 방향',
  'Campus Pulse has an obvious roadmap: room booking on top of the live map, occupancy prediction once the readings accumulate into history, richer alerts, more buildings. But for me the project matters mostly as a first proof of a bigger belief I wrote into that application: campus information lives in fragments, and it should feel like one system. I had even sketched what I wanted in the application, one place where every campus event can be found and joined in a click, synced to your calendar, with deadlines that reach you instead of waiting to be found. Campus Pulse is the first piece of that idea I have built and put on the internet, and I want to keep building the next pieces the same way.':
    'Campus Pulse의 로드맵은 분명합니다. 실시간 지도 위의 스터디룸 예약, 측정값이 이력으로 쌓이면 가능해질 점유율 예측, 더 풍부한 알림, 더 많은 건물. 하지만 이 프로젝트가 저에게 중요한 이유는 다릅니다. 지원서에 적었던 더 큰 믿음을 처음으로 증명했습니다. 캠퍼스 정보는 조각조각 흩어져 있고 하나의 시스템처럼 느껴져야 한다는 믿음입니다. 지원서에는 원하는 모습까지 그려 두었습니다. 캠퍼스의 모든 행사를 한곳에서 찾아 클릭 한 번으로 참여하고 캘린더에 동기화되며 마감일이 발견되기를 기다리는 대신 먼저 찾아오는 곳입니다. Campus Pulse는 그 아이디어 중 제가 처음으로 만들어 인터넷에 올린 조각입니다. 다음 조각들도 같은 방식으로 계속 만들어 가고 싶습니다.',
  'Henry standing beside the large AWS cloud sign.': '커다란 AWS 구름 간판 옆에 서 있는 Henry.',
  'After the event ended, on the way out.': '행사가 끝난 뒤, 나가는 길에.',
  "On the application I promised that I would learn quickly. Leaving at five o'clock, I felt I had kept that promise once, and I want to keep testing it.":
    '지원서에서 저는 빠르게 배우겠다고 약속했습니다. 5시에 나서면서 그 약속을 한 번은 지켰다고 느꼈습니다. 앞으로도 계속 시험해 보고 싶습니다.',

  // ── the dashboard ──
  'Try it yourself': '직접 써 보세요',
  'UofT Smart Campus': 'UofT 스마트 캠퍼스',
  'Refresh': '새로고침',
  "Running the mock feed — the live camera backend isn't hosted here.": '모의 피드로 동작 중입니다 — 실시간 카메라 백엔드는 여기에 호스팅되어 있지 않습니다.',
  'demo data': '데모 데이터',
  'Live Campus Occupancy Dashboard': '실시간 캠퍼스 점유율 대시보드',
  'Building-level crowd status and floor-by-floor density. Designed for quick scanning and one-click building details.':
    '건물별 혼잡도와 층별 밀도를 보여 줍니다. 빠르게 훑어보고 클릭 한 번으로 건물 상세를 볼 수 있도록 설계했습니다.',
  'Best location recommendation': '최적 장소 추천',
  'best around {time}': '{time} 무렵이 가장 좋습니다',
  'Current best estimate: {n}%': '현재 최적 추정치: {n}%',
  'Recommended location based on occupancy data.': '점유율 데이터를 바탕으로 추천한 장소입니다.',
  'Active building alerts': '현재 건물 알림',
  'Emergency reported.': '긴급 상황이 보고되었습니다.',
  'Building Directory': '건물 목록',
  'Choose a building to see its information page, floor details, and daily trend.': '건물을 선택하면 정보 페이지, 층별 상세, 일간 추이를 볼 수 있습니다.',
  'Search supported buildings': '지원 건물 검색',
  'Sort buildings': '건물 정렬',
  'Most crowded': '혼잡한 순',
  'Least crowded': '한산한 순',
  'A → Z': '이름순 (A → Z)',
  'Low': '낮음',
  'Mid': '보통',
  'High': '높음',
  'No buildings match your search.': '검색 결과와 일치하는 건물이 없습니다.',
  'Updated {when}': '{when} 업데이트',
  'Just now': '방금 전',
  '1 min ago': '1분 전',
  '2 mins ago': '2분 전',
  '3 mins ago': '3분 전',
  '4 mins ago': '4분 전',
  'Increasing': '증가 중',
  'Decreasing': '감소 중',
  'Stable': '안정',
  // building detail
  'Live building info, floor density, and daily trend.': '실시간 건물 정보, 층별 밀도, 일간 추이입니다.',
  'Back': '뒤로',
  'Live building density and service status overview.': '실시간 건물 밀도와 서비스 상태 개요입니다.',
  'Current occupancy': '현재 점유율',
  'Emergency / service alert': '긴급 / 서비스 알림',
  'An emergency has been reported in this building.': '이 건물에 긴급 상황이 보고되었습니다.',
  'Operating hours': '운영 시간',
  'Floor Details': '층별 상세',
  'Per-floor density snapshot for the selected building.': '선택한 건물의 층별 밀도 스냅샷입니다.',
  'View': '보기',
  'Cards': '카드',
  'Table': '표',
  'Floor': '층',
  'Status': '상태',
  'Occupancy': '점유율',
  'Updated': '업데이트',
  'Density': '밀도',
  'Today’s Occupancy Trend': '오늘의 점유율 추이',
  'See when this building is busier or quieter during the day.': '하루 중 이 건물이 언제 붐비고 언제 한산한지 확인하세요.',
  "Today's occupancy trend by hour": '시간대별 오늘의 점유율 추이',
  // the mock feed (building names stay as they are)
  'Study spaces filling quickly.': '학습 공간이 빠르게 차고 있습니다.',
  'Lower traffic than usual.': '평소보다 한산합니다.',
  'Moderate building traffic.': '건물 이용이 보통 수준입니다.',
  'Mostly open right now.': '지금은 대부분 비어 있습니다.',
  'Temporary elevator disruption reported. Use alternate route.': '엘리베이터 일시 운행 중단이 보고되었습니다. 다른 경로를 이용하세요.',
  'Study Space': '학습 공간',
  'Quiet Zones': '조용한 구역',
  'Group Rooms': '그룹 스터디룸',
  'Silent Study': '정숙 학습실',
  'Computers': '컴퓨터',
  'Medical Sciences': '의과학 자료',
  'Labs': '실습실',
  'Lecture Halls': '강의실',
  'Study Area': '학습 구역',
  'Classrooms': '교실',
  'Transit Nearby': '대중교통 인접',
  'Sun 10AM–12AM • Mon–Thu 24 Hours • Fri 12AM–11PM • Sat 9AM–10PM': '일 10AM–12AM • 월–목 24시간 • 금 12AM–11PM • 토 9AM–10PM',
  'Open now; current closing time varies by day': '현재 개방 중; 마감 시간은 요일마다 다릅니다',
  'General access often listed around 8AM–6PM; after-hours access may require authorization':
    '일반 출입은 보통 8AM–6PM으로 안내되며, 그 외 시간에는 출입 승인이 필요할 수 있습니다',
  'Mon–Thu 10AM–6:30PM • Fri 10AM–2PM': '월–목 10AM–6:30PM • 금 10AM–2PM',
  'Robarts Common overnight access runs Sunday to Thursday during fall and winter terms.': 'Robarts Common의 야간 이용은 가을·겨울 학기 동안 일요일부터 목요일까지 가능합니다.',
  'Gerstein hours are posted weekly on U of T Libraries and can change by date.': 'Gerstein의 운영 시간은 U of T Libraries에 매주 게시되며 날짜에 따라 바뀔 수 있습니다.',
  'Bahen access can vary by room, lab, academic schedule, and authorization level.': 'Bahen의 출입은 방, 실습실, 학사 일정, 출입 권한에 따라 다를 수 있습니다.',
  'These are Sidney Smith Commons hours on the ground floor, not necessarily the full building.': '이 시간은 1층 Sidney Smith Commons의 운영 시간이며 건물 전체에 해당하지 않을 수 있습니다.',
};

export default ko;
