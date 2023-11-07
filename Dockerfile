FROM node:16

ENV NODE_ENV development

# install backend node_modules
WORKDIR /usr/src/app/backend
COPY backend/package-lock.json backend/package.json ./
RUN npm i

# copy source
WORKDIR /usr/src/app
COPY . ./

# build backend
WORKDIR /usr/src/app/backend
RUN npm run build

EXPOSE 3000

WORKDIR /usr/src/app

ENV NODE_PATH ./backend/node_modules
ENV TS_NODE_BASEURL ./_build_

CMD ["node", "-r", "tsconfig-paths/register", "server.js"]