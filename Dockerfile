FROM node:8

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN npm install

# Bundle app source
COPY . /app
CMD "node" "mongomart.js"
EXPOSE 3000