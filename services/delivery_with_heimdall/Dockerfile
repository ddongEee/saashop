# syntax=docker/dockerfile:experimental
# FROM --platform=linux/amd64 node:18-alpine
FROM node:18-alpine

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN npm config set strict-ssl false
RUN npm install

COPY . .

EXPOSE 80
EXPOSE 443

CMD ["node", "app.js"]


