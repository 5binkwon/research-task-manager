 연구 업무 관리 (research-task-manager)

 프로젝트 목적

 - 연구 과제(프로젝트) 단위로 업무를 나누고, 상태·우선순위·마감일·진행 로그로 진척을 추적합니다.
 - 과제 진행 상황을 읽기 전용 공유 링크로 외부에 보여 줄 수 있습니다.
 - 할 일(/todos) 은 Supabase에 실제로 저장되며, 사용자별 데이터 격리는 Postgres RLS가 보장합니다.

 ▎ 현재 상태: 과제·업무·진행 로그·공유 링크 화면은 mock 저장소(메모리, 새로고침 시 초기화)로 동작합니다.
 ▎ Supabase에 연결된 화면은 할 일 뿐이며, 나머지는 같은 저장소 인터페이스(lib/data/repo.ts)를 유지한 채 순차적으로 옮길 예정입니다.

 기술 스택

 ┌────────────┬──────────────────────────────────────────────────────────────────────┐
 │    영역    │                              사용 기술                               │
 ├────────────┼──────────────────────────────────────────────────────────────────────┤
 │ 프레임워크 │ Next.js 16 (App Router, Turbopack)                                   │
 ├────────────┼──────────────────────────────────────────────────────────────────────┤
 │ UI         │ React 19, Tailwind CSS 4                                             │
 ├────────────┼──────────────────────────────────────────────────────────────────────┤

 로컬 실행 방법

 요구 사항: Node.js 20.9 이상, Supabase 프로젝트 1개

 git clone <repository-url>
 cd research-task-manager
 npm install

 1. 프로젝트 루트에 .env.local을 만들고 아래 환경 변수를 채웁니다.
 2. Supabase SQL Editor에서 데이터 모델의 SQL을 실행합니다.
 3. Supabase 대시보드 → Authentication → Sign In / Providers 에서 Allow anonymous sign-ins 를 켭니다.
 4. 개발 서버를 실행합니다.

 npm run dev     # http://localhost:3000
 npm run lint    # ESLint
 npm run build   # 프로덕션 빌드
   이름                 │                           설명                            │
 ├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ NEXT_PUBLIC_SUPABASE_URL             │ Supabase 프로젝트 URL (https://<project-ref>.supabase.co) │
 ├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY │ Supabase publishable key (sb_publishable_...)             │
 └──────────────────────────────────────┴───────────────────────────────────────────────────────────┘

 - 두 값은 빌드 시 브라우저 번들에 포함되는 공개 값입니다. 데이터 보호는 RLS가 담당합니다.
 - service_role / sb_secret_... 키는 RLS를 우회하므로 NEXT_PUBLIC_ 변수에 절대 넣지 마세요.
 - .env* 파일은 .gitignore로 커밋에서 제외됩니다.

LS 개요

 public.todos

 ┌──────────────┬─────────────┬───────────────────────────────────────────────────────┐
 │     컬럼     │    타입     │                         제약                          │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ id           │ uuid        │ PK, 기본값 gen_random_uuid()                          │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ user_id      │ uuid        │ not null, auth.users(id) 참조, 사용자 삭제 시 cascade │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ title        │ text        │ not null                                              │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ category     │ text        │ not null                                              │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ priority     │ text        │ not null (low / medium / high / urgent)               │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ due_date     │ date        │ nullable                                              │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ is_completed │ boolean     │ not null, 기본값 false                                │
 ├──────────────┼─────────────┼───────────────────────────────────────────────────────┤
 │ created_at   │ timestamptz │ not null, 기본값 now()                                │
 └──────────────┴─────────────┴───────────────────────────────────────────────────────┘

 RLS

 RLS를 켜고 authenticated 역할에 작업별 정책 4개를 둡니다. 모두 본인 행만 허용합니다.

 ┌──────────────────┬────────┬─────────────────────────────────────────────────────────────────┐
 │       정책       │  작업  │                              조건                               │
 ├──────────────────┼────────┼─────────────────────────────────────────────────────────────────┤
 │ todos_select_own │ SELECT │ using (auth.uid() = user_id)                                    │

 <details>
 <summary>생성 SQL</summary>

 create table public.todos (
   id           uuid        primary key default gen_random_uuid(),
   user_id      uuid        not null references auth.users(id) on delete cascade,
   title        text        not null,
   category     text        not null,
   priority     text        not null,
   due_date     date,
   is_completed boolean     not null default false,
   created_at   timestamptz not null default now()
 );
e public.todos enable row level security;

 create policy "todos_select_own" on public.todos
   for select to authenticated using (auth.uid() = user_id);
 create policy "todos_insert_own" on public.todos
   for insert to authenticated with check (auth.uid() = user_id);
 create policy "todos_update_own" on public.todos
   for update to authenticated
   using (auth.uid() = user_id) with check (auth.uid() = user_id);
 create policy "todos_delete_own" on public.todos
용자도 auth.users에 행이 생기고 authenticated 역할을 받으므로 위 정책이 그대로 적용됩니다.
 3. 클라이언트는 insert 시 user_id에 로그인 사용자 id를 넣고, update 시에는 user_id를 보내지 않습니다.

 검증: 두 사용자를 만들어 트랜잭션 안에서 시뮬레이션(후 롤백)한 결과, 타인 명의 insert·소유자 변경은 42501로 거부되고 타인 행의 조회·수정·삭제와 비로그인(anon) 조회는 0행이었습니다.

 AI 생성 코드에서 직접 검토·수정한 내용

 초기 Supabase 연동 코드는 AI(Claude Code)로 생성했고, 이후 리뷰로 아래 문제를 찾아 수정했습니다.

│ 생성됨                                      │                                                     │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │ 정확성  │ 마감일 표기가 mock용 고정 날짜(TODAY)       │ formatDue에 today 인자 추가, 할 일 화면은           │
 │         │ 기준이라 다음 날부터 "N일 남음"이 틀어짐    │ 브라우저의 실제 날짜 사용                           │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │ 안정성  │ 환경 변수가 없으면 루트 프로바이더에서      │ 예외를 잡아 해당 화면에서만 오류 배너 표시          │
 │         │ 예외가 나 앱 전체가 멈춤                    │                                                     │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │         │ 인증 프로바이더가 루트에 있어 공유          │                                                     │
 │ 범위    │ 링크·로그인 페이지 방문자도 익명 사용자로   │ 프로바이더를 app/(app)/layout.tsx로 이동            │
 │         │ 생성됨                                      │                                                     │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │ 오류    │ 권한 오류만 한국어 처리, 네트워크·JWT       │ lib/supabase/errors.ts로 오류 문구 통합, 실패해도   │
 │ 처리    │ 만료는 영문 원문 노출, 재조회 실패 시       │ 기존 목록 유지, 세션 만료 시 데이터 접근 불가 안내  │
│ 조회 hook 로직이 mock용 useAsync와 중복     │ 공용 useLoad hook으로 분리, useAsync는 이를 감싸는  │
 │ 코드    │                                             │ 형태로 축소                                         │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │ 효율    │ 추가·수정·삭제마다 목록 전체 재조회         │ 서버가 반환한 행으로 로컬 목록 갱신(mutate +        │
 │         │                                             │ sortTodos)                                          │
 ├─────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
 │ 구조    │ Client Component 범위가 넓음, 쓰이지 않는   │ 페이지 헤더를 서버 컴포넌트로 이동, loading.tsx     │
 │         │ loading.tsx                                 │ 삭제                                                │
 └─────────┴─────────────────────────────────────────────┴─────────────────────────────────────────────────────┘

 남은 과제

 - DB 무결성: priority 허용값, title·category 빈 문자열을 막는 check 제약 (현재 클라이언트 검증만 존재)
 - RLS 성능: user_id 인덱스, 정책을 (select auth.uid()) = user_id 형태로 변경
 - mock 인증과 Supabase 익명 인증의 통합, 나머지 화면의 Supabase 이전
 - supabase gen types로 DB 타입 생성 (현재 수동 타입 + 형변환)
 - 익명 로그인 남용 방지를 위한 CAPTCHA 설정
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
