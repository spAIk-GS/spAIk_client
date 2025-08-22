# 1. Node 기반 이미지
FROM node:20-alpine

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. package.json 복사 후 설치
COPY package*.json ./
RUN npm install

# 4. 소스 복사
COPY . .

# 5. Vite 빌드
RUN npm run build

# 6. 정적 파일 서빙 (serve 사용)
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
