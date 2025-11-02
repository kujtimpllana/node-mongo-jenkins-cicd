FROM node:20-alpine

WORKDIR /usr/src/app

COPY package-lock.json package.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]