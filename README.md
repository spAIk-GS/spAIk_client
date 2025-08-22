# 📦 React 프로젝트 실행 가이드

이 문서는 GitHub에서 React 프로젝트를 클론하고 실행하는 방법을 안내합니다.

---

## ✅ 사전 준비

- Git 설치: [https://git-scm.com/](https://git-scm.com/)
- Node.js 및 npm 설치: [https://nodejs.org/](https://nodejs.org/)

```powershell
# 설치 확인
git --version
node -v
npm -v
📥 프로젝트 클론
아래 명령어를 통해 GitHub에서 프로젝트를 로컬에 복사합니다:

git clone https://github.com/es1206/spAIk_client.git

cd spAIk_client

📦 의존성 설치
React 프로젝트를 실행하기 위해 필요한 패키지를 설치합니다:

npm install

📚 추가 라이브러리 설치
다음은 프로젝트에서 사용하는 주요 라이브러리입니다:

npm install react-router-dom

npm install framer-motion

npm install @react-oauth/google

npm install jwt-decode

npm install axios

npm i recharts

npm i react-markdown remark-gfm

🚀 개발 서버 실행

npm run dev
```

# 🚀 spAIk-client 실행 가이드 (Docker)
- 이 프로젝트는 Docker를 사용하여 컨테이너 환경에서 쉽게 실행할 수 있습니다. 아래 가이드에 따라 프로젝트를 빌드하고 실행하세요.

## 1. 사전 준비
- Docker Desktop: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) 설치 및 실행: Docker 컨테이너를 관리하기 위한 필수 도구입니다.

## 2. 실행 명령어
- 아래 순서대로 명령어를 입력하여 프로젝트를 실행합니다.
```
Bash

#📥 GitHub에서 프로젝트 클론
git clone https://github.com/spAIk-GS/spAIk_client.git

# 클론된 폴더로 이동
cd spAIk_client

# Docker 이미지 빌드
# 이미지 이름은 소문자로 지정해야 합니다.
docker build -t spaik_client .

# Docker 컨테이너 실행
# 애플리케이션은 3000번 포트에서 실행됩니다.
docker run -p 3000:3000 spaik_client
```
## 3. 애플리케이션 접속
- 위 명령어를 실행하면 애플리케이션이 백그라운드에서 실행됩니다. 웹 브라우저를 열고 다음 주소로 접속하여 애플리케이션을 확인하세요.

- http://localhost:3000
