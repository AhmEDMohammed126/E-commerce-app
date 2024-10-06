From node:20.11.1 as development

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]

From node:20.11.1 as production

WORKDIR /app

COPY package.json .

RUN npm install --only=production

COPY . .

CMD [ "npm", "run", "start:prod" ]
