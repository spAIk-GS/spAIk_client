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