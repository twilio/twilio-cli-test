FROM node:14.0.0
RUN apt-get update && apt-get install -y libsecret-1-dev

RUN mkdir /cli
WORKDIR /cli
COPY . .
RUN npm install
CMD ["npm", "test"]
