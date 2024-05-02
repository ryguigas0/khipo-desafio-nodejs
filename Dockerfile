FROM node:21.6.2-alpine3.19

WORKDIR /

COPY package.json ./
COPY package-lock.json ./

RUN npm i

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "prod" ]