FROM node:20-alpine

WORKDIR /usr/src/app

COPY package-lock.json package.json ./

RUN npm ci && npm install cross-spawn@7.0.5

COPY . .

EXPOSE 3000

CMD ["npm", "start"]