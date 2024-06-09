FROM node:18-alpine

COPY dist/index.mjs /index.mjs

RUN apk add --no-cache git

ENTRYPOINT [ "node", "/index.mjs" ]
